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

        const tagMatch = text.match(/PetId[:\s]*([A-Za-z0-9]+)/i);
        const petId = tagMatch ? tagMatch[1] : null;

        console.log('lll: ', petId)

        if (!petId) {
          console.log("⚠️ No petId found in message");
          continue;
        }

        const pet = await Pet.findById(petId);
        console.log('pet: ', pet)

        await FinderReport.create({
          pet: pet._id,
          messageText: text,
          finderPhone: finder,              
          messageText: text || null,
          location: msg.location
            ? {
                lat: msg.location.latitude || null,
                lng: msg.location.longitude || null,
                address: msg.location.name || null,
              }
            : null,
          media: msg?.image || null, 
          status: "reported",
        });


      console.log(`📨 Finder reported tag ${petId} from ${finder}`);

      console.log("📤 Sending message to owner:", pet.contactNumber);
      
      const contactNum = "91" + pet.contactNumber;

      //await sendTemplateMessage(contactNum, 'found_notification', [pet.ownerName, pet.petName, pet._id], pet._id);


        const session = await WhatsAppSession.findOne({ pet: pet._id });
        const isActive = session && session.isActive();

        if (isActive) {
          await sendSessionMessage(contactNum, `(Finder): ${text}\nPet:${pet.petName}`, petId);
        } else {
           await sendTemplateMessage(contactNum, 'found_notification', [pet.ownerName, pet.petName, pet._id], pet._id);
          //await sendTemplateMessage(pet.contactNumber, 'hello_world', [], pet._id);
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

























