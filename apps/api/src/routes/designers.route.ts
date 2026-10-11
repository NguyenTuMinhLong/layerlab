import { Router } from "express";
import { z } from "zod";

import { Designer } from "../models/designer.model.js";
import { Product } from "../models/product.model.js";

export const designersRouter = Router();

designersRouter.get("/", async (_request, response, next) => {
  try {
    response.json(await Designer.find().sort({ fullName: 1 }).lean());
  } catch (error) {
    next(error);
  }
});

designersRouter.get("/established", async (request, response, next) => {
  try {
    const { minProducts } = z
      .object({ minProducts: z.coerce.number().int().positive().default(5) })
      .parse(request.query);

    const designers = await Designer.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "designerId",
          as: "products",
        },
      },
      { $addFields: { productCount: { $size: "$products" } } },
      { $match: { productCount: { $gte: minProducts } } },
      { $project: { products: 0, __v: 0 } },
      { $sort: { productCount: -1, fullName: 1 } },
    ]);

    response.json(designers);
  } catch (error) {
    next(error);
  }
});

const designerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/),
  bio: z.string().trim().min(8).max(300),
  location: z.string().trim().min(2).max(80),
});

designersRouter.post("/", async (request, response, next) => {
  try {
    const designer = await Designer.create(designerSchema.parse(request.body));
    response.status(201).json(designer);
  } catch (error) {
    next(error);
  }
});

designersRouter.delete("/:id", async (request, response, next) => {
  try {
    const inUse = await Product.exists({ designerId: request.params.id });
    if (inUse) {
      response.status(409).json({ message: "Designer is used by a product" });
      return;
    }
    const designer = await Designer.findByIdAndDelete(request.params.id);
    response.status(designer ? 204 : 404).end();
  } catch (error) {
    next(error);
  }
});
