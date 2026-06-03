/**
 * Blog Type Definitions
 * Shared types for blog feature across services and controllers
 */

/**
 * Blog data structure (API response format - dates as ISO strings)
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
}

/**
 * Input for creating a new blog
 */
export interface CreateBlogInput {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: "draft" | "published";
  coverImageUrl?: string;
}

/**
 * Input for updating a blog
 */
export interface UpdateBlogInput {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  status?: "draft" | "published";
  coverImageUrl?: string;
}

/**
 * Blog statistics for admin dashboard
 */
export interface BlogStats {
  totalBlogs: number;
  totalPublished: number;
  totalViews: number;
  totalAcknowledgements: number;
}

/**
 * Acknowledgement toggle response
 */
export interface AcknowledgementResponse {
  acknowledged: boolean;
  count: number;
}

/**
 * View count response
 */
export interface ViewCountResponse {
  viewCount: number;
}

/**
 * Blog list response with pagination (for students)
 */
export interface PaginatedBlogResponse {
  blogs: BlogWithAcknowledged[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Blog with user acknowledgement status
 */
export interface BlogWithAcknowledged extends Blog {
  userAcknowledged?: boolean;
}

/**
 * Admin blog list response with stats
 */
export interface AdminBlogListResponse {
  blogs: Blog[];
  total: number;
  stats: BlogStats;
}

/**
 * Blog category type
 */
export type BlogCategory =
  | "Navigation"
  | "Meteorology"
  | "Aircraft Systems"
  | "Regulations"
  | "Exam Tips"
  | "Career";

/**
 * Blog status enum
 */
export enum BlogStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

/**
 * Publish action type
 */
export type PublishAction = "publish" | "unpublish";

/**
 * Database blog model
 */
export type DBBlog = Blog;
