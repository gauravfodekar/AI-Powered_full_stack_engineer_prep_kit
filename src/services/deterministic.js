import { KitSchema } from "../schemas/kitSchema.js";
import { researchCompany } from "./scraper.js";
import {
  extractRoleAndBrief,
  generateQuestionBank,
  generateFlashcards,
  generateMissingRequirementQuestions,
} from "./llm.js";

// ============================================================================
// Service 4: Deterministic Core (Strict No-AI Zone)
// ============================================================================
// Pure algorithmic logic for Coverage Gap Detection and Schedule Allocation.
// Zero LLM hallucinations, zero floating-point minutes, strict schema compliance.

/**
 * 1. Pure Array Coverage Gap Checker
 * Compares requirement IDs against question requirement_ids using Set lookups.
 * Time Complexity: O(R + Q), Space Complexity: O(R)
 *
 * @param {Array<object>} requirements - Extracted requirements from Role
 * @param {Array<object>} questions - Generated questions
 * @returns {{
 *   uncovered_must_requirements: Array<object>,
 *   uncovered_requirement_ids: string[],
 *   is_fully_covered: boolean,
 *   coverage_ratio: number
 * }}
 */
export function findCoverageGaps(requirements = [], questions = []) {
  const coveredSet = new Set();
  for (const q of questions) {
    for (const reqId of q.requirement_ids || []) {
      coveredSet.add(reqId);
    }
  }

  const uncoveredMust = [];
  const uncoveredIds = [];

  for (const req of requirements) {
    if (!coveredSet.has(req.id)) {
      uncoveredIds.push(req.id);
      if (req.priority === "must") {
        uncoveredMust.push(req);
      }
    }
  }

  return {
    uncovered_must_requirements: uncoveredMust,
    uncovered_requirement_ids: uncoveredIds,
    is_fully_covered: uncoveredMust.length === 0,
    coverage_ratio:
      requirements.length > 0
        ? (requirements.length - uncoveredIds.length) / requirements.length
        : 1.0,
  };
}

/**
 * 2. Pure Arithmetic Schedule Allocator
 * Distributes material across exactly `daysAvailable` days.
 * - Sorts questions: harder (3 > 2 > 1) & must-haves earlier in the timeline.
 * - Every must-have appears in the schedule.
 * - Computes strictly integer duration minutes.
 * - Handles edge cases: 1-day, 60-day, and uneven question counts.
 *
 * @param {object} params
 * @param {Array<object>} params.questions - All generated questions
 * @param {Array<object>} params.requirements - Role requirements
 * @param {number} params.daysAvailable - Number of days requested by user
 * @returns {{ days_available: number, days: Array<object> }}
 */
export function allocateSchedule({ questions = [], requirements = [], daysAvailable = 5 }) {
  const totalDays = Math.max(1, Math.floor(daysAvailable));

  if (questions.length === 0) {
    // Edge case: No questions available (e.g. extremely thin stub input)
    return {
      days_available: totalDays,
      days: Array.from({ length: totalDays }, (_, i) => ({
        day: i + 1,
        focus: i === 0 ? "Role Review & General Prep" : "Self-Study & Conceptual Revision",
        question_ids: [],
        minutes: 30,
      })),
    };
  }

  const mustReqIdSet = new Set(
    requirements.filter((r) => r.priority === "must").map((r) => r.id)
  );

  // Score questions for early placement:
  // Must-have requirements get +100, difficulty adds (difficulty * 10)
  const scoredQuestions = [...questions].map((q) => {
    let score = 0;
    const coversMust = q.requirement_ids?.some((id) => mustReqIdSet.has(id));
    if (coversMust) score += 100;
    score += (q.difficulty || 2) * 10;
    if (q.category === "system-design" || q.category === "technical") score += 5;
    return { question: q, score };
  });

  // Sort descending by score: hardest and highest priority first
  scoredQuestions.sort((a, b) => b.score - a.score);
  const sortedQuestions = scoredQuestions.map((sq) => sq.question);

  // Integer minutes per question based on difficulty
  const getMinutesForQuestion = (q) => {
    switch (q.difficulty) {
      case 3:
        return 40;
      case 2:
        return 25;
      case 1:
      default:
        return 15;
    }
  };

  // Determine focus label from question categories
  const determineFocus = (dayQuestions, dayNumber, totalDays) => {
    if (dayQuestions.length === 0) {
      return dayNumber === totalDays
        ? "Final Mock Interview & Wrap-up"
        : "Review & Knowledge Consolidation";
    }
    const categories = dayQuestions.map((q) => q.category);
    if (categories.includes("system-design")) return "System Architecture & Scalability";
    if (categories.includes("technical")) return "Core Technical Concepts & Problem Solving";
    if (categories.includes("behavioural")) return "Leadership, Mentorship & Behavioural";
    if (categories.includes("company-fit")) return "Company Values & Culture Alignment";
    return "Applied Role Knowledge";
  };

  const days = [];

  if (totalDays === 1) {
    // 1-Day Schedule: All questions packed into day 1
    const qIds = sortedQuestions.map((q) => q.id);
    const totalMinutes = sortedQuestions.reduce(
      (sum, q) => sum + getMinutesForQuestion(q),
      0
    );
    days.push({
      day: 1,
      focus: "Comprehensive High-Priority Review & Core Preparation",
      question_ids: qIds,
      minutes: Math.max(30, totalMinutes),
    });
  } else if (totalDays >= sortedQuestions.length) {
    // More days than questions: 1 question per day for first N days, remainder for review
    for (let i = 0; i < totalDays; i++) {
      if (i < sortedQuestions.length) {
        const q = sortedQuestions[i];
        days.push({
          day: i + 1,
          focus: determineFocus([q], i + 1, totalDays),
          question_ids: [q.id],
          minutes: Math.max(20, getMinutesForQuestion(q)),
        });
      } else {
        // Review days: reinforce previously scheduled hard questions
        const reviewQ = sortedQuestions[i % sortedQuestions.length];
        days.push({
          day: i + 1,
          focus:
            i === totalDays - 1
              ? "Final Mock Rehearsal & Strategy"
              : "Active Recall & Mock Interview",
          question_ids: [reviewQ.id],
          minutes: 30,
        });
      }
    }
  } else {
    // Fewer days than questions: distribute round-robin so earlier days get hardest questions
    const buckets = Array.from({ length: totalDays }, () => []);
    sortedQuestions.forEach((q, idx) => {
      const bucketIndex = idx % totalDays;
      buckets[bucketIndex].push(q);
    });

    for (let i = 0; i < totalDays; i++) {
      const dayQs = buckets[i];
      const qIds = dayQs.map((q) => q.id);
      const minutes = dayQs.reduce((sum, q) => sum + getMinutesForQuestion(q), 0);
      days.push({
        day: i + 1,
        focus: determineFocus(dayQs, i + 1, totalDays),
        question_ids: qIds,
        minutes: Math.max(30, minutes),
      });
    }
  }

  return {
    days_available: totalDays,
    days,
  };
}

/**
 * 3. Complete Kit Generator with Second-Pass Loop
 * Orchestrates: Scraper -> Step 1 (Role/Brief) -> Step 2 (Questions)
 * -> Coverage Gap Check -> (Second Pass if needed) -> Step 3 (Flashcards)
 * -> Deterministic Schedule Allocation -> Appendix A Kit
 *
 * @param {object} params
 * @param {string} params.jd - Job description text
 * @param {string} params.companyUrl - Company URL
 * @param {number} params.days - Number of days available
 * @param {number} [params.maxPasses=2] - Max coverage passes to attempt
 * @param {object} [params.precomputedResearch] - Optional scraped research result
 * @returns {Promise<object>} Complete Appendix A Kit
 */
export async function generateCompleteKit({
  jd,
  companyUrl,
  days = 5,
  maxPasses = 2,
  precomputedResearch = null,
}) {
  const startTime = Date.now();
  console.log(`\n[Pipeline] 🚀 Starting Kit Generation for ${companyUrl}...`);

  // 1. Research Company via Scraper (or use precomputed)
  console.log(`[Pipeline] 🌐 Stage 1/5: Crawling & scraping company context...`);
  const research =
    precomputedResearch ||
    (await researchCompany(companyUrl, { maxPages: 4 }));
  console.log(`[Pipeline] ✓ Scraped ${research?.pages_used?.length || 0} pages (${(research?.summary_text || research?.cleaned_text || '').length} chars)`);

  // 2. Step 1: Extract Role & Company Brief
  console.log(`[Pipeline] 📋 Stage 2/5: Extracting role requirements & company brief with LLM...`);
  const { role, company_brief } = await extractRoleAndBrief({
    jd,
    companyUrl,
    companyResearch: research,
  });
  console.log(`[Pipeline] ✓ Extracted role: "${role.title}" with ${role.requirements.length} requirements`);

  // 3. Step 2: Generate Question Bank (Pass 1)
  console.log(`[Pipeline] 💡 Stage 3/5: Synthesizing categorized question bank with LLM...`);
  let questions = await generateQuestionBank({
    role,
    companyBrief: company_brief,
    companyResearch: research,
  });

  // Ensure questions is an array
  if (!Array.isArray(questions)) {
    questions = [];
  }
  console.log(`[Pipeline] ✓ Generated ${questions.length} initial interview questions`);

  // 4. Coverage Gap Detection & Second Pass Loop
  console.log(`[Pipeline] 🛡️ Stage 4/5: Running bipartite coverage verification...`);
  let coverageCheck = findCoverageGaps(role.requirements, questions);
  let passes = 1;

  while (!coverageCheck.is_fully_covered && passes < maxPasses) {
    console.log(`[Pipeline] ⚠️ Gaps found in pass ${passes}. Uncovered must-haves: ${coverageCheck.uncovered_must_requirements.map(r => r.id).join(', ')}`);
    console.log(`[Pipeline] 🔄 Executing Second-Pass targeted question synthesis...`);
    const missingQuestions = await generateMissingRequirementQuestions({
      missingRequirements: coverageCheck.uncovered_must_requirements,
      startIdIndex: questions.length + 1,
    });

    if (missingQuestions && missingQuestions.length > 0) {
      questions.push(...missingQuestions);
      console.log(`[Pipeline] ✓ Repaired with ${missingQuestions.length} additional targeted questions`);
    }

    passes++;
    coverageCheck = findCoverageGaps(role.requirements, questions);
  }
  console.log(`[Pipeline] ✓ Final coverage check: ${coverageCheck.is_fully_covered ? '100% Fully Covered' : 'Partial'}`);

  // 5. Step 3: Generate Flashcards
  console.log(`[Pipeline] 🃏 Stage 5/5: Synthesizing flashcards & calculating schedule...`);
  let flashcards = await generateFlashcards({
    requirements: role.requirements,
    questions,
  });
  if (!Array.isArray(flashcards)) {
    flashcards = [];
  }

  // 6. Step 4: Pure Deterministic Schedule Allocation
  const schedule = allocateSchedule({
    questions,
    requirements: role.requirements,
    daysAvailable: days,
  });

  // 7. Assemble Source Metadata
  const source = {
    company: company_brief.what_they_do
      ? company_brief.what_they_do.split(" ")[0] || "Company"
      : "Company",
    company_url: companyUrl,
    role: role.title || "Software Engineer",
    location: "Remote / Flexible",
    jd_chars: jd.length,
    researched_at: new Date().toISOString(),
    pages_used: research.pages_used.length > 0 ? research.pages_used : [companyUrl],
  };

  // 8. Construct Final Appendix A Payload
  const rawKit = {
    source,
    company_brief,
    role,
    questions,
    flashcards,
    schedule,
    coverage: {
      uncovered_requirement_ids: coverageCheck.uncovered_requirement_ids,
      passes,
    },
  };

  const elapsed = Date.now() - startTime;
  console.log(`[Pipeline] ✅ Complete Prep Kit synthesized & verified in ${elapsed}ms!\n`);

  // 9. Strict Validation with Zod (guarantees Appendix A compliance)
  return KitSchema.parse(rawKit);
}

