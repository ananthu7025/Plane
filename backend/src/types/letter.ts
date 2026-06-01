/**
 * Letter Types
 */

export interface Letter {
  id: string;
  userId: string;
  subject: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isAnonymous: boolean;
  isPublished: boolean;
  acknowledgementCount: number;
  coverMediaId?: string | null;
  createdAt: Date;
  publishedAt?: Date | null;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateLetterInput {
  subject: string;
  content: string;
  isAnonymous?: boolean;
  coverMediaId?: string;
}

export interface ResubmitLetterInput {
  subject: string;
  content: string;
  coverMediaId?: string;
}

export interface FormattedLetter {
  id: string;
  subject: string;
  content: string;
  status: string;
  isAnonymous: boolean;
  isPublished: boolean;
  acknowledgementCount: number;
  author?: {
    id: string;
    fullName: string;
    avatar?: string | null;
  } | null;
  authorId?: string; // Only for admins
  coverMediaId?: string | null;
  isLiked?: boolean;
  createdAt: Date;
  publishedAt?: Date | null;
  updatedAt: Date;
}

export interface GetLettersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "recent" | "popular" | "trending";
}

export interface GetMyLettersParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  sortBy?: "recent" | "oldest";
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
