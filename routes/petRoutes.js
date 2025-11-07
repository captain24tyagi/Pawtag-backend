import express from "express";
import Pet from "../models/Pet.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

const router = express.Router();

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


router.get("/", async (req, res) => {
  try {
    const pets = await Pet.find().sort({ createdAt: -1 }); 
    res.status(200).json(pets);
  } catch (err) {
    console.error("Error fetching all pets:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.post("/byOwner", async (req, res) => {
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
    res.status(200).json(pet);
  } catch (err) {
    console.error("Error fetching pet:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


export default router;












// import express from "express";
// import Pet from "../models/Pet.js";
// import multer from "multer";
// import { v2 as cloudinary } from "cloudinary";
// import streamifier from "streamifier";
// import { CloudinaryStorage } from "multer-storage-cloudinary";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });


// // const storage = new CloudinaryStorage({
// //   cloudinary,
// //   params: {
// //     folder: "pickpawz/tags",
// //     allowed_formats: ["jpg", "jpeg", "png"],
// //   },
// // });

// // const upload = multer({ storage });
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// const router = express.Router();

// router.post("/register", upload.single("petImageUrl"), async (req, res) => {
//   try {
//     console.log("req.body:", req.body);
//     console.log("req.file:", req.file);

//     const newPet = new Pet({
//       petName: req.body.petName,
//       species: req.body.species,
//       breed: req.body.breed,
//       address: req.body.address,
//       contactNumber: req.body.contactNumber,
//       ownerEmail: req.body.ownerEmail,
//       ownerName: req.body.ownerName,
//       petImageUrl: req.file ? req.file.originalname : null
//     });

//     const savedPet = await newPet.save();
//     res.json(savedPet);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // router.post("/register", upload.single("petImageUrl"), async (req, res) => {
// //   try {
// //     const {
// //       petName,
// //       species,
// //       breed,
// //       address,
// //       contactNumber,
// //       ownerEmail,
// //       ownerName,
// //     } = req.body;

// //     const imageUrl = req.file?.path || "";

// //     // const result = await new Promise((resolve, reject) => {
// //     //   const uploadStream = cloudinary.uploader.upload_stream(
// //     //     { folder: "pickpawz_tags" },
// //     //     (error, result) => {
// //     //       if (result) resolve(result);
// //     //       else reject(error);
// //     //     }
// //     //   );
// //     //   streamifier.createReadStream(file.buffer).pipe(uploadStream);
// //     // });

// //     const newPet = new Pet({
// //       petName,
// //       species,
// //       breed,
// //       address,
// //       contactNumber,
// //       ownerEmail,
// //       ownerName,
// //       petImageUrl: imageUrl,
// //     });
// //     console.log('pet: ', newPet)

// //     const savedPet = await newPet.save();

// //     res.status(201).json({
// //       message: "Pet registered successfully",
// //       pet: savedPet,
// //     });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: "Failed to register pet" });
// //   }
// // });


// router.get("/:petId", async (req, res) => {
//   try {
//     const pet = await Pet.findById(req.params.petId);
//     if (!pet) return res.status(404).json({ error: "Pet not found" });
//     res.json(pet);
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// export default router;
