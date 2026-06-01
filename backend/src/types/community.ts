/**
 * Community Types
 */

export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  categoryId: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string | null;
  status: "APPROVED" | "PENDING" | "REJECTED";
  likeCount: number;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface CommentLike {
  id: string;
  commentId: string;
  userId: string;
  createdAt: Date;
}

export interface BannedUser {
  id: string;
  userId: string;
  reason: string;
  bannedBy: string;
  banUntil?: Date | null;
  createdAt: Date;
}

export interface CreatePostInput {
  title: string;
  content: string;
  categoryId: number;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  categoryId?: number;
}

export interface CreateCommentInput {
  content: string;
  postId: string;
  parentCommentId?: string;
}

export interface ModerationActionInput {
  targetId: string;
  action: "approve" | "reject" | "delete";
  reason?: string;
  notifyUser?: boolean;
}

export interface BanUserInput {
  userId: string;
  reason: string;
  banUntil?: Date;
}

export interface CreateCategoryInput {
  name: string;
  description: string;
  color: string;
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
