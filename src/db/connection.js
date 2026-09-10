import mongoose from "mongoose";
import { env } from "../config/env.js";

/**
 * Connects to MongoDB with error handling and reconnection logic.
 */
let isConnected = false;

export async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("Connected to MongoDB successfully.");
  } catch (err) {
    console.warn("MongoDB connection warning:", err.message);
    if (env.NODE_ENV === "production") {
      throw err;
    }
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

