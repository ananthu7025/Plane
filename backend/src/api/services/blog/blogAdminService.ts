/**
 * Blog Admin Service
 * Handles blog creation, retrieval, updating, deletion, and publishing
 * Admin-only operations for blog management
 */

import { db } from "../../../db/index.js";
import { blogs } from "../../../db/schema.js";
import { eq, sql, desc, ilike, and, isNull } from "drizzle-orm";
import {
  BlogNotFoundError,
  BlogContentTooLongError,
  InvalidBlogStatusError,
} from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import type {
  Blog,
  CreateBlogInput,
  UpdateBlogInput,
  BlogStats,
} from "../../../types/blog.js";

/**
 * Create a new blog post
 * Sets auto timestamps and defaults (viewCount=0, acknowledgementCount=0)
 */
export async function createBlog(
  userId: string,
  data: CreateBlogInput
): Promise<Blog> {
  // Validate content length
  if (data.content.length > 50000) {
    throw new BlogContentTooLongError(
      "Blog content must not exceed 50,000 characters"
    );
  }

  const publishedDate =
    data.status === "published" ? new Date() : null;

  const [blog] = await db
    .insert(blogs)
    .values({
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      status: data.status,
      coverImageUrl: data.coverImageUrl,
      authorId: userId,
      publishedDate,
      viewCount: 0,
      acknowledgementCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
    .returning();

  logger.info("Blog created via admin", "BLOG", {
    blogId: blog.id,
    userId,
    status: blog.status,
    title: blog.title,
  });

  return transformBlog(blog);
}

/**
 * Get all blogs with admin view (includes draft blogs)
 * Supports filtering by status, category, and search query
 */
export async function getAllBlogsAdmin(
  searchQuery?: string,
  category?: string,
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ blogs: Blog[]; total: number; stats: BlogStats }> {
  const limitSafe = Math.min(limit, 50);
  const offset = (page - 1) * limitSafe;

  // Build where clause
  const conditions: any[] = [isNull(blogs.deletedAt)]; // Exclude soft-deleted

  if (status && status !== "all") {
    conditions.push(eq(blogs.status, status));
  }

  if (category) {
    conditions.push(eq(blogs.category, category));
  }

  if (searchQuery) {
    conditions.push(ilike(blogs.title, `%${searchQuery}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch items and count in parallel
  const [items, countResult, statsResult] = await Promise.all([
    db
      .select()
      .from(blogs)
      .where(whereClause)
      .orderBy(desc(blogs.createdAt))
      .limit(limitSafe)
      .offset(offset),
    db
      .select({ count: sql`COUNT(*)::int` })
      .from(blogs)
      .where(whereClause),
    db
      .select({
        totalPublished: sql`COUNT(CASE WHEN status = 'published' THEN 1 END)::int`,
        totalViews: sql`COALESCE(SUM(view_count), 0)::int`,
        totalAcknowledgements: sql`COALESCE(SUM(acknowledgement_count), 0)::int`,
      })
      .from(blogs)
      .where(whereClause),
  ]);

  const total = (countResult[0]?.count as number | undefined) || 0;
  const stats: BlogStats = {
    totalBlogs: total,
    totalPublished: (statsResult[0]?.totalPublished as number | undefined) || 0,
    totalViews: (statsResult[0]?.totalViews as number | undefined) || 0,
    totalAcknowledgements: (statsResult[0]?.totalAcknowledgements as number | undefined) || 0,
  };

  logger.info("Admin blogs fetched", "BLOG", {
    total,
    page,
    limit: limitSafe,
    hasSearch: !!searchQuery,
    hasCategory: !!category,
  });

  return {
    blogs: items.map(transformBlog),
    total,
    stats,
  };
}

/**
 * Get single blog by ID (admin view)
 * Shows all blog details including unpublished drafts
 */
export async function getBlogAdmin(blogId: number): Promise<Blog> {
  const blog = await db.query.blogs.findFirst({
    where: and(eq(blogs.id, blogId), isNull(blogs.deletedAt)),
  });

  if (!blog) {
    throw new BlogNotFoundError(`Blog with ID ${blogId} not found`);
  }

  logger.info("Admin blog fetched", "BLOG", { blogId });

  return transformBlog(blog);
}

/**
 * Update blog content, status, metadata
 * Automatically sets updatedAt timestamp
 */
export async function updateBlog(
  blogId: number,
  data: UpdateBlogInput
): Promise<Blog> {
  const blog = await getBlogAdmin(blogId); // Verify exists

  // Validate content length if provided
  if (data.content && data.content.length > 50000) {
    throw new BlogContentTooLongError(
      "Blog content must not exceed 50,000 characters"
    );
  }

  // Set publishedDate when publishing (convert string back to Date if needed)
  let publishedDate: Date | null;
  if (data.status === "published" && !blog.publishedDate) {
    publishedDate = new Date();
  } else if (blog.publishedDate) {
    publishedDate = new Date(blog.publishedDate);
  } else {
    publishedDate = null;
  }

  await db
    .update(blogs)
    .set({
      title: data.title ?? blog.title,
      excerpt: data.excerpt ?? blog.excerpt,
      content: data.content ?? blog.content,
      category: data.category ?? blog.category,
      status: (data.status as any) ?? blog.status,
      coverImageUrl: data.coverImageUrl ?? blog.coverImageUrl,
      publishedDate,
      updatedAt: new Date(),
    })
    .where(eq(blogs.id, blogId));

  logger.info("Blog updated via admin", "BLOG", {
    blogId,
    changedFields: Object.keys(data).filter(
      (k) => data[k as keyof UpdateBlogInput] !== undefined
    ),
  });

  return getBlogAdmin(blogId);
}

/**
 * Soft delete blog (sets deletedAt timestamp)
 * Maintains audit trail, does not remove from database
 */
export async function deleteBlog(blogId: number): Promise<void> {
  const blog = await getBlogAdmin(blogId); // Verify exists

  await db
    .update(blogs)
    .set({ deletedAt: new Date() })
    .where(eq(blogs.id, blogId));

  logger.info("Blog deleted via admin (soft delete)", "BLOG", {
    blogId,
    title: blog.title,
  });
}

/**
 * Publish or unpublish blog
 * Sets publishedDate when publishing, clears when unpublishing
 */
export async function publishBlog(
  blogId: number,
  action: "publish" | "unpublish"
): Promise<Blog> {
  const blog = await getBlogAdmin(blogId);

  // Validate action
  if (!["publish", "unpublish"].includes(action)) {
    throw new InvalidBlogStatusError(
      `Invalid publish action: ${action}. Must be "publish" or "unpublish"`
    );
  }

  const newStatus = action === "publish" ? "published" : "draft";
  const publishedDate =
    action === "publish" ? new Date() : null;

  await db
    .update(blogs)
    .set({
      status: newStatus,
      publishedDate,
      updatedAt: new Date(),
    })
    .where(eq(blogs.id, blogId));

  logger.info("Blog status changed via admin", "BLOG", {
    blogId,
    action,
    newStatus,
    title: blog.title,
  });

  return getBlogAdmin(blogId);
}

/**
 * Transform database blog object to API response format
 * Calculates read time based on word count
 */
function transformBlog(
  dbBlog: typeof blogs.$inferSelect
): Blog {
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
