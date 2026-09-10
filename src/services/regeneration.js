import { KitSchema } from "../schemas/kitSchema.js";
import { allocateSchedule, findCoverageGaps } from "./deterministic.js";
import {
  extractRoleAndBrief,
  generateQuestionBank,
  generateFlashcards,
} from "./llm.js";

// ============================================================================
// Service 5: Selective Section Regeneration Engine
// ============================================================================
// Solves "The Hardest State Problem in the Assessment" (Section 6 of brief):
// - Regenerating a single section does NOT discard edits made elsewhere.
// - Questions edited by hand (is_edited: true) or created by hand (is_custom: true)
//   or pinned (is_pinned: true) survive category regeneration.

/**
 * Regenerates a single section of an interview prep kit while strictly
 * preserving user edits and custom hand-added items.
 *
 * @param {object} kit - Existing Appendix A Kit
 * @param {string} section - Section to refresh:
 *   "company_brief" | "schedule" | "flashcards" | "technical" | "behavioural" | "system-design" | "company-fit"
 * @returns {Promise<object>} Updated Kit conforming strictly to Appendix A
 */
export async function regenerateKitSection(kit, section) {
  // Deep clone to prevent unintended mutations
  const updated = JSON.parse(JSON.stringify(kit));

  // 1. Regenerate Schedule Only
  if (section === "schedule") {
    updated.schedule = allocateSchedule({
      questions: updated.questions,
      requirements: updated.role.requirements,
      daysAvailable: updated.schedule.days_available,
    });
    return KitSchema.parse(updated);
  }

  // 2. Regenerate Company Brief Only
  if (section === "company_brief") {
    const briefResult = await extractRoleAndBrief({
      jd: updated.role.title + "\n" + updated.role.responsibilities.join("\n"),
      companyUrl: updated.source.company_url,
      companyResearch: {
        combined_text: updated.company_brief.what_they_do,
        pages_used: updated.source.pages_used,
      },
    });

    updated.company_brief = briefResult.company_brief;
    return KitSchema.parse(updated);
  }

  // 3. Regenerate Flashcards Only
  if (section === "flashcards") {
    // Preserve custom or user-edited flashcards
    const preservedCards = updated.flashcards.filter(
      (f) => f.is_custom || f.is_edited || f.is_pinned
    );

    const newCards = await generateFlashcards({
      requirements: updated.role.requirements,
      questions: updated.questions,
    });

    // Merge: preserved user cards first, then new generated cards
    const cardIdSet = new Set(preservedCards.map((c) => c.id));
    const uniqueNewCards = newCards.filter((c) => !cardIdSet.has(c.id));

    updated.flashcards = [...preservedCards, ...uniqueNewCards];
    return KitSchema.parse(updated);
  }

  // 4. Regenerate a Specific Question Category ("technical", "behavioural", "system-design", "company-fit")
  const validCategories = ["technical", "behavioural", "system-design", "company-fit"];
  if (validCategories.includes(section)) {
    // Other categories remain 100% untouched
    const otherCategoryQuestions = updated.questions.filter((q) => q.category !== section);
    const thisCategoryQuestions = updated.questions.filter((q) => q.category === section);

    // Filter out preserved questions (hand-added, edited inline, or pinned)
    const preservedQuestions = thisCategoryQuestions.filter(
      (q) => q.is_custom || q.is_edited || q.is_pinned
    );

    // Determine requirements relevant to this category
    const relevantReqs = updated.role.requirements.filter((r) => {
      if (section === "technical" || section === "system-design") {
        return r.kind === "technical" || r.kind === "domain";
      }
      return r.kind === "behavioural";
    });

    const targetReqs = relevantReqs.length > 0 ? relevantReqs : updated.role.requirements;

    // Generate fresh questions via LLM
    const generatedQuestions = await generateQuestionBank({
      role: { ...updated.role, requirements: targetReqs },
      companyBrief: updated.company_brief,
      companyResearch: { combined_text: "" },
    });

    // Filter generated questions to only include the target category
    const categoryFreshQuestions = (Array.isArray(generatedQuestions) ? generatedQuestions : [])
      .filter((q) => q.category === section);

    // Assign fresh unique IDs avoiding collisions with preserved questions
    const preservedIdSet = new Set(preservedQuestions.map((q) => q.id));
    let nextIdCounter = updated.questions.length + 1;

    const reindexedFresh = categoryFreshQuestions.map((q) => {
      if (preservedIdSet.has(q.id)) {
        return { ...q, id: `q${nextIdCounter++}` };
      }
      return q;
    });

    // Merge: other categories untouched + preserved questions + fresh generated questions
    updated.questions = [...otherCategoryQuestions, ...preservedQuestions, ...reindexedFresh];

    // Recalculate coverage and schedule deterministically
    const coverage = findCoverageGaps(updated.role.requirements, updated.questions);
    updated.coverage.uncovered_requirement_ids = coverage.uncovered_requirement_ids;

    updated.schedule = allocateSchedule({
      questions: updated.questions,
      requirements: updated.role.requirements,
      daysAvailable: updated.schedule.days_available,
    });

    return KitSchema.parse(updated);
  }

  throw new Error(`Unsupported section for regeneration: '${section}'`);
}
