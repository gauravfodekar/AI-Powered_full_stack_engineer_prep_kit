#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import PQueue from "p-queue";
import { BatchInputSchema, BatchOutputSchema } from "../schemas/batchSchema.js";
import { generateCompleteKit } from "../services/deterministic.js";

// ============================================================================
// Service 6: Batch CLI Evaluator (Mandatory Section 9 Entry Point)
// ============================================================================
// Invoked as: npm run evaluate -- --input <cases.json> --output <kits.json>
// Evaluates multiple job cases in parallel, records results in Appendix B format,
// and gracefully isolates failures per case.

import { fileURLToPath } from "node:url";

// Check if this script is executed directly from the terminal
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();

if (isMain) {
  const program = new Command();
  program
    .name("evaluate")
    .description("Batch evaluation entry point for AI Interview Prep Kit Generator")
    .requiredOption("-i, --input <path>", "Path to input JSON file containing array of test cases")
    .requiredOption("-o, --output <path>", "Path to output JSON file to write generated kits")
    .parse(process.argv);

  const options = program.opts();
  runBatchEvaluation(options.input, options.output).catch((err) => {
    console.error("Fatal error during batch execution:", err.message);
    process.exit(1);
  });
}

/**
 * Runs the batch evaluation over an array of test cases.
 */
export async function runBatchEvaluation(inputFilePath, outputFilePath) {
  const inputPath = path.resolve(process.cwd(), inputFilePath);
  const outputPath = path.resolve(process.cwd(), outputFilePath);

  // 1. Read and validate input file
  let rawData;
  try {
    rawData = await fs.readFile(inputPath, "utf-8");
  } catch (err) {
    throw new Error(`Cannot read input file at '${inputPath}': ${err.message}`);
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(rawData);
  } catch (err) {
    throw new Error(`Input file is not valid JSON: ${err.message}`);
  }

  const rawArray = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
  const testCases = BatchInputSchema.parse(rawArray);

  console.log(`Starting evaluation of ${testCases.length} case(s)...`);

  // 2. Concurrency queue (max 2 concurrent cases to respect LLM rate limits)
  const queue = new PQueue({ concurrency: 2 });
  const results = [];

  const tasks = testCases.map((testCase, index) =>
    queue.add(async () => {
      console.log(`[${index + 1}/${testCases.length}] Processing case: '${testCase.id}'...`);
      try {
        const kit = await generateCompleteKit({
          jd: testCase.jd,
          companyUrl: testCase.company_url,
          days: testCase.days,
        });

        results.push({
          id: testCase.id,
          status: "ok",
          kit,
          error: null,
        });
        console.log(`✔ [${index + 1}/${testCases.length}] Finished: '${testCase.id}' (status: ok)`);
      } catch (err) {
        console.error(`✖ [${index + 1}/${testCases.length}] Failed: '${testCase.id}' - ${err.message}`);
        results.push({
          id: testCase.id,
          status: "failed",
          kit: null,
          error: {
            code: err.code || "GENERATION_ERROR",
            message: err.message || "Unknown error during kit generation",
          },
        });
      }
    })
  );

  await Promise.all(tasks);

  // 3. Assemble and validate output strictly against Appendix B schema
  const finalOutput = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    kits: results,
  };

  const validatedOutput = BatchOutputSchema.parse(finalOutput);

  // 4. Ensure destination directory exists and write output JSON
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(validatedOutput, null, 2), "utf-8");

  console.log(`\nBatch evaluation completed! Results written to: ${outputPath}`);
  return validatedOutput;
}


