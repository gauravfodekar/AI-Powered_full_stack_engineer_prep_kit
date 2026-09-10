import mongoose from "mongoose";

const KitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Interview Prep Kit",
    },
    source: {
      type: Object,
      required: true,
    },
    company_brief: {
      type: Object,
      required: true,
    },
    role: {
      type: Object,
      required: true,
    },
    questions: {
      type: Array,
      required: true,
      default: [],
    },
    flashcards: {
      type: Array,
      required: true,
      default: [],
    },
    schedule: {
      type: Object,
      required: true,
    },
    coverage: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Kit = mongoose.model("Kit", KitSchema);

