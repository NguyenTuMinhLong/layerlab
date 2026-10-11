import { Schema, model } from "mongoose";

const favoriteSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    visitorKey: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ productId: 1, visitorKey: 1 }, { unique: true });

/** Mongoose model for product favorite records. */
export const Favorite = model("Favorite", favoriteSchema);
