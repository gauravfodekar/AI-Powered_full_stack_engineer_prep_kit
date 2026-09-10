import { z } from "zod";

/**
 * ============================================================================
 * Appendix A: Kit Structure Specifications & Validation Schemas (Pure JS + Zod)
 * ============================================================================
 * These schemas guarantee exact compliance with Section 5 and Appendix A of the brief:
 * - Every requirement has a stable id ('r1', 'r2'...) and priority is 'must' or 'nice'.
 * - Every question references requirement_ids and difficulty is an integer from 1 to 3.
 * - Every schedule day has an integer duration in minutes.
 * - Every question_ids entry in the schedule must refer to an existing question.
 */

// Requirement Kinds and Priorities
export const RequirementKindEnum = z.enum(["technical", "behavioural", "domain"]);
export const RequirementPriorityEnum = z.enum(["must", "nice"]);

// Question Categories
export const QuestionCategoryEnum = z.enum([
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
]);

/**
 * Single requirement extracted from the job description
 */
export const RequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: RequirementKindEnum,
  priority: RequirementPriorityEnum,
});

/**
 * Role breakdown: title, seniority, responsibilities, and extracted requirements
 */
export const RoleSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(RequirementSchema),
});

/**
 * Question schema
 * Note: 'difficulty' must be an integer between 1 and 3
 */
export const QuestionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  category: QuestionCategoryEnum,
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
  // Builder state extension fields (preserves custom & user-edited items during regeneration)
  is_custom: z.boolean().optional(),
  is_edited: z.boolean().optional(),
});

/**
 * Flashcard schema
 */
export const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string()),
  // Practice mode extension fields
  confidence_score: z.enum(["low", "medium", "high"]).optional(),
  reviewed_at: z.string().optional(),
  is_custom: z.boolean().optional(),
  is_edited: z.boolean().optional(),
});

/**
 * Daily schedule item
 * Note: 'minutes' must be an integer duration
 */
export const ScheduleDaySchema = z.object({
  day: z.number().int().min(1),
  focus: z.string().min(1),
  question_ids: z.array(z.string()),
  minutes: z.number().int().positive(),
  is_completed: z.boolean().optional(),
});

/**
 * Full preparation schedule
 */
export const ScheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(ScheduleDaySchema),
});

/**
 * Metadata about the job description and researched pages
 */
export const KitSourceSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int().nonnegative(),
  researched_at: z.string(),
  pages_used: z.array(z.string()),
});

/**
 * Researched company brief
 */
export const CompanyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
});

/**
 * Coverage gap check report (Second Pass)
 */
export const CoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().positive(),
});

/**
 * Complete Appendix A Kit Schema
 */
export const KitSchema = z
  .object({
    source: KitSourceSchema,
    company_brief: CompanyBriefSchema,
    role: RoleSchema,
    questions: z.array(QuestionSchema),
    flashcards: z.array(FlashcardSchema),
    schedule: ScheduleSchema,
    coverage: CoverageSchema,
  })
  .superRefine((kit, ctx) => {
    // Validate that every question_ids entry in the schedule exists in questions
    const questionIdSet = new Set(kit.questions.map((q) => q.id));
    for (const day of kit.schedule.days) {
      for (const qId of day.question_ids) {
        if (!questionIdSet.has(qId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Schedule day ${day.day} references unknown question_id: '${qId}'`,
            path: ["schedule", "days", day.day - 1, "question_ids"],
          });
        }
      }
    }
  });

