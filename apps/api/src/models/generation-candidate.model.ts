import { Schema, model } from "mongoose";

const generationCandidateSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tags: [{ type: String, required: true, trim: true }],
    suggestedCategorySlug: { type: String, required: true, trim: true },
    previewVariant: { type: Number, required: true, min: 1, max: 6 },
    sourceLabel: { type: String, required: true, trim: true },
    sourceUrl: { type: String, required: true, trim: true },
    generationNote: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

/** Mongoose model for ready-to-publish component ideas in the admin queue. */
export const GenerationCandidate = model(
  "GenerationCandidate",
  generationCandidateSchema,
);
