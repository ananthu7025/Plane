import { MessageSquare, GraduationCap, BookOpen, Users, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FeedbackCategory =
  | "general" | "course" | "mcq"
  | "mentorship" | "newsletter" | "community";

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
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface FeedbackCategoryMeta {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const FEEDBACK_CATEGORY_META: FeedbackCategoryMeta[] = [
  { value: "general",      label: "General Feedback", icon: MessageSquare },
  { value: "course",       label: "Courses",          icon: GraduationCap },
  { value: "mcq",          label: "MCQ & Tests",      icon: BookOpen },
  { value: "mentorship",   label: "Mentorship",       icon: Users },
  { value: "newsletter",   label: "Newsletter",       icon: FileText },
  { value: "community",    label: "Community",        icon: MessageSquare },
];

export function getFeedbackCategoryMeta(category: string): FeedbackCategoryMeta {
  return (
    FEEDBACK_CATEGORY_META.find((c) => c.value === category) ??
    { value: category, label: category, icon: MessageSquare }
  );
}
