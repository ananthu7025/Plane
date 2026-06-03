/**
 * Blog Student Service
 * Handles blog reading, filtering, and public operations for students
 * Student-facing operations (read-only, no creation/deletion)
 */

import { db } from "../../../db/index.js";
import { blogs, blogAcknowledgements } from "../../../db/schema.js";
import { eq, sql, desc, ilike, and, isNull } from "drizzle-orm";
import { BlogNotFoundError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import type { Blog } from "../../../types/blog.js";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Get all published blogs for students
 * Filters by published status, supports search and category filtering
 */
export async function getPublishedBlogs(
  searchQuery?: string,
  category?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ blogs: Blog[]; total: number; pagination: PaginationInfo }> {
  const limitSafe = Math.min(limit, 50);
  const offset = (page - 1) * limitSafe;

  // Build where clause
  const conditions: any[] = [
    eq(blogs.status, "published"),
    isNull(blogs.deletedAt),
  ];

  if (category) {
    conditions.push(eq(blogs.category, category));
  }

  if (searchQuery) {
    conditions.push(ilike(blogs.title, `%${searchQuery}%`));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch items and count in parallel
  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(blogs)
      .where(whereClause)
      .orderBy(desc(blogs.publishedDate))
      .limit(limitSafe)
      .offset(offset),
    db
      .select({ count: sql`COUNT(*)::int` })
      .from(blogs)
      .where(whereClause),
  ]);

  const total = (countResult[0]?.count as number | undefined) || 0;
  const totalPages = Math.ceil(total / limitSafe);

  logger.info("Published blogs fetched by student", "BLOG", {
    total,
    page,
    limit: limitSafe,
    totalPages,
    hasSearch: !!searchQuery,
    hasCategory: !!category,
  });

  return {
    blogs: items.map(transformBlog),
    total,
    pagination: {
      page,
      limit: limitSafe,
      total,
      totalPages,
    },
  };
}

/**
 * Get single published blog by ID
 * Shows blog details and whether current user has acknowledged it
 */
export async function getBlogStudent(
  blogId: number,
  userId?: string
): Promise<Blog & { userAcknowledged?: boolean }> {
  const blog = await db.query.blogs.findFirst({
    where: and(
      eq(blogs.id, blogId),
      eq(blogs.status, "published"),
      isNull(blogs.deletedAt)
    ),
  });

  if (!blog) {
    throw new BlogNotFoundError(
      `Published blog with ID ${blogId} not found`
    );
  }

  // Check if user has acknowledged this blog
  let userAcknowledged = false;
  if (userId) {
    const ack = await db.query.blogAcknowledgements.findFirst({
      where: and(
        eq(blogAcknowledgements.blogId, blogId),
        eq(blogAcknowledgements.userId, userId)
      ),
    });
    userAcknowledged = !!ack;
  }

  logger.info("Published blog fetched by student", "BLOG", {
    blogId,
    userId: userId || "anonymous",
    userAcknowledged,
  });

  return {
    ...transformBlog(blog),
    userAcknowledged,
  };
}

/**
 * Get all unique blog categories with published blogs
 * Used for category filter dropdown on frontend
 */
export async function getBlogCategories(): Promise<string[]> {
  const result = await db
    .selectDistinct({ category: blogs.category })
    .from(blogs)
    .where(and(eq(blogs.status, "published"), isNull(blogs.deletedAt)))
    .orderBy(blogs.category);

  const categories = result.map((r) => r.category);

  logger.info("Blog categories fetched", "BLOG", {
    count: categories.length,
    categories,
  });

  return categories;
}

/**
 * Transform database blog object to API response format
 * Calculates read time based on word count
 */
function transformBlog(dbBlog: typeof blogs.$inferSelect): Blog {
  // Calculate read time (assuming ~200 words per minute)
  const wordCount = dbBlog.content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  return {
    id: dbBlog.id,
    title: dbBlog.title,
    excerpt: dbBlog.excerpt,
    content: dbBlog.content,
    category: dbBlog.category,
    status: dbBlog.status as "draft" | "published",
    authorId: dbBlog.authorId,
    coverImageUrl: dbBlog.coverImageUrl,
    viewCount: dbBlog.viewCount,
    acknowledgementCount: dbBlog.acknowledgementCount,
    commentCount: dbBlog.commentCount,
    publishedDate: dbBlog.publishedDate?.toISOString() || null,
    createdAt: dbBlog.createdAt.toISOString(),
    updatedAt: dbBlog.updatedAt.toISOString(),
    deletedAt: dbBlog.deletedAt?.toISOString() || null,
  };
}
