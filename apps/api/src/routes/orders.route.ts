import { Router } from "express";
import { z } from "zod";

import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";

export const ordersRouter = Router();

ordersRouter.get("/", async (_request, response, next) => {
  try {
    response.json(await Order.find().sort({ createdAt: -1 }).lean());
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/", async (request, response, next) => {
  try {
    const input = z
      .object({
        customerName: z.string().trim().min(2).max(100),
        customerEmail: z.email(),
        items: z
          .array(
            z.object({
              productId: z.string().regex(/^[a-f\d]{24}$/i),
              quantity: z.number().int().min(1).max(20),
            }),
          )
          .min(1)
          .max(20),
      })
      .parse(request.body);
    const products = await Product.find({
      _id: { $in: input.items.map((item) => item.productId) },
      status: "published",
    }).lean();
    if (
      products.length !==
      new Set(input.items.map((item) => item.productId)).size
    ) {
      response
        .status(400)
        .json({ message: "One or more products are unavailable" });
      return;
    }
    const productById = new Map(
      products.map((product) => [String(product._id), product]),
    );
    const items = input.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new Error("Product lookup failed");
      return {
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
      };
    });
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const order = await Order.create({
      orderNumber: `LL-${Date.now().toString(36).toUpperCase()}`,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      items,
      total,
    });
    response.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

ordersRouter.patch("/:id/status", async (request, response, next) => {
  try {
    const { status } = z
      .object({
        status: z.enum(["pending", "confirmed", "fulfilled", "cancelled"]),
      })
      .parse(request.body);
    const order = await Order.findByIdAndUpdate(
      request.params.id,
      { status },
      { returnDocument: "after" },
    );
    if (!order) {
      response.status(404).json({ message: "Order not found" });
      return;
    }
    response.json(order);
  } catch (error) {
    next(error);
  }
});
