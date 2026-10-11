import { Router } from "express";
import { z } from "zod";

import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_request, response, next) => {
  try {
    response.json(await Category.find().sort({ name: 1 }).lean());
  } catch (error) {
    next(error);
  }
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(8).max(240),
});

categoriesRouter.post("/", async (request, response, next) => {
  try {
    const category = await Category.create(categorySchema.parse(request.body));
    response.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

categoriesRouter.delete("/:id", async (request, response, next) => {
  try {
    const inUse = await Product.exists({ categoryId: request.params.id });
    if (inUse) {
      response.status(409).json({ message: "Category is used by a product" });
      return;
    }
    const category = await Category.findByIdAndDelete(request.params.id);
    response.status(category ? 204 : 404).end();
  } catch (error) {
    next(error);
  }
});
