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
    .refine((dt) => new Date(dt) > new Date(), "Preferred date must be in the future"),
  razorpayOrderId:   z.string().min(1, "razorpayOrderId is required"),
  razorpayPaymentId: z.string().min(1, "razorpayPaymentId is required"),
  razorpaySignature: z.string().min(1, "razorpaySignature is required"),
  amountPaidPaise:   z.number().int().positive("amountPaidPaise must be a positive integer"),
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
    .refine((dt) => new Date(dt) > new Date(), "Rescheduled date must be in the future"),
});

export const adminMentorshipQuerySchema = z.object({
  page:  z.string().transform(Number).refine((v) => v > 0).optional(),
  limit: z.string().transform(Number).refine((v) => v > 0 && v <= 50).optional(),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "RESCHEDULED", "COMPLETED", "CANCELLED", "all"])
    .optional(),
  search: z.string().optional(),
});

// ── Slot Template Schemas ─────────────────────────────────────────────────────

export const createSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6, "dayOfWeek must be 0–6"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "startTime must be in HH:MM format"),
});

export const copySlotsSchema = z.object({
  fromDay: z.number().int().min(0).max(6),
  toDays:  z.array(z.number().int().min(0).max(6)).min(1, "toDays must not be empty"),
});

// ── Payment Schemas ───────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  topic: z.enum(TOPICS, { message: "Invalid topic" }),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must not exceed 1000 characters"),
  slotDateTime: z
    .string()
    .datetime({ message: "slotDateTime must be a valid ISO 8601 datetime" })
    .refine((dt) => new Date(dt) > new Date(), "Slot date must be in the future"),
});

// ── Settings Schemas ──────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  sessionFeePaise: z
    .number()
    .int()
    .min(100, "Fee must be at least ₹1 (100 paise)")
    .max(100000000, "Fee too large"),
});

export const mentorshipSchemas = {
  submit:         submitMentorshipSchema,
  approve:        approveMentorshipSchema,
  reject:         rejectMentorshipSchema,
  reschedule:     rescheduleMentorshipSchema,
  adminQuery:     adminMentorshipQuerySchema,
  createSlot:     createSlotSchema,
  copySlots:      copySlotsSchema,
  createOrder:    createOrderSchema,
  updateSettings: updateSettingsSchema,
};

export type SubmitMentorshipData     = z.infer<typeof submitMentorshipSchema>;
export type ApproveMentorshipData    = z.infer<typeof approveMentorshipSchema>;
export type RejectMentorshipData     = z.infer<typeof rejectMentorshipSchema>;
export type RescheduleMentorshipData = z.infer<typeof rescheduleMentorshipSchema>;
export type CreateSlotData           = z.infer<typeof createSlotSchema>;
export type CopySlotsData            = z.infer<typeof copySlotsSchema>;
export type CreateOrderData          = z.infer<typeof createOrderSchema>;
export type UpdateSettingsData       = z.infer<typeof updateSettingsSchema>;
