import "dotenv/config";

/** Runtime configuration derived from environment variables. */
export const config = {
  host: process.env.API_HOST ?? "127.0.0.1",
  mongoUri:
    process.env.MONGODB_URI ?? "mongodb://localhost:27017/LayerLabStore",
  port: Number(process.env.API_PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  adminOrigin: process.env.ADMIN_ORIGIN ?? "http://localhost:3000",
};
