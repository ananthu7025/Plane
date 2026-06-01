import { db } from "../../../db/index.js";
import { communityPosts, communityComments } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../../utils/logger.js";

export async function approvePost(postId: string): Promise<void> {
  try {
    await db.update(communityPosts).set({ status: "APPROVED" }).where(eq(communityPosts.id, postId));
    logger.info("Post approved", "APP", { postId });
  } catch (error) {
    logger.error("Failed to approve post", undefined, error instanceof Error ? error : undefined);
  }
}

export async function rejectPost(postId: string): Promise<void> {
  try {
    await db.update(communityPosts).set({ status: "REJECTED" }).where(eq(communityPosts.id, postId));
    logger.info("Post rejected", "APP", { postId });
  } catch (error) {
    logger.error("Failed to reject post", undefined, error instanceof Error ? error : undefined);
  }
}

export async function approveComment(commentId: string): Promise<void> {
  try {
    await db.update(communityComments).set({ status: "APPROVED" }).where(eq(communityComments.id, commentId));
    logger.info("Comment approved", "APP", { commentId });
  } catch (error) {
    logger.error("Failed to approve comment", undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * Admin approve post (returns post object)
 */
export async function adminApprovePost(postId: string): Promise<any> {
  try {
    const [post] = await db
      .update(communityPosts)
      .set({ status: "APPROVED" })
      .where(eq(communityPosts.id, postId))
      .returning();
    logger.info("Post approved by admin", "APP", { postId });
    return post;
  } catch (error) {
    logger.error("Failed to approve post", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Admin decline/reject post (returns post object)
 */
export async function adminDeclinePost(postId: string): Promise<any> {
  try {
    const [post] = await db
      .update(communityPosts)
      .set({ status: "REJECTED" })
      .where(eq(communityPosts.id, postId))
      .returning();
    logger.info("Post declined by admin", "APP", { postId });
    return post;
  } catch (error) {
    logger.error("Failed to decline post", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Admin delete reply/comment (hard or soft delete)
 */
export async function adminDeleteReply(commentId: string): Promise<void> {
  try {
    await db
      .update(communityComments)
      .set({ deletedAt: new Date() })
      .where(eq(communityComments.id, commentId));
    logger.info("Comment deleted by admin", "APP", { commentId });
  } catch (error) {
    logger.error("Failed to delete comment", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}
