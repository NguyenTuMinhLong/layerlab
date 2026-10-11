import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDatabase, disconnectDatabase } from "./database.js";
import { ensureGenerationQueue } from "./services/generation-queue.js";

await connectDatabase(config.mongoUri);
await ensureGenerationQueue();

const app = createApp();
const server = app.listen(config.port, config.host, () => {
  console.log(`LayerLab API listening on http://${config.host}:${config.port}`);
});

const shutdown = (): void => {
  server.close(() => {
    void disconnectDatabase().then(() => process.exit(0));
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
