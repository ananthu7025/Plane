import { z } from 'zod';

export const communitySchemas = {
  createPost: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    content: z.string().min(20, 'Content must be at least 20 characters').max(5000),
    categoryId: z.coerce.number().int().positive('Category ID must be a positive number'),
    isAnonymous: z.boolean().optional().default(false),
  }),

  updatePost: z.object({
    title: z.string().min(5).max(200).optional(),
    content: z.string().min(20).max(5000).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
  }).strict(),

  getPostFeed: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    categoryId: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
  }),

  getComments: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
  }),

  createComment: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment must be less than 1000 characters'),
    parentCommentId: z.string().optional(),
  }),

  moderationAction: z.object({
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(500).optional(),
  }),

  banUser: z.object({
    userId: z.string().uuid('Invalid user ID'),
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
    banUntil: z.string().datetime().optional(),
  }),

  unbanUser: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),

  createCategory: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name must not exceed 100 characters'),
    description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
    color: z.string().optional(),
    slug: z.string().min(2).max(100).optional(),
  }),

  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),

  getMyPosts: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  }),

  getAdminPosts: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    search: z.string().max(200).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED']).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
  }),
};
