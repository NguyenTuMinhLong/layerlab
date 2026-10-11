import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },
    designerId: {
      type: Schema.Types.ObjectId,
      ref: "Designer",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    tags: [{ type: String, required: true, trim: true }],
    price: { type: Number, required: true, min: 0 },
    publishingYear: { type: Number, required: true },
    numOfFavorites: { type: Number, required: true, min: 0, default: 0 },
    compatibleWith: [{ type: String, required: true }],
    license: {
      type: String,
      required: true,
      enum: ["Personal", "Commercial", "Extended"],
    },
    version: { type: String, required: true },
    featured: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      required: true,
      enum: ["draft", "published"],
      default: "published",
    },
    previewVariant: { type: Number, required: true, min: 1, max: 6 },
    sourceLabel: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
  },
  { timestamps: true },
);

productSchema.index({ title: 1 });
productSchema.index({ categoryId: 1, publishingYear: -1 });

/** Mongoose model for Figma assets sold through the marketplace. */
export const Product = model("Product", productSchema);
