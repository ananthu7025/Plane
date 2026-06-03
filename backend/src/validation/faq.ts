/**
 * FAQ Validation Schemas
 * Zod schemas for request validation
 */

import { z } from "zod";

const FAQ_CATEGORIES = [
  "General",
  "Getting Started",
  "MCQ",
  "Courses",
  "Mentorship",
  "Newsletter",
  "Payments",
  "Account",
] as const;

/**
 * Create FAQ validation schema
 */
export const createFAQSchema = z.object({
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(500, "Question must not exceed 500 characters"),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(2000, "Answer must not exceed 2000 characters"),
  category: z.enum(FAQ_CATEGORIES, { message: "Invalid FAQ category" }),
  isActive: z.boolean().default(true),
});

/**
 * Update FAQ validation schema
 */
export const updateFAQSchema = z.object({
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(500, "Question must not exceed 500 characters")
    .optional(),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(2000, "Answer must not exceed 2000 characters")
    .optional(),
  category: z.enum(FAQ_CATEGORIES, { message: "Invalid FAQ category" }).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Bulk reorder validation schema
 */
export const reorderFAQsSchema = z.object({
  items: z
    .array(
      z.object({
        id:    z.number().int().positive("FAQ ID must be a positive integer"),
        order: z.number().int().min(1, "Order must be at least 1"),
      })
    )
    .min(1, "At least one item is required"),
});

/**
 * Export all schemas as a collection
 */
export const faqSchemas = {
  createFAQ:   createFAQSchema,
  updateFAQ:   updateFAQSchema,
  reorderFAQs: reorderFAQsSchema,
};

export type CreateFAQData  = z.infer<typeof createFAQSchema>;
export type UpdateFAQData  = z.infer<typeof updateFAQSchema>;
export type ReorderFAQData = z.infer<typeof reorderFAQsSchema>;
