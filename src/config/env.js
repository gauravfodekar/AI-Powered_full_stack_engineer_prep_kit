import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().optional().default("gemini-3.5-flash-lite"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/interview_prep_kit"),
  JWT_SECRET: z.string().default("default-interview-prep-jwt-secret-key-32chars"),
  ALLOW_LOCAL_URLS: z
    .string()
    .optional()
    .transform((val) => val === "true" || val === "1"),
  MAX_CRAWL_PAGES: z.coerce.number().int().min(1).max(20).default(5),
  CRAWL_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(8000),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = {
  ...parsed.data,
  allowLocalUrls:
    parsed.data.ALLOW_LOCAL_URLS ||
    parsed.data.NODE_ENV === "test" ||
    process.env.ALLOW_LOCAL_URLS === "true",
};
