/**
 * Feedback Validation Schemas
 */

import { z } from "zod";

const FEEDBACK_CATEGORIES = [
  "general", "course", "mcq", "mentorship", "newsletter", "community",
] as const;

export const submitFeedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES, { message: "Invalid category" }),
  subject:  z.string().max(300, "Subject must not exceed 300 characters").optional(),
  rating:   z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  feedback: z.string().min(10, "Feedback must be at least 10 characters").max(2000, "Feedback must not exceed 2000 characters"),
});

export const respondFeedbackSchema = z.object({
  response: z.string().min(5, "Response must be at least 5 characters").max(2000, "Response must not exceed 2000 characters"),
});

export const adminFeedbackQuerySchema = z.object({
  page:     z.string().transform(Number).refine((v) => v > 0).default(1 as any).optional(),
  limit:    z.string().transform(Number).refine((v) => v > 0 && v <= 50).default(20 as any).optional(),
  search:   z.string().optional(),
  status:   z.enum(["pending", "reviewed", "all"]).optional(),
  category: z.enum(FEEDBACK_CATEGORIES).optional(),
});

export const feedbackSchemas = {
  submit:     submitFeedbackSchema,
  respond:    respondFeedbackSchema,
  adminQuery: adminFeedbackQuerySchema,
};

export type SubmitFeedbackData  = z.infer<typeof submitFeedbackSchema>;
export type RespondFeedbackData = z.infer<typeof respondFeedbackSchema>;
