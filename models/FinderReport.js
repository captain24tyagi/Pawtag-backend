import mongoose from "mongoose";

const finderReportSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet", // links to your Pet model
      required: true,
    },
    finderPhone: { type: String, required: true },
    messageText: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
    media: {
      type: Object,
      default: null,
    },
    status: {
      type: String,
      enum: ["reported", "owner_notified", "owner_replied", "resolved"],
      default: "reported",
    },
  },
  { timestamps: true }
);

const FinderReport = mongoose.model("FinderReport", finderReportSchema);
export default FinderReport;
