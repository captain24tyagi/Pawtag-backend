import mongoose from "mongoose";

const whatsappSessionSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Check if the session is active (within 24 hours)
whatsappSessionSchema.methods.isActive = function () {
  const diffHours = (Date.now() - this.lastActivityAt.getTime()) / (1000 * 60 * 60);
  return diffHours <= 24;
};

const WhatsAppSession = mongoose.model("WhatsAppSession", whatsappSessionSchema);
export default WhatsAppSession;
