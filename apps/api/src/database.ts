import mongoose from "mongoose";

/** Connects Mongoose to the configured LayerLab MongoDB database. */
export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri);
}

/** Closes the active Mongoose connection. */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
