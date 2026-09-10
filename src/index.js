import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDB } from "./db/connection.js";
import authRouter from "./routes/auth.js";
import kitsRouter from "./routes/kits.js";

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware for debugging & visibility
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor =
      status >= 500
        ? "\x1b[31m" // Red
        : status >= 400
        ? "\x1b[33m" // Yellow
        : status >= 300
        ? "\x1b[36m" // Cyan
        : "\x1b[32m"; // Green
    const reset = "\x1b[0m";

    console.log(
      `[HTTP] ${method} ${originalUrl} -> ${statusColor}${status}${reset} (${duration}ms)`
    );
  });

  next();
});

// Mount API routes
app.use("/api/auth", authRouter);
app.use("/api/kits", kitsRouter);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    model: env.GEMINI_MODEL || "gemini-3.7-flash",
  });
});

if (process.env.NODE_ENV !== "test") {
  connectDB().catch((err) => console.warn("DB connection notice:", err.message));
  app.listen(env.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 PrepKit AI Server listening on http://localhost:${env.PORT}`);
    console.log(`🔧 Environment: ${env.NODE_ENV}`);
    console.log(`🧠 Primary Model: ${env.GEMINI_MODEL || "gemini-3.7-flash"}`);
    console.log(`======================================================\n`);
  });
}

export default app;
