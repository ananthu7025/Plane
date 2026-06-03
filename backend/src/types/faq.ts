export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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

export interface AdminFAQListResponse {
  faqs: FAQ[];
  stats: FAQStats;
}
