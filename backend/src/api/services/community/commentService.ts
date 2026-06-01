import { db } from "../../../db/index.js";
import { communityComments, communityPosts, userProfiles } from "../../../db/schema.js";
import { eq, desc, and, isNull } from "drizzle-orm";
import { CommentNotFoundError, PostNotFoundError, UserBannedError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import type { CreateCommentInput, PaginatedResponse } from "../../../types/community.js";

/**
 * Create a comment
 */
export async function createComment(userId: string, data: CreateCommentInput): Promise<any> {
  try {
    // Verify post exists
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, data.postId),
    });

    if (!post) throw new PostNotFoundError("Post not found");

    const [comment] = await db
      .insert(communityComments)
      .values({
        postId: data.postId,
        authorId: userId,
        content: data.content,
        parentCommentId: data.parentCommentId,
        path: "",
        depth: 0,
        status: "APPROVED",
        likeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Fetch author info from userProfiles
    const authorProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
      columns: { fullName: true },
    });

    // Update post comment count
    await db
      .update(communityPosts)
      .set({ commentCount: (post.commentCount || 0) + 1 })
      .where(eq(communityPosts.id, data.postId));

    logger.info("Comment created", "APP", { commentId: comment.id, postId: data.postId, userId });

    // Return comment with author info for frontend compatibility
    return {
      ...comment,
      authorName: authorProfile?.fullName || "Unknown",
    };
  } catch (error) {
    logger.error("Failed to create comment", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Get all comments for a post (including nested replies)
 * Returns all comments sorted by creation date
 */
export async function getPostComments(postId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> {
  const limit_safe = Math.min(limit, 50);
  const offset = (page - 1) * limit_safe;

  try {
    // Get ALL comments (both parent and nested), not just top-level
    const conditions = [
      eq(communityComments.postId, postId),
      isNull(communityComments.deletedAt),
    ];

    const [items, countResult] = await Promise.all([
      db.query.communityComments.findMany({
        where: and(...conditions),
        orderBy: desc(communityComments.createdAt),
        limit: limit_safe,
        offset,
      }),
      db.select().from(communityComments).where(and(...conditions)),
    ]);

    // Fetch author profiles for all comments
    const authorIds = items.map((item: any) => item.authorId);
    const profiles = await db.query.userProfiles.findMany({
      where: (profile, { inArray }) => inArray(profile.userId, authorIds),
    });

    const profileMap = new Map(profiles.map((p: any) => [p.userId, p]));

    // Transform items to include author name at top level for compatibility
    const transformedItems = items.map((item: any) => ({
      ...item,
      authorId: item.authorId,
      authorName: profileMap.get(item.authorId)?.fullName || "Unknown",
    }));

    return {
      items: transformedItems,
      pagination: { page, limit: limit_safe, total: countResult.length, totalPages: Math.ceil(countResult.length / limit_safe) },
    };
  } catch (error) {
    logger.error("Failed to fetch comments", undefined, error instanceof Error ? error : undefined);
    throw new CommentNotFoundError("Failed to fetch comments");
  }
}

/**
 * Get all comments for a post (including nested replies)
 * Returns both parent comments and nested replies with parentCommentId
 */
export async function getAllPostCommentsWithReplies(postId: string): Promise<any[]> {
  try {
    const allComments = await db.query.communityComments.findMany({
      where: and(
        eq(communityComments.postId, postId),
        isNull(communityComments.deletedAt)
      ),
      orderBy: [
        // Order parent comments by creation date
        desc(communityComments.createdAt),
      ],
    });

    // Fetch author profiles for all comments
    const authorIds = allComments.map((item: any) => item.authorId);
    const profiles = await db.query.userProfiles.findMany({
      where: (profile, { inArray }) => inArray(profile.userId, authorIds),
    });

    const profileMap = new Map(profiles.map((p: any) => [p.userId, p]));

    // Transform items to include author name at top level for compatibility
    const transformedItems = allComments.map((item: any) => ({
      ...item,
      authorId: item.authorId,
      authorName: profileMap.get(item.authorId)?.fullName || "Unknown",
    }));

    return transformedItems;
  } catch (error) {
    logger.error("Failed to fetch all comments with replies", undefined, error instanceof Error ? error : undefined);
    throw new CommentNotFoundError("Failed to fetch all comments with replies");
  }
}

/**
 * Delete comment (soft delete)
 */
export async function deleteComment(id: string, userId: string): Promise<void> {
  try {
    const comment = await db.query.communityComments.findFirst({
      where: eq(communityComments.id, id),
    });

    if (!comment) throw new CommentNotFoundError("Comment not found");
    if (comment.authorId !== userId) throw new UserBannedError("You can only delete your own comments");

    await db
      .update(communityComments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(communityComments.id, id));

    logger.info("Comment deleted", "APP", { commentId: id, userId });
  } catch (error) {
    if (error instanceof CommentNotFoundError || error instanceof UserBannedError) throw error;
    logger.error("Failed to delete comment", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}
