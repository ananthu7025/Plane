/**
 * Blog Access Service
 * Handles user interactions with blogs: acknowledgements and view tracking
 * Manages like/acknowledgement toggle and view recording for analytics
 */

import { db } from "../../../db/index.js";
import { blogs, blogAcknowledgements, blogViews } from "../../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { BlogNotFoundError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

/**
 * Toggle blog acknowledgement (like/heart)
 * Creates or deletes acknowledgement record for user
 * Increments/decrements acknowledgementCount on blog
 */
export async function toggleBlogAcknowledgement(
  blogId: number,
  userId: string
): Promise<{ acknowledged: boolean; count: number }> {
  // Verify blog exists
  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
  });

  if (!blog) {
    throw new BlogNotFoundError(`Blog with ID ${blogId} not found`);
  }

  // Check if user already acknowledged this blog
  const existing = await db.query.blogAcknowledgements.findFirst({
    where: and(
      eq(blogAcknowledgements.blogId, blogId),
      eq(blogAcknowledgements.userId, userId)
    ),
  });

  if (existing) {
    // User has already acknowledged, remove acknowledgement
    await db
      .delete(blogAcknowledgements)
      .where(
        and(
          eq(blogAcknowledgements.blogId, blogId),
          eq(blogAcknowledgements.userId, userId)
        )
      );

    // Decrement acknowledgement count (ensure it doesn't go below 0)
    const newCount = Math.max(0, blog.acknowledgementCount - 1);
    await db
      .update(blogs)
      .set({ acknowledgementCount: newCount })
      .where(eq(blogs.id, blogId));

    logger.info("Blog acknowledgement removed", "BLOG", {
      blogId,
      userId,
      newCount,
    });

    return { acknowledged: false, count: newCount };
  } else {
    // User hasn't acknowledged, create acknowledgement
    await db.insert(blogAcknowledgements).values({
      blogId,
      userId,
      createdAt: new Date(),
    });

    // Increment acknowledgement count
    const newCount = blog.acknowledgementCount + 1;
    await db
      .update(blogs)
      .set({ acknowledgementCount: newCount })
      .where(eq(blogs.id, blogId));

    logger.info("Blog acknowledged", "BLOG", {
      blogId,
      userId,
      newCount,
    });

    return { acknowledged: true, count: newCount };
  }
}

/**
 * Record blog view for analytics
 * Creates view entry in database and increments view count
 * Useful for tracking blog popularity and engagement
 */
export async function recordBlogView(
  blogId: number,
  userId?: string
): Promise<number> {
  // Verify blog exists
  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
  });

  if (!blog) {
    throw new BlogNotFoundError(`Blog with ID ${blogId} not found`);
  }

  // Create view record
  await db.insert(blogViews).values({
    blogId,
    userId: userId || null,
    viewedAt: new Date(),
  });

  // Increment view count
  const newCount = blog.viewCount + 1;
  await db
    .update(blogs)
    .set({ viewCount: newCount })
    .where(eq(blogs.id, blogId));

  logger.info("Blog view recorded", "BLOG", {
    blogId,
    userId: userId || "anonymous",
    newCount,
  });

  return newCount;
}
