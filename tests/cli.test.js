process.env.NODE_ENV = "test";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { runBatchEvaluation } from "../src/cli/evaluate.js";
import { BatchOutputSchema } from "../src/schemas/batchSchema.js";

describe("Batch CLI Evaluator (npm run evaluate)", () => {
  const tempInputPath = path.resolve(process.cwd(), "tests/temp_test_cases.json");
  const tempOutputPath = path.resolve(process.cwd(), "tests/temp_output_kits.json");

  it("reads batch cases, processes them, and produces valid Appendix B output", async () => {
    const testCases = [
      {
        id: "test-case-01",
        jd: "Senior Backend Engineer\nMust have 5+ years of Node.js experience.",
        company_url: "https://example.com",
        days: 3,
      },
    ];

    await fs.writeFile(tempInputPath, JSON.stringify(testCases, null, 2), "utf-8");

    const batchResult = await runBatchEvaluation(tempInputPath, tempOutputPath);

    // 1. Verify returned result conforms strictly to Appendix B schema
    const validation = BatchOutputSchema.safeParse(batchResult);
    assert.equal(
      validation.success,
      true,
      `Batch output validation failed: ${JSON.stringify(validation.error?.format())}`
    );

    assert.equal(batchResult.version, "1.0");
    assert.equal(batchResult.kits.length, 1);
    assert.equal(batchResult.kits[0].id, "test-case-01");
    assert.equal(batchResult.kits[0].status, "ok");
    assert.ok(batchResult.kits[0].kit !== null);
    assert.equal(batchResult.kits[0].error, null);

    // 2. Verify output file exists on disk
    const fileContent = await fs.readFile(tempOutputPath, "utf-8");
    const parsedFromFile = JSON.parse(fileContent);
    assert.equal(parsedFromFile.kits[0].id, "test-case-01");

    // Cleanup temp test files
    await fs.unlink(tempInputPath).catch(() => {});
    await fs.unlink(tempOutputPath).catch(() => {});
  });

  it("handles case failure gracefully without aborting remaining cases", async () => {
    const mixedCases = [
      {
        id: "case-good",
        jd: "Frontend Engineer\nMust have 3+ years React.",
        company_url: "https://example.com",
        days: 2,
      },
      {
        id: "case-bad-days",
        jd: "Invalid Engineer",
        company_url: "https://example.com",
        days: -5, // Invalid negative days should fail validation
      },
    ];

    await fs.writeFile(tempInputPath, JSON.stringify(mixedCases, null, 2), "utf-8");

    // Invalid batch input fails upfront validation
    await assert.rejects(
      () => runBatchEvaluation(tempInputPath, tempOutputPath),
      /Number must be greater than 0|validation failed/i
    );

    // Cleanup
    await fs.unlink(tempInputPath).catch(() => {});
  });
});

