/**
 * Blog Validation Schemas
 * Zod schemas for request validation
 */

import { z } from "zod";

const BLOG_CATEGORIES = [
  "Navigation",
  "Meteorology",
  "Aircraft Systems",
  "Regulations",
  "Exam Tips",
  "Career",
] as const;

const BLOG_STATUS = ["draft", "published"] as const;

/**
 * Create blog validation schema
 */
export const createBlogSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(255, "Title must not exceed 255 characters"),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt must not exceed 500 characters"),
  content: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(50000, "Content must not exceed 50000 characters"),
  category: z
    .enum(BLOG_CATEGORIES)
    .refine(
      (val) => BLOG_CATEGORIES.includes(val),
      "Invalid blog category"
    ),
  status: z.enum(BLOG_STATUS).default("draft"),
  coverImageUrl: z
    .string()
    .url("Cover image URL must be a valid URL")
    .optional()
    .or(z.literal("")),
});

/**
 * Update blog validation schema
 */
export const updateBlogSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(255, "Title must not exceed 255 characters")
    .optional(),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt must not exceed 500 characters")
    .optional(),
  content: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(50000, "Content must not exceed 50000 characters")
    .optional(),
  category: z
    .enum(BLOG_CATEGORIES)
    .refine(
      (val) => BLOG_CATEGORIES.includes(val),
      "Invalid blog category"
    )
    .optional(),
  status: z.enum(BLOG_STATUS).optional(),
  coverImageUrl: z
    .string()
    .url("Cover image URL must be a valid URL")
    .optional()
    .or(z.literal("")),
});

/**
 * Publish blog validation schema
 */
export const publishBlogSchema = z.object({
  action: z.enum(["publish", "unpublish"]),
});

/**
 * Record view validation schema
 */
export const recordViewSchema = z.object({
  params: z.object({
    blogId: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, "Blog ID must be a positive number"),
  }),
});

/**
 * Get published blogs query validation
 */
export const getPublishedBlogsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.enum(BLOG_CATEGORIES).optional(),
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, "Page must be positive")
      .default(1)
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine(
        (val) => val > 0 && val <= 50,
        "Limit must be between 1 and 50"
      )
      .default(20)
      .optional(),
  }),
});

/**
 * Get admin blogs query validation
 */
export const getAdminBlogsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.enum(BLOG_CATEGORIES).optional(),
    status: z
      .enum(["draft", "published", "all"])
      .transform((val) => (val === "all" ? undefined : val))
      .optional(),
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, "Page must be positive")
      .default(1)
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine(
        (val) => val > 0 && val <= 50,
        "Limit must be between 1 and 50"
      )
      .default(20)
      .optional(),
  }),
});

/**
 * Blog ID param validation
 */
export const blogIdParamSchema = z.object({
  params: z.object({
    blogId: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, "Blog ID must be a positive number"),
  }),
});

/**
 * Acknowledge blog validation
 */
export const acknowledgeBlogSchema = z.object({
  params: z.object({
    blogId: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, "Blog ID must be a positive number"),
  }),
});

/**
 * Export all schemas as a collection
 */
export const blogSchemas = {
  createBlog: createBlogSchema,
  updateBlog: updateBlogSchema,
  publishBlog: publishBlogSchema,
  recordView: recordViewSchema,
  getPublishedBlogs: getPublishedBlogsSchema,
  getAdminBlogs: getAdminBlogsSchema,
  blogIdParam: blogIdParamSchema,
  acknowledgeBlog: acknowledgeBlogSchema,
};

/**
 * Type exports for form data
 */
export type CreateBlogData = z.infer<typeof createBlogSchema>;
export type UpdateBlogData = z.infer<typeof updateBlogSchema>;
export type PublishBlogData = z.infer<typeof publishBlogSchema>;
