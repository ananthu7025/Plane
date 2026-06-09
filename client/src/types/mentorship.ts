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
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
}

export interface SubmitMentorshipInput {
  topic: MentorshipTopic;
  description: string;
  preferredDateTime: string;
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
