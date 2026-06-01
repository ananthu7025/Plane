import { db } from "../../../db/index.js";
import { postLikes, commentLikes, communityPosts, communityComments } from "../../../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../../../utils/logger.js";
import type { PaginatedResponse } from "../../../types/community.js";

/**
 * Helper: Check if user liked a post
 */
export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  const like = await db.query.postLikes.findFirst({
    where: and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)),
  });
  return !!like;
}

/**
 * Helper: Check if user liked a comment
 */
export async function hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
  const like = await db.query.commentLikes.findFirst({
    where: and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)),
  });
  return !!like;
}

export async function likePost(postId: string, userId: string): Promise<{ likeCount: number }> {
  try {
    const post = await db.query.communityPosts.findFirst({ where: eq(communityPosts.id, postId) });
    if (!post) throw new Error("Post not found");

    const existing = await db.query.postLikes.findFirst({
      where: and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)),
    });

    if (!existing) {
      await db.insert(postLikes).values({ postId, userId, createdAt: new Date() });
      await db
        .update(communityPosts)
        .set({ likeCount: (post.likeCount || 0) + 1 })
        .where(eq(communityPosts.id, postId));
      logger.info("Post liked", "APP", { postId, userId });
    }

    const updated = await db.query.communityPosts.findFirst({ where: eq(communityPosts.id, postId) });
    return { likeCount: updated?.likeCount || 0 };
  } catch (error) {
    logger.error("Failed to like post", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

export async function unlikePost(postId: string, userId: string): Promise<{ likeCount: number }> {
  try {
    const post = await db.query.communityPosts.findFirst({ where: eq(communityPosts.id, postId) });
    if (!post) throw new Error("Post not found");

    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    await db
      .update(communityPosts)
      .set({ likeCount: Math.max((post.likeCount || 1) - 1, 0) })
      .where(eq(communityPosts.id, postId));
    logger.info("Post unliked", "APP", { postId, userId });

    const updated = await db.query.communityPosts.findFirst({ where: eq(communityPosts.id, postId) });
    return { likeCount: updated?.likeCount || 0 };
  } catch (error) {
    logger.error("Failed to unlike post", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Like a comment
 */
export async function likeComment(commentId: string, userId: string): Promise<{ likeCount: number }> {
  try {
    const comment = await db.query.communityComments.findFirst({ where: eq(communityComments.id, commentId) });
    if (!comment) throw new Error("Comment not found");

    const existing = await db.query.commentLikes.findFirst({
      where: and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)),
    });

    if (!existing) {
      await db.insert(commentLikes).values({ commentId, userId, createdAt: new Date() });
      await db
        .update(communityComments)
        .set({ likeCount: (comment.likeCount || 0) + 1 })
        .where(eq(communityComments.id, commentId));
      logger.info("Comment liked", "APP", { commentId, userId });
    }

    const updated = await db.query.communityComments.findFirst({ where: eq(communityComments.id, commentId) });
    return { likeCount: updated?.likeCount || 0 };
  } catch (error) {
    logger.error("Failed to like comment", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Unlike a comment
 */
export async function unlikeComment(commentId: string, userId: string): Promise<{ likeCount: number }> {
  try {
    const comment = await db.query.communityComments.findFirst({ where: eq(communityComments.id, commentId) });
    if (!comment) throw new Error("Comment not found");

    await db.delete(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));
    await db
      .update(communityComments)
      .set({ likeCount: Math.max((comment.likeCount || 1) - 1, 0) })
      .where(eq(communityComments.id, commentId));
    logger.info("Comment unliked", "APP", { commentId, userId });

    const updated = await db.query.communityComments.findFirst({ where: eq(communityComments.id, commentId) });
    return { likeCount: updated?.likeCount || 0 };
  } catch (error) {
    logger.error("Failed to unlike comment", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Get users who liked a post
 */
export async function getPostLikers(
  postId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<any>> {
  const limit_safe = Math.min(limit, 50);
  const offset = (page - 1) * limit_safe;

  try {
    const [items, countResult] = await Promise.all([
      db
        .select({
          id: postLikes.id,
          userId: postLikes.userId,
          createdAt: postLikes.createdAt,
        })
        .from(postLikes)
        .where(eq(postLikes.postId, postId))
        .orderBy(desc(postLikes.createdAt))
        .limit(limit_safe)
        .offset(offset),
      db.select().from(postLikes).where(eq(postLikes.postId, postId)),
    ]);

    return {
      items,
      pagination: {
        page,
        limit: limit_safe,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit_safe),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch post likers", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Toggle like on post (Instagram/Facebook style)
 * Returns both isLiked and updated likeCount
 */
export async function togglePostLike(
  postId: string,
  userId: string
): Promise<{ isLiked: boolean; likeCount: number }> {
  try {
    const post = await db.query.communityPosts.findFirst({ where: eq(communityPosts.id, postId) });
    if (!post) throw new Error("Post not found");

    const existing = await db.query.postLikes.findFirst({
      where: and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)),
    });

    let isLiked = false;

    if (existing) {
      // Unlike
      await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      await db
        .update(communityPosts)
        .set({ likeCount: Math.max((post.likeCount || 1) - 1, 0) })
        .where(eq(communityPosts.id, postId));
      logger.info("Post unliked", "APP", { postId, userId });
    } else {
      // Like
      await db.insert(postLikes).values({ postId, userId, createdAt: new Date() });
      await db
        .update(communityPosts)
        .set({ likeCount: (post.likeCount || 0) + 1 })
        .where(eq(communityPosts.id, postId));
      isLiked = true;
      logger.info("Post liked", "APP", { postId, userId });
    }

    const updated = await db.query.communityPosts.findFirst({ where: eq(communityPosts.id, postId) });
    return { isLiked, likeCount: updated?.likeCount || 0 };
  } catch (error) {
    logger.error("Failed to toggle post like", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Toggle like on comment
 * Returns both isLiked and updated likeCount
 */
export async function toggleCommentLike(
  commentId: string,
  userId: string
): Promise<{ isLiked: boolean; likeCount: number }> {
  try {
    const comment = await db.query.communityComments.findFirst({ where: eq(communityComments.id, commentId) });
    if (!comment) throw new Error("Comment not found");

    const existing = await db.query.commentLikes.findFirst({
      where: and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)),
    });

    let isLiked = false;

    if (existing) {
      // Unlike
      await db.delete(commentLikes).where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));
      await db
        .update(communityComments)
        .set({ likeCount: Math.max((comment.likeCount || 1) - 1, 0) })
        .where(eq(communityComments.id, commentId));
      logger.info("Comment unliked", "APP", { commentId, userId });
    } else {
      // Like
      await db.insert(commentLikes).values({ commentId, userId, createdAt: new Date() });
      await db
        .update(communityComments)
        .set({ likeCount: (comment.likeCount || 0) + 1 })
        .where(eq(communityComments.id, commentId));
      isLiked = true;
      logger.info("Comment liked", "APP", { commentId, userId });
    }

    const updated = await db.query.communityComments.findFirst({ where: eq(communityComments.id, commentId) });
    return { isLiked, likeCount: updated?.likeCount || 0 };
  } catch (error) {
    logger.error("Failed to toggle comment like", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}
