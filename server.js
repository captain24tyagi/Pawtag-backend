import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import petRoutes from "./routes/petRoutes.js";
import WhatsAppSession from "./models/WhatsappSession.js";
import Pet from "./models/Pet.js";
import FinderReport from "./models/FinderReport.js";
import { sendSessionMessage, sendTemplateMessage } from "./utils/whatsapp.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


connectDB();

// mount the router that handles multipart/form-data + multer
app.use("/api/pets", petRoutes);

app.get("/", (req, res) => {
  res.send("🐾 PickPawz QR Backend Running...");
});

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

//✅ Webhook verification
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ✅ Webhook receiver
app.post('/webhook', async (req, res) => {
  try {

    console.log("📩 Incoming webhook POST received!");
    console.log("🪶 Raw body:", JSON.stringify(req.body, null, 2)); 

    const entry = req.body.entry?.[0];
    if (!entry?.changes) return res.sendStatus(400);

    for (const change of entry.changes) {
        const msg = change.value?.messages?.[0];
        if (!msg) continue;

        const finder = msg.from;
        const text = msg.text?.body || '';

        console.log(`📨 Message from ${finder}: ${text}`);
        
        const tagMatch = text.match(/PetId[:\s]*([A-Z0-9\-]+)/i);
        const petId = tagMatch ? tagMatch[1] : null;

        if (!petId) {
          console.log("⚠️ No petId found in message");
          continue;
        }

        await FinderReport.create({
          pet: pet._id,
          finder,
          messageText: text,
          location: message.location || null,
          media: message.image || null,
        });

        console.log(`📨 Finder reported tag ${tagId} from ${finder}`);

        if (!petId) continue;
        const pet = await Pet.findOne({ petId });

        const session = await WhatsAppSession.findOne({ pet: pet._id });
        const isActive = session && session.isActive();

        if (isActive) {
          await sendSessionMessage(pet.contactNumber, `(Finder): ${text}\nPet:${pet.petName}`, petId);
        } else {
          await sendTemplateMessage(pet.contactNumber, 'found_notification', [pet.ownerName || 'Owner',  pet.petName || "Your Pet", 'PickPawz Web'], pet._id);
          if (session) {
            session.lastActivityAt = new Date();
            await session.save();
          } else {
            await WhatsAppSession.create({ pet: pet._id });
          }
        }
      }

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

























