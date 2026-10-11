import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { Category } from "../models/category.model.js";
import { Favorite } from "../models/favorite.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { ensureGenerationQueue } from "../services/generation-queue.js";

export const productsRouter = Router();

const listQuerySchema = z.object({
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  featured: z.enum(["true", "false"]).optional(),
  includeDrafts: z.enum(["true", "false"]).optional(),
});

productsRouter.get("/", async (request, response, next) => {
  try {
    const query = listQuerySchema.parse(request.query);
    const filter: Record<string, unknown> =
      query.includeDrafts === "true" ? {} : { status: "published" };

    if (query.search) {
      filter.title = { $regex: query.search, $options: "i" };
    }
    if (query.featured) {
      filter.featured = query.featured === "true";
    }
    if (query.category) {
      const category = await Category.findOne({ slug: query.category }).lean();
      filter.categoryId = category?._id ?? new Types.ObjectId();
    }

    const products = await Product.find(filter)
      .populate("designerId", "fullName username")
      .populate("categoryId", "name slug")
      .sort({ featured: -1, createdAt: -1 })
      .lean();

    response.json(products);
  } catch (error) {
    next(error);
  }
});

const productInputSchema = z.object({
  title: z.string().trim().min(3).max(100),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(12).max(500),
  designerId: z.string().regex(/^[a-f\d]{24}$/i),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i),
  tags: z.array(z.string().trim().min(1).max(30)).min(1).max(8),
  price: z.number().min(0).max(10000),
  publishingYear: z
    .number()
    .int()
    .min(2000)
    .max(2100)
    .default(new Date().getFullYear()),
  compatibleWith: z.array(z.string().trim().min(1)).default(["Figma"]),
  license: z.enum(["Personal", "Commercial", "Extended"]).default("Personal"),
  version: z.string().trim().min(1).default("1.0"),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("published"),
  previewVariant: z.number().int().min(1).max(6),
  sourceLabel: z.string().trim().max(100).optional(),
  sourceUrl: z.url().optional(),
});

productsRouter.post("/", async (request, response, next) => {
  try {
    const product = await Product.create({
      ...productInputSchema.parse(request.body),
      numOfFavorites: 0,
    });
    response.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

productsRouter.post("/:id/favorite", async (request, response, next) => {
  try {
    const { visitorKey } = z
      .object({ visitorKey: z.string().trim().min(8).max(120) })
      .parse(request.body);
    const product = await Product.findById(request.params.id);
    if (!product) {
      response.status(404).json({ message: "Product not found" });
      return;
    }
    const existing = await Favorite.findOne({
      productId: product._id,
      visitorKey,
    });
    if (existing) await existing.deleteOne();
    else await Favorite.create({ productId: product._id, visitorKey });
    product.numOfFavorites = await Favorite.countDocuments({
      productId: product._id,
    });
    await product.save();
    response.json({
      favorited: !existing,
      numOfFavorites: product.numOfFavorites,
    });
  } catch (error) {
    next(error);
  }
});

productsRouter.delete("/:id", async (request, response, next) => {
  try {
    const ordered = await Order.exists({
      "items.productId": request.params.id,
    });
    if (ordered) {
      response
        .status(409)
        .json({ message: "Ordered products cannot be deleted" });
      return;
    }
    const product = await Product.findByIdAndDelete(request.params.id);
    if (!product) {
      response.status(404).json({ message: "Product not found" });
      return;
    }
    await Favorite.deleteMany({ productId: product._id });
    await ensureGenerationQueue();
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/current-year", async (_request, response, next) => {
  try {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const products = await Product.find({
      createdAt: { $gte: start, $lt: end },
    })
      .populate("designerId", "fullName username")
      .populate("categoryId", "name slug")
      .lean();
    response.json(products);
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/match", async (request, response, next) => {
  try {
    const { keyword, category } = z
      .object({
        keyword: z.string().trim().min(1).default("dashboard"),
        category: z.string().trim().min(1).default("Dashboard"),
      })
      .parse(request.query);
    const categoryDocument = await Category.findOne({ name: category }).lean();

    if (!categoryDocument) {
      response.json([]);
      return;
    }

    const products = await Product.find({
      title: { $regex: keyword, $options: "i" },
      categoryId: categoryDocument._id,
    })
      .populate("designerId", "fullName username")
      .populate("categoryId", "name slug")
      .lean();
    response.json(products);
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/summary", async (_request, response, next) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "designers",
          localField: "designerId",
          foreignField: "_id",
          as: "designer",
        },
      },
      { $unwind: "$designer" },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          title: 1,
          designer_full_name: "$designer.fullName",
          publishing_year: "$publishingYear",
          num_of_favorites: "$numOfFavorites",
        },
      },
      { $sort: { title: 1 } },
    ]);
    response.json(products);
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/:slug", async (request, response, next) => {
  try {
    const product = await Product.findOne({
      slug: request.params.slug,
      status: "published",
    })
      .populate("designerId", "fullName username bio location")
      .populate("categoryId", "name slug")
      .lean();

    if (!product) {
      response.status(404).json({ message: "Product not found" });
      return;
    }

    response.json(product);
  } catch (error) {
    next(error);
  }
});
