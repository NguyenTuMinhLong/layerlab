import { Schema, model } from "mongoose";

const designerSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true },
    bio: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    joinedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

/** Mongoose model for creators who publish LayerLab products. */
export const Designer = model("Designer", designerSchema);
