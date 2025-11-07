import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
  {
    petName: { type: String },
    species: { type: String },
    breed: { type: String },
    address: { type: String },
    contactNumber: { type: String },
    petImageUrl: { type: String },
    ownerEmail: { type: String },
    ownerName: { type: String }
  },
  { timestamps: true }
);

const Pet = mongoose.model("Pet", petSchema);
export default Pet;
