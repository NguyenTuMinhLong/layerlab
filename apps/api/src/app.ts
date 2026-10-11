import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { config } from "./config.js";
import { categoriesRouter } from "./routes/categories.route.js";
import { designersRouter } from "./routes/designers.route.js";
import { generationQueueRouter } from "./routes/generation-queue.route.js";
import { ordersRouter } from "./routes/orders.route.js";
import { productsRouter } from "./routes/products.route.js";

/** Creates the LayerLab Express application. */
export function createApp(): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: [config.webOrigin, config.adminOrigin] }));
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", service: "layerlab-api" });
  });
  app.use("/api/categories", categoriesRouter);
  app.use("/api/designers", designersRouter);
  app.use("/api/generation-queue", generationQueueRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/products", productsRouter);

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    if (error instanceof ZodError) {
      response
        .status(400)
        .json({ message: "Invalid request", issues: error.issues });
      return;
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      response
        .status(409)
        .json({ message: "That name or slug already exists" });
      return;
    }
    console.error(error);
    response.status(500).json({ message: "Internal server error" });
  };
  app.use(errorHandler);
  return app;
}
