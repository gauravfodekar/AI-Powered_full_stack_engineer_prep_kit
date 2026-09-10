import { Router } from "express";
import { z } from "zod";
import { Kit } from "../models/Kit.js";
import { requireAuth } from "../middleware/auth.js";
import { generateCompleteKit } from "../services/deterministic.js";
import { regenerateKitSection } from "../services/regeneration.js";
import { KitSchema } from "../schemas/kitSchema.js";

const router = Router();

// Enforce authentication on all kit routes
router.use(requireAuth);

const CreateKitRequestSchema = z.object({
  jd: z.string().min(10, "Job description (jd) must be at least 10 characters"),
  company_url: z.string().url("Valid company website URL is required"),
  days: z.coerce.number().int().min(1).max(60).default(5),
  title: z.string().optional(),
});

const RegenerateRequestSchema = z.object({
  section: z.enum([
    "technical",
    "behavioural",
    "system-design",
    "company-fit",
    "company_brief",
    "schedule",
    "flashcards",
  ]),
});

/**
 * POST /api/kits
 * Canonical REST endpoint to generate a full interview preparation kit and persist to MongoDB.
 */
router.post("/", async (req, res) => {
  const parseResult = CreateKitRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.format(),
    });
  }

  const { jd, company_url, days, title } = parseResult.data;

  try {
    // Run the full retrieval, LLM extraction, coverage check, and scheduling pipeline
    const generatedKit = await generateCompleteKit({
      jd,
      companyUrl: company_url,
      days,
    });

    const kitDoc = await Kit.create({
      userId: req.userId,
      title: title || `${generatedKit.role.title} at ${generatedKit.source.company}`,
      source: generatedKit.source,
      company_brief: generatedKit.company_brief,
      role: generatedKit.role,
      questions: generatedKit.questions,
      flashcards: generatedKit.flashcards,
      schedule: generatedKit.schedule,
      coverage: generatedKit.coverage,
    });

    const fullKitObj = {
      _id: String(kitDoc._id),
      id: String(kitDoc._id),
      title: kitDoc.title,
      ...generatedKit,
      createdAt: kitDoc.createdAt,
      updatedAt: kitDoc.updatedAt,
    };

    return res.status(201).json({
      message: "Kit generated successfully",
      kit: fullKitObj,
    });
  } catch (err) {
    console.error("Kit generation API error:", err);
    const message = err.message || "Kit generation failed";
    return res.status(500).json({
      error: message,
      message: message,
    });
  }
});

/**
 * GET /api/kits
 * Lists all kits belonging to the authenticated user.
 */
router.get("/", async (req, res) => {
  try {
    const kits = await Kit.find({ userId: req.userId })
      .select("title source role coverage schedule questions flashcards company_brief createdAt updatedAt")
      .sort({ updatedAt: -1 });

    return res.json({
      kits: kits.map((k) => ({
        _id: String(k._id),
        id: String(k._id),
        title: k.title,
        source: k.source,
        role: k.role,
        company_brief: k.company_brief,
        questions: k.questions,
        flashcards: k.flashcards,
        schedule: k.schedule,
        coverage: k.coverage,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch kits",
      message: err.message,
    });
  }
});

/**
 * GET /api/kits/:id
 * Retrieves a specific kit by ID, enforcing user ownership isolation.
 */
router.get("/:id", async (req, res) => {
  try {
    const kitDoc = await Kit.findOne({ _id: req.params.id, userId: req.userId });

    if (!kitDoc) {
      return res.status(404).json({
        error: "Kit not found",
        message: "The requested kit does not exist or you do not have permission to view it.",
      });
    }

    const fullKitObj = {
      _id: String(kitDoc._id),
      id: String(kitDoc._id),
      title: kitDoc.title,
      source: kitDoc.source,
      company_brief: kitDoc.company_brief,
      role: kitDoc.role,
      questions: kitDoc.questions,
      flashcards: kitDoc.flashcards,
      schedule: kitDoc.schedule,
      coverage: kitDoc.coverage,
      createdAt: kitDoc.createdAt,
      updatedAt: kitDoc.updatedAt,
    };

    return res.json({
      kit: fullKitObj,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to retrieve kit",
      message: err.message,
    });
  }
});

/**
 * PUT /api/kits/:id
 * Updates an existing kit (saving inline edits, reordered questions, hand-added cards).
 */
router.put("/:id", async (req, res) => {
  try {
    const kitDoc = await Kit.findOne({ _id: req.params.id, userId: req.userId });

    if (!kitDoc) {
      return res.status(404).json({
        error: "Kit not found",
        message: "The requested kit does not exist or you do not have permission to edit it.",
      });
    }

    // Allow updating title, questions, flashcards, schedule, company_brief, or role
    if (req.body.title) kitDoc.title = req.body.title;
    if (req.body.company_brief) kitDoc.company_brief = req.body.company_brief;
    if (req.body.role) kitDoc.role = req.body.role;
    if (req.body.questions) kitDoc.questions = req.body.questions;
    if (req.body.flashcards) kitDoc.flashcards = req.body.flashcards;
    if (req.body.schedule) kitDoc.schedule = req.body.schedule;
    if (req.body.coverage) kitDoc.coverage = req.body.coverage;

    await kitDoc.save();

    const fullKitObj = {
      _id: String(kitDoc._id),
      id: String(kitDoc._id),
      title: kitDoc.title,
      source: kitDoc.source,
      company_brief: kitDoc.company_brief,
      role: kitDoc.role,
      questions: kitDoc.questions,
      flashcards: kitDoc.flashcards,
      schedule: kitDoc.schedule,
      coverage: kitDoc.coverage,
      updatedAt: kitDoc.updatedAt,
    };

    return res.json({
      message: "Kit updated successfully",
      kit: fullKitObj,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to update kit",
      message: err.message,
    });
  }
});

/**
 * DELETE /api/kits/:id
 * Deletes a kit by ID, enforcing user ownership isolation.
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Kit.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!deleted) {
      return res.status(404).json({
        error: "Kit not found",
        message: "The requested kit does not exist or you do not have permission to delete it.",
      });
    }

    return res.json({
      message: "Kit deleted successfully",
      id: String(deleted._id),
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to delete kit",
      message: err.message,
    });
  }
});

/**
 * POST /api/kits/:id/regenerate
 * Canonical REST endpoint to selectively regenerate a single section while preserving custom/edited items.
 */
router.post("/:id/regenerate", async (req, res) => {
  const parseResult = RegenerateRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.format(),
    });
  }

  const { section } = parseResult.data;

  try {
    const kitDoc = await Kit.findOne({ _id: req.params.id, userId: req.userId });

    if (!kitDoc) {
      return res.status(404).json({
        error: "Kit not found",
        message: "The requested kit does not exist or you do not have permission to modify it.",
      });
    }

    const currentKit = {
      source: kitDoc.source,
      company_brief: kitDoc.company_brief,
      role: kitDoc.role,
      questions: kitDoc.questions,
      flashcards: kitDoc.flashcards,
      schedule: kitDoc.schedule,
      coverage: kitDoc.coverage,
    };

    // Execute selective section regeneration with state preservation
    const updatedKit = await regenerateKitSection(currentKit, section);

    kitDoc.source = updatedKit.source;
    kitDoc.company_brief = updatedKit.company_brief;
    kitDoc.role = updatedKit.role;
    kitDoc.questions = updatedKit.questions;
    kitDoc.flashcards = updatedKit.flashcards;
    kitDoc.schedule = updatedKit.schedule;
    kitDoc.coverage = updatedKit.coverage;

    await kitDoc.save();

    const fullKitObj = {
      _id: String(kitDoc._id),
      id: String(kitDoc._id),
      title: kitDoc.title,
      ...updatedKit,
      updatedAt: kitDoc.updatedAt,
    };

    return res.json({
      message: `Section '${section}' regenerated successfully`,
      kit: fullKitObj,
    });
  } catch (err) {
    console.error("Section regeneration error:", err);
    const message = err.message || "Section regeneration failed";
    return res.status(500).json({
      error: message,
      message: message,
    });
  }
});

export default router;
