export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface FAQStats {
  total: number;
  active: number;
  inactive: number;
}

export interface CreateFAQInput {
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
}

export interface UpdateFAQInput {
  question?: string;
  answer?: string;
  category?: string;
  isActive?: boolean;
}

export interface ReorderItem {
  id: number;
  order: number;
}

export const FAQ_CATEGORIES = [
  "General",
  "Getting Started",
  "MCQ",
  "Courses",
  "Mentorship",
  "Newsletter",
  "Payments",
  "Account",
] as const;

export type FAQCategory = (typeof FAQ_CATEGORIES)[number];
