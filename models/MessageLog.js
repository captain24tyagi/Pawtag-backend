import mongoose from "mongoose";

const messageLogSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"], // inbound = from finder/owner to business
      required: true,
    },
    from: { type: String }, // phone number (masked/encrypted if possible)
    to: { type: String },
    messageType: {
      type: String,
      enum: ["text", "image", "template", "session"],
      default: "text",
    },
    body: { type: Object }, // actual message JSON body (can store text or media info)
  },
  { timestamps: true }
);

const MessageLog = mongoose.model("MessageLog", messageLogSchema);
export default MessageLog;
