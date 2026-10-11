import { Router } from "express";
import { z } from "zod";

import { Category } from "../models/category.model.js";
import { GenerationCandidate } from "../models/generation-candidate.model.js";
import { Product } from "../models/product.model.js";
import { ensureGenerationQueue } from "../services/generation-queue.js";

export const generationQueueRouter = Router();

generationQueueRouter.get("/", async (_request, response, next) => {
  try {
    await ensureGenerationQueue();
    response.json(
      await GenerationCandidate.find().sort({ createdAt: 1 }).limit(10).lean(),
    );
  } catch (error) {
    next(error);
  }
});

generationQueueRouter.post("/:id/publish", async (request, response, next) => {
  try {
    const input = z
      .object({
        designerId: z.string().regex(/^[a-f\d]{24}$/i),
        categoryId: z
          .string()
          .regex(/^[a-f\d]{24}$/i)
          .optional(),
        price: z.number().min(0).default(0),
      })
      .parse(request.body);
    const candidate = await GenerationCandidate.findById(request.params.id);
    if (!candidate) {
      response.status(404).json({ message: "Generation candidate not found" });
      return;
    }
    const category = input.categoryId
      ? await Category.findById(input.categoryId)
      : ((await Category.findOne({ slug: candidate.suggestedCategorySlug })) ??
        (await Category.findOne()));
    if (!category) {
      response.status(400).json({ message: "A matching category is required" });
      return;
    }
    const slug = `${candidate.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
    const product = await Product.create({
      title: candidate.title,
      slug,
      description: candidate.description,
      designerId: input.designerId,
      categoryId: category._id,
      tags: candidate.tags,
      price: input.price,
      publishingYear: new Date().getFullYear(),
      numOfFavorites: 0,
      compatibleWith: ["Figma"],
      license: "Personal",
      version: "1.0",
      featured: false,
      status: "published",
      previewVariant: candidate.previewVariant,
      sourceLabel: candidate.sourceLabel,
      sourceUrl: candidate.sourceUrl,
    });
    await candidate.deleteOne();
    await ensureGenerationQueue();
    response.status(201).json(product);
  } catch (error) {
    next(error);
  }
});
