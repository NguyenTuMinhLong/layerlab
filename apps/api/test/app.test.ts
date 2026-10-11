import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import { createApp } from "../src/app";
import { Category } from "../src/models/category.model";
import { Designer } from "../src/models/designer.model";
import { Favorite } from "../src/models/favorite.model";
import { GenerationCandidate } from "../src/models/generation-candidate.model";
import { Order } from "../src/models/order.model";
import { Product } from "../src/models/product.model";

let mongoServer: MongoMemoryServer | undefined;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: "LayerLabStoreTest" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  const [dashboard, uiKit] = await Category.insertMany([
    {
      name: "Dashboard",
      slug: "dashboard",
      description: "Analytics interfaces",
    },
    {
      name: "UI Kit",
      slug: "ui-kit",
      description: "Interface building blocks",
    },
  ]);
  const [establishedDesigner, newDesigner] = await Designer.insertMany([
    {
      fullName: "Mina Tran",
      username: "minatype",
      bio: "Design systems",
      location: "Ho Chi Minh City",
    },
    {
      fullName: "Nora Vu",
      username: "noravu",
      bio: "Mobile products",
      location: "Hue",
    },
  ]);

  if (!dashboard || !uiKit || !establishedDesigner || !newDesigner) {
    throw new Error("Expected test fixtures to be created");
  }

  const year = new Date().getFullYear();
  await Product.insertMany([
    ...Array.from({ length: 5 }, (_, index) => ({
      title:
        index === 0
          ? "Analytica Dashboard System"
          : `Component Collection ${index + 1}`,
      slug: `component-${index + 1}`,
      description: "A flexible component collection.",
      designerId: establishedDesigner._id,
      categoryId: index === 0 ? dashboard._id : uiKit._id,
      tags: ["figma"],
      price: 20 + index,
      publishingYear: year,
      numOfFavorites: index,
      compatibleWith: ["Figma"],
      license: "Commercial",
      version: "1.0",
      featured: index === 0,
      status: "published",
      previewVariant: index + 1,
    })),
    {
      title: "Newcomer UI Kit",
      slug: "newcomer-ui-kit",
      description: "A first published kit.",
      designerId: newDesigner._id,
      categoryId: uiKit._id,
      tags: ["figma"],
      price: 18,
      publishingYear: year,
      numOfFavorites: 2,
      compatibleWith: ["Figma"],
      license: "Personal",
      version: "1.0",
      featured: false,
      status: "published",
      previewVariant: 6,
    },
  ]);
});

describe("LayerLab assignment queries", () => {
  const app = createApp();

  test("defines the required title index", () => {
    const hasTitleIndex = Product.schema
      .indexes()
      .some(([fields]) => fields.title === 1);
    expect(hasTitleIndex).toBe(true);
  });

  test("returns products created during the current year", async () => {
    const response = await request(app).get("/api/products/current-year");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(6);
  });

  test("returns designers with at least five products", async () => {
    const response = await request(app).get(
      "/api/designers/established?minProducts=5",
    );
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      fullName: "Mina Tran",
      productCount: 5,
    });
  });

  test("matches title content and category", async () => {
    const response = await request(app).get(
      "/api/products/match?keyword=dashboard&category=Dashboard",
    );
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Analytica Dashboard System");
  });

  test("projects the requested product summary fields", async () => {
    const response = await request(app).get("/api/products/summary");
    expect(response.status).toBe(200);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        designer_full_name: expect.any(String),
        publishing_year: expect.any(Number),
        num_of_favorites: expect.any(Number),
      }),
    );
  });
});

describe("LayerLab product operations", () => {
  const app = createApp();

  test("creates a validated product from the admin payload", async () => {
    const category = await Category.findOne();
    const designer = await Designer.findOne();
    const response = await request(app)
      .post("/api/products")
      .send({
        title: "Generated Noir Kit",
        slug: "generated-noir-kit",
        description: "A complete monochrome interface component collection.",
        designerId: String(designer?._id),
        categoryId: String(category?._id),
        tags: ["figma", "monochrome"],
        price: 0,
        previewVariant: 2,
      });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "Generated Noir Kit",
      numOfFavorites: 0,
      status: "published",
    });
  });

  test("toggles a favorite and keeps the aggregate count exact", async () => {
    const product = await Product.findOne();
    const first = await request(app)
      .post(`/api/products/${product?._id}/favorite`)
      .send({ visitorKey: "test-visitor-123" });
    const second = await request(app)
      .post(`/api/products/${product?._id}/favorite`)
      .send({ visitorKey: "test-visitor-123" });
    expect(first.body).toEqual({ favorited: true, numOfFavorites: 1 });
    expect(second.body).toEqual({ favorited: false, numOfFavorites: 0 });
    expect(await Favorite.countDocuments()).toBe(0);
  });

  test("creates an order using prices stored on the server", async () => {
    const products = await Product.find().limit(2).lean();
    const response = await request(app)
      .post("/api/orders")
      .send({
        customerName: "Test Buyer",
        customerEmail: "buyer@example.com",
        items: products.map((product) => ({
          productId: String(product._id),
          quantity: 1,
        })),
      });
    expect(response.status).toBe(201);
    expect(response.body.total).toBe(
      products.reduce((sum, product) => sum + product.price, 0),
    );
    expect(await Order.countDocuments()).toBe(1);
  });

  test("updates order fulfillment status", async () => {
    const product = await Product.findOne();
    const order = await Order.create({
      orderNumber: "LL-TEST",
      customerName: "Test Buyer",
      customerEmail: "buyer@example.com",
      items: [
        {
          productId: product?._id,
          title: product?.title,
          price: product?.price,
          quantity: 1,
        },
      ],
      total: product?.price ?? 0,
    });
    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: "fulfilled" });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("fulfilled");
  });

  test("keeps ten generated candidates ready after a product is deleted", async () => {
    await request(app).get("/api/generation-queue");
    await GenerationCandidate.findOneAndDelete();
    const product = await Product.findOne();
    const response = await request(app).delete(`/api/products/${product?._id}`);
    expect(response.status).toBe(204);
    expect(await GenerationCandidate.countDocuments()).toBe(10);
  });

  test("publishes one generated candidate and immediately refills the queue", async () => {
    const queueResponse = await request(app).get("/api/generation-queue");
    const designer = await Designer.findOne();
    const response = await request(app)
      .post(`/api/generation-queue/${queueResponse.body[0]._id}/publish`)
      .send({ designerId: String(designer?._id), price: 0 });
    expect(response.status).toBe(201);
    expect(response.body.price).toBe(0);
    expect(await GenerationCandidate.countDocuments()).toBe(10);
  });
});
