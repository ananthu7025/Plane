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
  preferredDateTime: string;
  status: MentorshipStatus;
  rejectionReason: string | null;
  rescheduledDateTime: string | null;
  teamsJoinUrl: string | null;
  meetingStartDateTime: string | null;
  meetingEndDateTime: string | null;
  paymentStatus: MentorshipPaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  amountPaidPaise: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
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

export interface AdminMentorshipFilters {
  page?: number;
  limit?: number;
  status?: MentorshipStatus | "all";
  search?: string;
}

// ── Slot Templates ────────────────────────────────────────────────────────────

export interface SlotTemplate {
  id: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

// ── Payment ───────────────────────────────────────────────────────────────────

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
  amountPaidPaise: number;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface MentorshipSettings {
  sessionFeePaise: number;
  sessionFeeFormatted: string;
}

export interface SlotsForDateResponse {
  slots: AvailableSlot[];
  sessionFeePaise: number;
  sessionFeeFormatted: string;
}
