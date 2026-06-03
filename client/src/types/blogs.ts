/**
 * Blog Type Definitions for Frontend
 * Matches backend Blog interface
 */

export interface Blog {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: "draft" | "published";
  authorId: string | null;
  coverImageUrl: string | null;
  viewCount: number;
  acknowledgementCount: number;
  commentCount: number;
  publishedDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userAcknowledged?: boolean;
  readTime?: number;
}

export interface BlogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BlogStats {
  totalBlogs: number;
  totalPublished: number;
  totalViews: number;
  totalAcknowledgements: number;
}

export interface CreateBlogInput {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: "draft" | "published";
  coverImageUrl?: string;
}

export interface UpdateBlogInput {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  status?: "draft" | "published";
  coverImageUrl?: string;
}

export interface BlogListResponse {
  blogs: Blog[];
  pagination: BlogPagination;
}

export interface AdminBlogListResponse {
  blogs: Blog[];
  pagination: BlogPagination;
  stats: BlogStats;
}

export interface AcknowledgementResponse {
  acknowledged: boolean;
  acknowledgementCount: number;
}

export interface ViewCountResponse {
  viewCount: number;
}

export interface BlogFilters {
  search?: string;
  category?: string;
  status?: "draft" | "published" | "all";
  page?: number;
  limit?: number;
}

export interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: "draft" | "published";
  coverImageUrl?: string;
}

/**
 * Blog state slicing utilities
 */
export const blogStatusOptions = ["draft", "published"] as const;
export type BlogStatus = typeof blogStatusOptions[number];

export const blogCategoryOptions = [
  "Navigation",
  "Meteorology",
  "Aircraft Systems",
  "Regulations",
  "Exam Tips",
  "Career",
] as const;
export type BlogCategory = typeof blogCategoryOptions[number];
