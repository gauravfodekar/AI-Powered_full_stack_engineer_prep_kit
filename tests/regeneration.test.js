process.env.NODE_ENV = "test";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { regenerateKitSection } from "../src/services/regeneration.js";
import { KitSchema } from "../src/schemas/kitSchema.js";

describe("Service 5: Selective Section Regeneration Engine", () => {
  // Base test kit conforming to Appendix A
  const sampleKit = {
    source: {
      company: "Acme",
      company_url: "https://example.com",
      role: "Senior Backend Engineer",
      location: "Remote",
      jd_chars: 200,
      researched_at: new Date().toISOString(),
      pages_used: ["https://example.com"],
    },
    company_brief: {
      summary: "Acme builds high-performance distributed caching systems.",
      what_they_do: "Cloud infrastructure tools.",
      sources: ["https://example.com"],
    },
    role: {
      title: "Senior Backend Engineer",
      seniority: "Senior",
      responsibilities: ["Build backend APIs", "Lead architecture"],
      requirements: [
        { id: "r1", text: "5+ years Node.js", kind: "technical", priority: "must" },
        { id: "r2", text: "System design", kind: "technical", priority: "must" },
        { id: "r3", text: "Team mentorship", kind: "behavioural", priority: "nice" },
      ],
    },
    questions: [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Original generated question about event loop",
        answer_outline: "Event loop phases",
        difficulty: 2,
        is_edited: false,
        is_custom: false,
      },
      {
        id: "q-custom-1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "USER HAND-WRITTEN QUESTION: How do streams backpressure in Node?",
        answer_outline: "Discuss highWaterMark and drain event",
        difficulty: 3,
        is_custom: true, // Hand added by user
      },
      {
        id: "q-edited-1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "USER EDITED QUESTION: Explain memory leak profiling with heap snapshots.",
        answer_outline: "Take 3 heap snapshots and look for retained objects",
        difficulty: 3,
        is_edited: true, // User edited inline
      },
      {
        id: "q2",
        requirement_ids: ["r2"],
        category: "system-design",
        prompt: "How to design a distributed cache?",
        answer_outline: "Consistent hashing, cache aside",
        difficulty: 3,
      },
      {
        id: "q3",
        requirement_ids: ["r3"],
        category: "behavioural",
        prompt: "Describe mentoring a teammate.",
        answer_outline: "STAR technique",
        difficulty: 1,
      },
    ],
    flashcards: [
      {
        id: "f1",
        front: "Node event loop definition",
        back: "Single threaded asynchronous I/O",
        requirement_ids: ["r1"],
      },
      {
        id: "f-custom-1",
        front: "USER CUSTOM FLASHCARD: What is Buffer?",
        back: "Raw binary memory allocation outside V8 heap",
        requirement_ids: ["r1"],
        is_custom: true,
      },
    ],
    schedule: {
      days_available: 5,
      days: [
        { day: 1, focus: "System Architecture", question_ids: ["q2"], minutes: 40 },
        { day: 2, focus: "Technical Deep-Dive", question_ids: ["q-custom-1"], minutes: 40 },
        { day: 3, focus: "Technical Review", question_ids: ["q-edited-1"], minutes: 40 },
        { day: 4, focus: "Core Concepts", question_ids: ["q1"], minutes: 25 },
        { day: 5, focus: "Behavioural", question_ids: ["q3"], minutes: 15 },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1,
    },
  };

  it("regenerates 'technical' category while strictly preserving custom and edited questions", async () => {
    const regenerated = await regenerateKitSection(sampleKit, "technical");

    // Appendix A validation
    const validation = KitSchema.safeParse(regenerated);
    assert.equal(validation.success, true, `Validation failed: ${JSON.stringify(validation.error?.format())}`);

    const technicalQuestions = regenerated.questions.filter((q) => q.category === "technical");

    // 1. MUST PRESERVE user's custom question
    const hasCustom = technicalQuestions.some(
      (q) => q.id === "q-custom-1" && q.prompt.includes("USER HAND-WRITTEN")
    );
    assert.equal(hasCustom, true, "User hand-written custom question must survive regeneration");

    // 2. MUST PRESERVE user's edited question
    const hasEdited = technicalQuestions.some(
      (q) => q.id === "q-edited-1" && q.prompt.includes("USER EDITED")
    );
    assert.equal(hasEdited, true, "User edited question must survive regeneration");

    // 3. OTHER CATEGORIES (system-design, behavioural) MUST REMAIN 100% UNTOUCHED
    const sysDesignQ = regenerated.questions.find((q) => q.id === "q2");
    assert.ok(sysDesignQ, "System design question must remain untouched");
    assert.equal(sysDesignQ.prompt, "How to design a distributed cache?");

    const behaviouralQ = regenerated.questions.find((q) => q.id === "q3");
    assert.ok(behaviouralQ, "Behavioural question must remain untouched");

    // 4. Company brief and flashcards must remain untouched
    assert.equal(regenerated.company_brief.summary, sampleKit.company_brief.summary);
    assert.equal(regenerated.flashcards.length, sampleKit.flashcards.length);
  });

  it("regenerates 'company_brief' without altering questions or schedule", async () => {
    const regenerated = await regenerateKitSection(sampleKit, "company_brief");

    assert.ok(regenerated.company_brief.summary.length > 0);
    // Questions and schedule remain identical
    assert.equal(regenerated.questions.length, sampleKit.questions.length);
    assert.equal(regenerated.schedule.days_available, sampleKit.schedule.days_available);
  });

  it("regenerates 'flashcards' while preserving custom flashcards", async () => {
    const regenerated = await regenerateKitSection(sampleKit, "flashcards");

    const hasCustomCard = regenerated.flashcards.some(
      (f) => f.id === "f-custom-1" && f.front.includes("USER CUSTOM FLASHCARD")
    );
    assert.equal(hasCustomCard, true, "User custom flashcard must survive regeneration");
  });

  it("regenerates 'schedule' deterministically across existing questions", async () => {
    const regenerated = await regenerateKitSection(sampleKit, "schedule");

    assert.equal(regenerated.schedule.days_available, sampleKit.schedule.days_available);
    assert.equal(regenerated.schedule.days.length, 5);
    for (const day of regenerated.schedule.days) {
      assert.ok(Number.isInteger(day.minutes));
      assert.ok(day.minutes > 0);
    }
  });
});

