export type MentorshipTopic =
  | "AIR_NAVIGATION"
  | "FLIGHT_PLANNING"
  | "METEOROLOGY"
  | "AIRCRAFT_SYSTEMS"
  | "ATPL_PREPARATION"
  | "CPL_PREPARATION"
  | "CAREER_GUIDANCE"
  | "GENERAL_DOUBT_CLEARING";

export type MentorshipStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export type MentorshipPaymentStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PAYMENT_FAILED";

export interface MentorshipRequest {
  id: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  reviewedBy: string | null;
  topic: MentorshipTopic;
  description: string;
  preferredDateTime: Date;
  status: MentorshipStatus;
  rejectionReason: string | null;
  rescheduledDateTime: Date | null;
  teamsJoinUrl: string | null;
  meetingStartDateTime: Date | null;
  meetingEndDateTime: Date | null;
  paymentStatus: MentorshipPaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  amountPaidPaise: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitMentorshipInput {
  topic: MentorshipTopic;
  description: string;
  preferredDateTime: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amountPaidPaise: number;
}

export interface ApproveMentorshipInput {
  scheduledDateTime?: string;
}

export interface RejectMentorshipInput {
  reason: string;
}

export interface RescheduleMentorshipInput {
  rescheduledDateTime: string;
}

export interface MentorshipStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
}

export interface AdminMentorshipFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface TeamsOnlineMeeting {
  id: string;
  joinWebUrl: string;
  startDateTime: string;
  endDateTime: string;
}

// ── Slot Templates ────────────────────────────────────────────────────────────

export interface SlotTemplate {
  id: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "HH:MM"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSlotTemplateInput {
  dayOfWeek: number;
  startTime: string;
}

export interface CopySlotsInput {
  fromDay: number;
  toDays: number[];
}

export interface AvailableSlot {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  available: boolean;
}

// ── Payment ───────────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  topic: MentorshipTopic;
  description: string;
  slotDateTime: string; // ISO 8601
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  topic: MentorshipTopic;
  description: string;
  slotDateTime: string;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface MentorshipSettings {
  sessionFeePaise: number;
  sessionFeeFormatted: string;
}
