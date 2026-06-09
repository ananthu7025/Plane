/**
 * Mentorship Validation Schemas
 */

import { z } from "zod";

const TOPICS = [
  "AIR_NAVIGATION",
  "FLIGHT_PLANNING",
  "METEOROLOGY",
  "AIRCRAFT_SYSTEMS",
  "ATPL_PREPARATION",
  "CPL_PREPARATION",
  "CAREER_GUIDANCE",
  "GENERAL_DOUBT_CLEARING",
] as const;

export const submitMentorshipSchema = z.object({
  topic: z.enum(TOPICS, { message: "Invalid topic" }),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must not exceed 1000 characters"),
  preferredDateTime: z
    .string()
    .datetime({ message: "preferredDateTime must be a valid ISO 8601 datetime" })
    .refine(
      (dt) => new Date(dt) > new Date(),
      "Preferred date must be in the future"
    ),
});

export const approveMentorshipSchema = z.object({
  scheduledDateTime: z
    .string()
    .datetime({ message: "scheduledDateTime must be a valid ISO 8601 datetime" })
    .optional(),
});

export const rejectMentorshipSchema = z.object({
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason must not exceed 500 characters"),
});

export const rescheduleMentorshipSchema = z.object({
  rescheduledDateTime: z
    .string()
    .datetime({ message: "rescheduledDateTime must be a valid ISO 8601 datetime" })
    .refine(
      (dt) => new Date(dt) > new Date(),
      "Rescheduled date must be in the future"
    ),
});

export const adminMentorshipQuerySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .refine((v) => v > 0)
    .optional(),
  limit: z
    .string()
    .transform(Number)
    .refine((v) => v > 0 && v <= 50)
    .optional(),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "RESCHEDULED", "COMPLETED", "CANCELLED", "all"])
    .optional(),
  search: z.string().optional(),
});

export const mentorshipSchemas = {
  submit:     submitMentorshipSchema,
  approve:    approveMentorshipSchema,
  reject:     rejectMentorshipSchema,
  reschedule: rescheduleMentorshipSchema,
  adminQuery: adminMentorshipQuerySchema,
};

export type SubmitMentorshipData     = z.infer<typeof submitMentorshipSchema>;
export type ApproveMentorshipData    = z.infer<typeof approveMentorshipSchema>;
export type RejectMentorshipData     = z.infer<typeof rejectMentorshipSchema>;
export type RescheduleMentorshipData = z.infer<typeof rescheduleMentorshipSchema>;
