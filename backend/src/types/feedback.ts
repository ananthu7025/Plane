export type FeedbackCategory =
  | "general"
  | "course"
  | "mcq"
  | "mentorship"
  | "newsletter"
  | "community";

export type FeedbackStatus = "pending" | "reviewed";

export interface Feedback {
  id: number;
  studentId: string;
  studentName: string | null;
  category: string;
  subject: string | null;
  rating: number;
  feedback: string;
  status: string;
  response: string | null;
  respondedBy: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminFeedbackStats {
  total: number;
  avgRating: number;
  reviewed: number;
  pending: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  avgRating: number;
}

export interface StudentFeedbackStats {
  total: number;
  reviewed: number;
  pending: number;
  avgRating: number;
}

export interface SubmitFeedbackInput {
  category: string;
  subject?: string;
  rating: number;
  feedback: string;
}

export interface RespondFeedbackInput {
  response: string;
}

export interface AdminFeedbackFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}
