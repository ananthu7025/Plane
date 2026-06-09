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
  preferredDateTime: Date;
  status: MentorshipStatus;
  rejectionReason: string | null;
  rescheduledDateTime: Date | null;
  teamsJoinUrl: string | null;
  meetingStartDateTime: Date | null;
  meetingEndDateTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitMentorshipInput {
  topic: MentorshipTopic;
  description: string;
  preferredDateTime: string; // ISO 8601 string from client
}

export interface ApproveMentorshipInput {
  scheduledDateTime?: string; // Optional — falls back to preferredDateTime
}

export interface RejectMentorshipInput {
  reason: string;
}

export interface RescheduleMentorshipInput {
  rescheduledDateTime: string; // ISO 8601 string
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
