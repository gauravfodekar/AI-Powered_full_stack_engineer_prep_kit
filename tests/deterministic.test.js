process.env.NODE_ENV = "test";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findCoverageGaps,
  allocateSchedule,
  generateCompleteKit,
} from "../src/services/deterministic.js";
import { KitSchema } from "../src/schemas/kitSchema.js";

describe("Coverage Gap Checker (Pure Array Logic)", () => {
  const requirements = [
    { id: "r1", text: "React knowledge", kind: "technical", priority: "must" },
    { id: "r2", text: "Node.js knowledge", kind: "technical", priority: "must" },
    { id: "r3", text: "Team mentorship", kind: "behavioural", priority: "nice" },
  ];

  it("detects when a 'must' requirement has no matching question", () => {
    const questions = [
      { id: "q1", requirement_ids: ["r1"], prompt: "React question", difficulty: 2 },
    ];

    const gapResult = findCoverageGaps(requirements, questions);

    assert.equal(gapResult.is_fully_covered, false);
    assert.equal(gapResult.uncovered_must_requirements.length, 1);
    assert.equal(gapResult.uncovered_must_requirements[0].id, "r2");
    assert.ok(gapResult.uncovered_requirement_ids.includes("r2"));
    assert.ok(gapResult.uncovered_requirement_ids.includes("r3"));
  });

  it("confirms is_fully_covered is true when all 'must' requirements are covered", () => {
    const questions = [
      { id: "q1", requirement_ids: ["r1"], prompt: "React question", difficulty: 2 },
      { id: "q2", requirement_ids: ["r2"], prompt: "Node question", difficulty: 3 },
    ];

    const gapResult = findCoverageGaps(requirements, questions);

    assert.equal(gapResult.is_fully_covered, true);
    assert.equal(gapResult.uncovered_must_requirements.length, 0);
    // r3 is 'nice', so its lack of coverage doesn't fail 'is_fully_covered'
    assert.deepEqual(gapResult.uncovered_requirement_ids, ["r3"]);
  });

  it("handles empty requirements or questions safely", () => {
    const emptyResult = findCoverageGaps([], []);
    assert.equal(emptyResult.is_fully_covered, true);
    assert.equal(emptyResult.coverage_ratio, 1.0);
  });
});

describe("Arithmetic Schedule Allocator (Pure Math Allocation)", () => {
  const requirements = [
    { id: "r1", text: "Distributed systems", kind: "technical", priority: "must" },
    { id: "r2", text: "Node.js microservices", kind: "technical", priority: "must" },
    { id: "r3", text: "Culture fit", kind: "company-fit", priority: "nice" },
  ];

  const questions = [
    {
      id: "q1",
      requirement_ids: ["r1"],
      category: "system-design",
      difficulty: 3,
      prompt: "Design distributed cache",
    },
    {
      id: "q2",
      requirement_ids: ["r2"],
      category: "technical",
      difficulty: 2,
      prompt: "Node.js clustering",
    },
    {
      id: "q3",
      requirement_ids: ["r3"],
      category: "company-fit",
      difficulty: 1,
      prompt: "Why our company?",
    },
    {
      id: "q4",
      requirement_ids: ["r2"],
      category: "technical",
      difficulty: 1,
      prompt: "Async/await mechanics",
    },
  ];

  it("creates a schedule matching exact days_available requested (1, 5, 14, 60 days)", () => {
    for (const testDays of [1, 5, 14, 60]) {
      const schedule = allocateSchedule({ questions, requirements, daysAvailable: testDays });
      assert.equal(schedule.days_available, testDays);
      assert.equal(schedule.days.length, testDays);
      // Verify day indices are consecutive integers from 1 to testDays
      for (let i = 0; i < testDays; i++) {
        assert.equal(schedule.days[i].day, i + 1);
        assert.ok(Number.isInteger(schedule.days[i].minutes));
        assert.ok(schedule.days[i].minutes > 0);
        assert.ok(schedule.days[i].focus.length > 0);
      }
    }
  });

  it("ensures all minutes are strictly integer durations with no floats", () => {
    const schedule = allocateSchedule({ questions, requirements, daysAvailable: 5 });
    for (const day of schedule.days) {
      assert.equal(Number.isInteger(day.minutes), true);
      assert.equal(day.minutes % 1, 0);
    }
  });

  it("schedules harder and must-have material in earlier days, not the last day", () => {
    const schedule = allocateSchedule({ questions, requirements, daysAvailable: 3 });

    // Day 1 should receive the hardest must-have question (q1: difficulty 3, system-design, must)
    const day1QIds = schedule.days[0].question_ids;
    assert.ok(day1QIds.includes("q1"), "Day 1 must include difficulty 3 question q1");

    // The last day should not be loaded with the hardest question
    const lastDayQIds = schedule.days[schedule.days.length - 1].question_ids;
    assert.equal(
      lastDayQIds.includes("q1"),
      false,
      "Last day should not receive the hardest must-have question"
    );
  });

  it("guarantees referential integrity: every schedule question_id exists in questions", () => {
    const schedule = allocateSchedule({ questions, requirements, daysAvailable: 7 });
    const questionIdSet = new Set(questions.map((q) => q.id));

    for (const day of schedule.days) {
      for (const qId of day.question_ids) {
        assert.ok(
          questionIdSet.has(qId),
          `Schedule references unknown question_id '${qId}'`
        );
      }
    }
  });

  it("handles 1-day schedule correctly by grouping all questions with valid duration", () => {
    const schedule = allocateSchedule({ questions, requirements, daysAvailable: 1 });
    assert.equal(schedule.days.length, 1);
    assert.equal(schedule.days[0].day, 1);
    assert.equal(schedule.days[0].question_ids.length, questions.length);
    assert.ok(schedule.days[0].minutes >= 40);
  });
});

describe("Complete Kit Assembler with Second Pass & Schema Validation", () => {
  it("generates a complete kit conforming 100% to Appendix A KitSchema", async () => {
    const sampleJd = `
      Senior Backend Engineer
      We require 5+ years of experience with Node.js and TypeScript.
      Experience leading system design and distributed databases is required.
      Bonus points for mentoring junior engineers.
    `;
    const sampleUrl = "https://example.com";

    const kit = await generateCompleteKit({
      jd: sampleJd,
      companyUrl: sampleUrl,
      days: 5,
      maxPasses: 2,
    });

    // Validate against strict Appendix A Zod schema
    const validation = KitSchema.safeParse(kit);
    assert.equal(
      validation.success,
      true,
      `Appendix A validation failed: ${JSON.stringify(validation.error?.format())}`
    );

    // Verify critical business logic constraints
    assert.equal(kit.schedule.days_available, 5);
    assert.equal(kit.schedule.days.length, 5);
    assert.ok(kit.coverage.passes >= 1);
    assert.ok(Array.isArray(kit.coverage.uncovered_requirement_ids));
    assert.ok(kit.questions.length > 0);
    assert.ok(kit.flashcards.length > 0);
    assert.equal(kit.source.company_url, sampleUrl);
  });
});

