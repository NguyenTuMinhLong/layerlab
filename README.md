# LayerLab

LayerLab is a full-stack marketplace for curated Figma components, UI kits, templates, dashboards, and design systems. The project pairs an editorial monochrome storefront with a local creator control panel and an Express/Mongoose API that also demonstrates the MongoDB requirements in the NoSQL final assignment.

## Stack

- React 19 and Vite for the storefront and admin control panel
- Express 5 and Mongoose 9 for the API
- MongoDB 7 through Docker Compose
- Bun 1.4 for package management and scripts

## Run locally

1. Copy `.env.example` to `.env`.
2. Start MongoDB with `docker compose up -d`.
3. Install packages with `/home/ubuntu/.proto/bin/bun install`.
4. Seed the database with `/home/ubuntu/.proto/bin/bun run seed`.
5. Start the API, storefront, and admin app with `/home/ubuntu/.proto/bin/bun run dev`.
6. Open the storefront at `http://localhost:5173` and the admin control panel at `http://localhost:3000`.

The API runs at `http://localhost:4000/api`. The storefront includes an in-memory preview fallback so the visual interface remains reviewable when MongoDB is not running. Favorites, checkout, CRUD, orders, and the generation queue require the API and MongoDB.

## Product workflow

- The seed publishes 10 free resources curated from Figma's public dashboard template directory and preserves the original source link on every listing.
- The admin keeps 10 generated component concepts ready to publish. Publishing one or deleting an eligible product automatically restores the queue to 10.
- Products, designers, and categories can be created and deleted from the admin. Editing is intentionally labeled “Coming soon.”
- Buyers can search, filter, inspect, favorite, add to cart, and place an order. Checkout records an order for manual fulfillment and does not collect payment.
- Products referenced by an order cannot be deleted, and designers or categories referenced by a product cannot be deleted.

## Assignment endpoints

- `GET /api/products/current-year`
- `GET /api/designers/established?minProducts=5`
- `GET /api/products/match?keyword=dashboard&category=Dashboard`
- `GET /api/products/summary`

See [docs/assignment-mapping.md](docs/assignment-mapping.md) for the full rubric mapping and [docs/database-design.md](docs/database-design.md) for the document model.
