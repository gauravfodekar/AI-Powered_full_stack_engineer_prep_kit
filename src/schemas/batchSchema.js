import { z } from "zod";
import { KitSchema } from "./kitSchema.js";

/**
 * ============================================================================
 * Appendix B: Batch Processing Schemas (Pure JS + Zod)
 * ============================================================================
 * Used by npm run evaluate -- --input <cases.json> --output <kits.json>
 */

/**
 * Single input case in the cases.json file
 */
export const BatchTestCaseSchema = z
  .object({
    id: z.string().min(1).optional().default(() => `case-${Math.random().toString(36).slice(2, 7)}`),
    jd: z.string().optional(),
    job_description: z.string().optional(),
    company_url: z.string().default("https://example.com"),
    days: z.number().int().positive().optional(),
    prep_days: z.number().int().positive().optional(),
  })
  .transform((data) => ({
    id: data.id,
    jd: data.jd || data.job_description || "Software Engineer role with standard responsibilities.",
    company_url: data.company_url,
    days: data.days || data.prep_days || 5,
  }));

export const BatchInputSchema = z.array(BatchTestCaseSchema);

/**
 * Structured error details for failed cases
 */
export const BatchCaseErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

/**
 * Single kit entry in the generated batch output file
 */
export const BatchKitResultSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ok", "failed"]),
  kit: KitSchema.nullable(),
  error: BatchCaseErrorSchema.nullable(),
});

/**
 * Full output payload saved to kits.json
 */
export const BatchOutputSchema = z.object({
  version: z.literal("1.0"),
  generated_at: z.string(),
  kits: z.array(BatchKitResultSchema),
});

