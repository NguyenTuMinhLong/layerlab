import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

/** Mongoose model for marketplace product categories. */
export const Category = model("Category", categorySchema);
