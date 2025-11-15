import express from "express";
import Pet from "../models/Pet.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { verifyUserToken, verifyAdminToken } from "../middleware/auth.js";
import crypto from "crypto";

const router = express.Router();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("base64") + ":" + encrypted;
}


// configure cloudinary (ensure env vars are set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

router.post("/register", upload.single("petImageUrl"), async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file && { originalname: req.file.originalname, size: req.file.size });

    let imageUrl = null;

    if (req.file && req.file.buffer) {
      
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "pickpawz/tags", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });


      imageUrl = result.secure_url || result.url || null;
    }

    const newPet = new Pet({
      petName: req.body.petName,
      species: req.body.species,
      breed: req.body.breed,
      address: req.body.address,
      contactNumber: req.body.contactNumber,
      ownerEmail: req.body.ownerEmail,
      ownerName: req.body.ownerName,
      petImageUrl: imageUrl,
    });

    const savedPet = await newPet.save();
    return res.status(201).json({ message: "Pet registered", pet: savedPet });
  } catch (err) {
    console.error("Error in /api/pets/register:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.get("/", verifyAdminToken,  async (req, res) => {
  try {
    const pets = await Pet.find().sort({ createdAt: -1 }); 
    res.status(200).json(pets);
  } catch (err) {
    console.error("Error fetching all pets:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.post("/byOwner", verifyUserToken, async (req, res) => {
  try {
    const { email } = req.body;

    if(!email){
      return res.status(400).json({ message: "Email is required"})
    }

    const pets = await Pet.find({ ownerEmail: email }).sort({ createdAt: -1 });
    return res.status(200).json(pets);

  } catch (err) {
    console.error("Error fetching pets by owner:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.get("/:petId", async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);
    if (!pet) return res.status(404).json({ error: "Pet not found" });

    const encryptedPet = {
      ...pet._doc,
      ownerEmail: encrypt(pet.ownerEmail),
      contactNumber: encrypt(pet.contactNumber),
    };

    res.status(200).json(encryptedPet);
  } catch (err) {
    console.error("Error fetching pet:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


export default router;












