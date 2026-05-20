import { db } from "../../db/index.js";
import {
  communityPosts,
  communityCategories,
  postLikes,
  communityComments,
  commentLikes,
  users,
  bannedUsers,
  userProfiles,
  auditLogs,
} from "../../db/schema.js";
import {
  eq,
  and,
  desc,
  count,
  sql,
  ilike,
  isNull,
} from "drizzle-orm";
import {
  NotFoundError,
  ForbiddenError,
  AppError,
} from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { validate, createPostSchema } from "../../utils/validation.js";
import { filterContent } from "../../utils/contentFilter.js";
import {
  POST_STATUS,
  POST_STATUS_VALUES,
  DEFAULT_PAGINATION,
  CONTENT_LIMITS,
  ACTIVITY_LOG_ENTITY_TYPES,
  ACTIVITY_LOG_ENTITY_TYPE_PATTERN,
  ERROR_MESSAGES,
} from "./communityConstants.js";

interface CreatePostData {
  title: string;
  content: string;
  categoryId: number;
  isAnonymous?: boolean;
}

interface GetPostsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

/**
 * Check if user is banned from community
 */
async function isUserBanned(userId: string): Promise<boolean> {
  const banned = await db.query.bannedUsers.findFirst({
    where: and(
      eq(bannedUsers.userId, userId),
      isNull(bannedUsers.banUntil)
    ),
  });
  return !!banned;
}

/**
 * Format post for response with author info
 * @param post - The post to format
 * @param viewerId - The ID of the user viewing (to check if admin)
 */
async function formatPost(post: any, viewerId?: string) {
  let author = null;

  // Check if viewer is admin
  let isViewerAdmin = false;
  if (viewerId) {
    try {
      const viewer = await db.query.users.findFirst({
        where: eq(users.id, viewerId),
        with: { role: true },
      });

      // Check if viewer's role is ADMIN (case-insensitive for safety)
      isViewerAdmin = viewer?.role?.name?.toUpperCase() === "ADMIN";

      if (post.isAnonymous && isViewerAdmin) {
        logger.info(
          `Admin ${viewerId} viewing anonymous post ${post.id}`,
          "COMMUNITY_POST_SERVICE"
        );
      }
    } catch (error) {
      logger.error(
        `Failed to check admin status for user ${viewerId}`,
        "COMMUNITY_POST_SERVICE",
        error as Error
      );
    }
  }

  // Show author for non-anonymous posts, or if viewer is admin
  const shouldShowAuthor = !post.isAnonymous || isViewerAdmin;

  if (shouldShowAuthor) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, post.authorId),
      with: { profile: true, role: true },
    });

    if (user) {
      author = {
        id: user.id,
        name: user.profile?.fullName || "Unknown",
        role: user.role.name,
        avatar: user.profile?.avatarMediaId,
      };
    }
  } else {
    // Hide author for anonymous posts (non-admin users)
    author = {
      id: null,
      name: "Anonymous",
      role: null,
      avatar: null,
    };
  }

  const category = await db.query.communityCategories.findFirst({
    where: eq(communityCategories.id, post.categoryId),
  });

  const formattedComments = post.comments?.map((comment: any) => ({
    id: comment.id,
    content: comment.content,
    author: {
      id: comment.author?.id,
      name: comment.author?.profile?.fullName || "Unknown",
      avatar: comment.author?.profile?.avatarMediaId,
    },
    likeCount: comment.likeCount,
    createdAt: comment.createdAt,
  })) || [];

  return {
    id: post.id,
    author,
    category: category?.name || "Unknown",
    categoryId: post.categoryId,
    content: post.content,
    isAnonymous: post.isAnonymous,
    status: post.status,
    likeCount: post.likeCount,
    commentCount: formattedComments.length > 0 ? formattedComments.length : post.commentCount,
    comments: formattedComments,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

/**
 * Create a new community post (pending approval)
 */
export async function createPost(userId: string, data: CreatePostData) {
  try {
    // Validate input
    const validated = validate(createPostSchema, {
      title: data.title,
      content: data.content,
      categoryId: data.categoryId,
      isAnonymous: data.isAnonymous,
    });

    // Check content for spam/profanity
    const contentCheck = filterContent(validated.content);
    if (contentCheck.severity === 'violation') {
      throw new AppError(
        400,
        "CONTENT_VIOLATION",
        `Post violates content policy: ${contentCheck.violations[0]}`
      );
    }

    // Check if user is banned
    const banned = await isUserBanned(userId);
    if (banned) {
      throw new ForbiddenError("You are banned from the community");
    }

    // Verify category exists
    const category = await db.query.communityCategories.findFirst({
      where: eq(communityCategories.id, validated.categoryId),
    });

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Create post with pending status
    const newPost = await db
      .insert(communityPosts)
      .values({
        authorId: userId,
        categoryId: validated.categoryId,
        title: validated.title,
        content: validated.content,
        isAnonymous: validated.isAnonymous || false,
        status: POST_STATUS.PENDING,
      })
      .returning();

    const post = newPost[0];
    logger.info(
      `Post created by user ${userId}`,
      "COMMUNITY_POST_SERVICE",
      { postId: post.id }
    );

    return await formatPost(post);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    logger.error(
      `Failed to create post for user ${userId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "POST_CREATE_ERROR", ERROR_MESSAGES.POST_CREATE_ERROR);
  }
}

/**
 * Get all approved posts with pagination and filtering
 */
export async function getAllApprovedPosts(params: GetPostsParams) {
  try {
    const {
      page = DEFAULT_PAGINATION.POST_PAGE,
      limit = DEFAULT_PAGINATION.POST_LIMIT,
      category,
      search,
    } = params;

    // Build where conditions
    const whereConditions = [
      eq(communityPosts.status, POST_STATUS.APPROVED),
      isNull(communityPosts.deletedAt),
    ];

    if (category && category !== "") {
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        whereConditions.push(eq(communityPosts.categoryId, categoryId));
      }
    }

    if (search && search.trim() !== "") {
      whereConditions.push(ilike(communityPosts.content, `%${search.trim()}%`));
    }

    const whereClause = whereConditions.length > 1
      ? and(...whereConditions)
      : whereConditions[0];

    // Get total count
    const countResult = await db
      .select({ count: count(communityPosts.id) })
      .from(communityPosts)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get paginated posts with comments for accurate count
    const offset = (page - 1) * limit;
    const posts = await db.query.communityPosts.findMany({
      where: whereClause,
      with: {
        comments: {
          with: {
            author: {
              with: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: desc(communityPosts.createdAt),
      limit,
      offset,
    });

    // Format all posts
    const formattedPosts = await Promise.all(
      posts.map((post) => formatPost(post))
    );

    return {
      data: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(
      "Failed to get approved posts",
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "POST_FETCH_ERROR", ERROR_MESSAGES.POST_FETCH_ERROR);
  }
}

/**
 * Get a single post by ID
 */
export async function getPostById(postId: string) {
  try {
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
      with: {
        category: true,
        author: {
          with: {
            profile: true,
            role: true,
          },
        },
        comments: {
          with: {
            author: {
              with: {
                profile: true,
              },
            },
          },
        },
        likes: true,
      },
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    return await formatPost(post);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(
      `Failed to get post ${postId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "POST_FETCH_ERROR", "Failed to fetch post");
  }
}

/**
 * Delete a post (user can only delete own pending posts)
 */
export async function deletePost(postId: string, userId: string) {
  try {
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // User can delete their own posts, admin can delete any
    if (post.authorId !== userId) {
      throw new ForbiddenError("Cannot delete other user's post");
    }

    // Soft delete by setting deletedAt
    await db
      .update(communityPosts)
      .set({ deletedAt: new Date() })
      .where(eq(communityPosts.id, postId));

    logger.info(
      `Post ${postId} deleted by user ${userId}`,
      "COMMUNITY_POST_SERVICE"
    );

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    logger.error(
      `Failed to delete post ${postId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "POST_DELETE_ERROR", ERROR_MESSAGES.POST_DELETE_ERROR);
  }
}

/**
 * Like or unlike a post
 */
export async function togglePostLike(postId: string, userId: string) {
  try {
    // Check if post exists
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Check if already liked
    const existingLike = await db.query.postLikes.findFirst({
      where: and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, userId)
      ),
    });

    if (existingLike) {
      // Unlike
      await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, userId)
          )
        );

      await db
        .update(communityPosts)
        .set({
          likeCount: sql`${communityPosts.likeCount} - 1`,
        })
        .where(eq(communityPosts.id, postId));

      logger.info(`User ${userId} unliked post ${postId}`, "COMMUNITY_POST_SERVICE");
    } else {
      // Like
      await db.insert(postLikes).values({
        postId,
        userId,
      });

      await db
        .update(communityPosts)
        .set({
          likeCount: sql`${communityPosts.likeCount} + 1`,
        })
        .where(eq(communityPosts.id, postId));

      logger.info(`User ${userId} liked post ${postId}`, "COMMUNITY_POST_SERVICE");
    }

    // Get updated post
    const updated = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    return {
      likeCount: updated?.likeCount || 0,
      liked: !existingLike,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(
      `Failed to toggle like for post ${postId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "LIKE_TOGGLE_ERROR", ERROR_MESSAGES.LIKE_TOGGLE_ERROR);
  }
}

/**
 * Get user's own posts (all statuses)
 */
export async function getUserPosts(
  userId: string,
  params: GetPostsParams & { status?: string }
) {
  try {
    const { page = 1, limit = 20, status } = params;

    // Build where conditions
    const whereConditions: any[] = [
      eq(communityPosts.authorId, userId),
      isNull(communityPosts.deletedAt),
    ];

    // Filter by status if provided
    if (status && POST_STATUS_VALUES.includes(status as any)) {
      whereConditions.push(eq(communityPosts.status, status as any));
    }

    const whereClause = whereConditions.length > 1
      ? and(...whereConditions)
      : whereConditions[0];

    // Get total count
    const countResult = await db
      .select({ count: count(communityPosts.id) })
      .from(communityPosts)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get paginated posts with comments for accurate count
    const offset = (page - 1) * limit;
    const posts = await db.query.communityPosts.findMany({
      where: whereClause,
      with: {
        comments: {
          with: {
            author: {
              with: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: desc(communityPosts.createdAt),
      limit,
      offset,
    });

    // Format all posts
    const formattedPosts = await Promise.all(
      posts.map((post) => formatPost(post))
    );

    return {
      data: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(
      `Failed to get posts for user ${userId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "POST_FETCH_ERROR", "Failed to fetch your posts");
  }
}

/**
 * Format comment/reply for response with author info
 */
async function formatComment(comment: any) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, comment.authorId),
    with: { profile: true, role: true },
  });

  return {
    id: comment.id,
    author: {
      id: user?.id,
      name: user?.profile?.fullName || "Unknown",
      role: user?.role.name,
      avatar: user?.profile?.avatarMediaId,
    },
    content: comment.content,
    likeCount: comment.likeCount,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

/**
 * Add a reply to a post
 */
export async function addReply(postId: string, userId: string, content: string) {
  try {
    // Validate input
    if (!content || content.trim().length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Reply content cannot be empty");
    }

    if (content.length > CONTENT_LIMITS.REPLY_MAX_LENGTH) {
      throw new AppError(400, "VALIDATION_ERROR", ERROR_MESSAGES.REPLY_TOO_LONG);
    }

    // Check content for spam/profanity
    const contentCheck = filterContent(content, true); // strict mode for comments
    if (contentCheck.severity === 'violation') {
      throw new AppError(
        400,
        "CONTENT_VIOLATION",
        `Reply violates content policy: ${contentCheck.violations[0]}`
      );
    }

    // Check if post exists
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Check if user is banned
    const banned = await isUserBanned(userId);
    if (banned) {
      throw new ForbiddenError("You are banned from the community");
    }

    // Create reply
    const newReply = await db
      .insert(communityComments)
      .values({
        postId,
        authorId: userId,
        content: content.trim(),
        status: POST_STATUS.APPROVED,
        depth: 0,
        path: postId,
      })
      .returning();

    const reply = newReply[0];

    // Increment comment count on post
    await db
      .update(communityPosts)
      .set({
        commentCount: sql`${communityPosts.commentCount} + 1`,
      })
      .where(eq(communityPosts.id, postId));

    logger.info(
      `Reply added to post ${postId} by user ${userId}`,
      "COMMUNITY_POST_SERVICE",
      { replyId: reply.id }
    );

    return await formatComment(reply);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Failed to add reply to post ${postId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "REPLY_CREATE_ERROR", ERROR_MESSAGES.REPLY_CREATE_ERROR);
  }
}

/**
 * Delete a reply
 */
export async function deleteReply(postId: string, replyId: string, userId: string) {
  try {
    const reply = await db.query.communityComments.findFirst({
      where: eq(communityComments.id, replyId),
    });

    if (!reply) {
      throw new NotFoundError("Reply not found");
    }

    if (reply.postId !== postId) {
      throw new AppError(400, "VALIDATION_ERROR", "Reply does not belong to this post");
    }

    // User can delete their own replies
    if (reply.authorId !== userId) {
      throw new ForbiddenError("Cannot delete other user's reply");
    }

    // Soft delete by setting deletedAt
    await db
      .update(communityComments)
      .set({ deletedAt: new Date() })
      .where(eq(communityComments.id, replyId));

    // Decrement comment count on post
    await db
      .update(communityPosts)
      .set({
        commentCount: sql`${communityPosts.commentCount} - 1`,
      })
      .where(eq(communityPosts.id, postId));

    logger.info(
      `Reply ${replyId} deleted by user ${userId}`,
      "COMMUNITY_POST_SERVICE"
    );

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Failed to delete reply ${replyId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "REPLY_DELETE_ERROR", ERROR_MESSAGES.REPLY_DELETE_ERROR);
  }
}

/**
 * Like or unlike a reply
 */
export async function toggleReplyLike(postId: string, replyId: string, userId: string) {
  try {
    // Check if reply exists
    const reply = await db.query.communityComments.findFirst({
      where: eq(communityComments.id, replyId),
    });

    if (!reply) {
      throw new NotFoundError("Reply not found");
    }

    if (reply.postId !== postId) {
      throw new AppError(400, "VALIDATION_ERROR", "Reply does not belong to this post");
    }

    // Check if already liked
    const existingLike = await db.query.commentLikes.findFirst({
      where: and(
        eq(commentLikes.commentId, replyId),
        eq(commentLikes.userId, userId)
      ),
    });

    if (existingLike) {
      // Unlike
      await db
        .delete(commentLikes)
        .where(
          and(
            eq(commentLikes.commentId, replyId),
            eq(commentLikes.userId, userId)
          )
        );

      await db
        .update(communityComments)
        .set({
          likeCount: sql`${communityComments.likeCount} - 1`,
        })
        .where(eq(communityComments.id, replyId));

      logger.info(
        `User ${userId} unliked reply ${replyId}`,
        "COMMUNITY_POST_SERVICE"
      );
    } else {
      // Like
      await db.insert(commentLikes).values({
        commentId: replyId,
        userId,
      });

      await db
        .update(communityComments)
        .set({
          likeCount: sql`${communityComments.likeCount} + 1`,
        })
        .where(eq(communityComments.id, replyId));

      logger.info(
        `User ${userId} liked reply ${replyId}`,
        "COMMUNITY_POST_SERVICE"
      );
    }

    // Get updated reply
    const updated = await db.query.communityComments.findFirst({
      where: eq(communityComments.id, replyId),
    });

    return {
      likeCount: updated?.likeCount || 0,
      liked: !existingLike,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Failed to toggle like for reply ${replyId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "REPLY_LIKE_ERROR", ERROR_MESSAGES.REPLY_LIKE_ERROR);
  }
}

/**
 * Get posts for moderation (admin only)
 */
export async function getPostsForModeration(
  params: GetPostsParams & { status?: string },
  adminId?: string
) {
  try {
    const {
      page = DEFAULT_PAGINATION.POST_PAGE,
      limit = DEFAULT_PAGINATION.POST_LIMIT,
      category,
      search,
      status,
    } = params;

    // Build where conditions
    const whereConditions: any[] = [isNull(communityPosts.deletedAt)];

    // Filter by status if provided
    if (status && POST_STATUS_VALUES.includes(status as any)) {
      whereConditions.push(eq(communityPosts.status, status as any));
    }

    // Filter by category
    if (category && category !== "") {
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        whereConditions.push(eq(communityPosts.categoryId, categoryId));
      }
    }

    // Search in content
    if (search && search.trim() !== "") {
      whereConditions.push(ilike(communityPosts.content, `%${search.trim()}%`));
    }

    const whereClause = whereConditions.length > 0
      ? and(...whereConditions)
      : undefined;

    // Get total count
    let countQuery = db
      .select({ count: count(communityPosts.id) })
      .from(communityPosts);

    if (whereClause) {
      countQuery = countQuery.where(whereClause) as any;
    }

    const countResult = await countQuery;
    const total = countResult[0]?.count || 0;

    // Get paginated posts
    const offset = (page - 1) * limit;
    let postsQuery = db
      .select()
      .from(communityPosts);

    if (whereClause) {
      postsQuery = postsQuery.where(whereClause) as any;
    }

    const posts = await postsQuery
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset);

    // Format all posts (pass adminId so admins can see anonymous post authors)
    const formattedPosts = await Promise.all(
      posts.map((post) => formatPost(post, adminId))
    );

    return {
      data: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(
      "Failed to get posts for moderation",
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "POST_FETCH_ERROR", "Failed to fetch posts for moderation");
  }
}

/**
 * Approve a pending post (admin only)
 */
export async function approvePost(postId: string, adminId: string) {
  try {
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Update post status
    await db
      .update(communityPosts)
      .set({
        status: POST_STATUS.APPROVED,
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, postId));

    logger.info(
      `Post ${postId} approved by admin ${adminId}`,
      "COMMUNITY_POST_SERVICE"
    );

    // Log activity
    await logActivity("post_approved", adminId, "post", postId, {
      previousStatus: post.status,
    });

    const updated = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    return await formatPost(updated!, adminId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(
      `Failed to approve post ${postId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "POST_APPROVE_ERROR", ERROR_MESSAGES.POST_APPROVE_ERROR);
  }
}

/**
 * Decline a pending post (admin only)
 */
export async function declinePost(postId: string, adminId: string, reason: string) {
  try {
    if (!reason || reason.trim().length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Decline reason is required");
    }

    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Update post status
    await db
      .update(communityPosts)
      .set({
        status: POST_STATUS.REJECTED,
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, postId));

    logger.info(
      `Post ${postId} declined by admin ${adminId} - Reason: ${reason}`,
      "COMMUNITY_POST_SERVICE"
    );

    // Log activity
    await logActivity("post_declined", adminId, "post", postId, {
      previousStatus: post.status,
      declineReason: reason,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Failed to decline post ${postId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "POST_DECLINE_ERROR", ERROR_MESSAGES.POST_DECLINE_ERROR);
  }
}

/**
 * Delete a post (admin can delete any post)
 */
export async function deletePostAdmin(postId: string, adminId: string) {
  try {
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, postId),
    });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    // Soft delete by setting deletedAt
    await db
      .update(communityPosts)
      .set({ deletedAt: new Date() })
      .where(eq(communityPosts.id, postId));

    logger.info(
      `Post ${postId} deleted by admin ${adminId}`,
      "COMMUNITY_POST_SERVICE"
    );

    // Log activity
    await logActivity("post_deleted", adminId, "post", postId, {
      authorId: post.authorId,
      isAnonymous: post.isAnonymous,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error(
      `Failed to delete post ${postId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "POST_DELETE_ERROR", ERROR_MESSAGES.POST_DELETE_ERROR);
  }
}

/**
 * Delete a reply (admin can delete any reply)
 */
export async function deleteReplyAdmin(postId: string, replyId: string, adminId: string) {
  try {
    const reply = await db.query.communityComments.findFirst({
      where: eq(communityComments.id, replyId),
    });

    if (!reply) {
      throw new NotFoundError("Reply not found");
    }

    if (reply.postId !== postId) {
      throw new AppError(400, "VALIDATION_ERROR", "Reply does not belong to this post");
    }

    // Soft delete by setting deletedAt
    await db
      .update(communityComments)
      .set({ deletedAt: new Date() })
      .where(eq(communityComments.id, replyId));

    // Decrement comment count on post
    await db
      .update(communityPosts)
      .set({
        commentCount: sql`${communityPosts.commentCount} - 1`,
      })
      .where(eq(communityPosts.id, postId));

    logger.info(
      `Reply ${replyId} deleted by admin ${adminId}`,
      "COMMUNITY_POST_SERVICE"
    );

    // Log activity
    await logActivity("comment_deleted", adminId, "reply", replyId, {
      postId,
      authorId: reply.authorId,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Failed to delete reply ${replyId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "REPLY_DELETE_ERROR", ERROR_MESSAGES.REPLY_DELETE_ERROR);
  }
}

/**
 * Log moderation activity
 */
async function logActivity(
  action: string,
  actorId: string,
  targetType: string,
  targetId: string,
  details?: any
) {
  try {
    // Import auditLogs table for activity logging
    const { auditLogs } = await import("../../db/schema.js");

    await db
      .insert(auditLogs)
      .values({
        userId: actorId,
        entityType: `community_${targetType}`,
        entityId: targetId,
        action,
        newValues: details || {},
      });
  } catch (error) {
    logger.warn(
      `Failed to log activity: ${action}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    // Don't throw, just log warning - activity is secondary to the main action
  }
}

/**
 * Ban a user from the community
 */
export async function banUser(userId: string, adminId: string, reason: string) {
  try {
    if (!reason || reason.trim().length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Ban reason is required");
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if user is already banned
    const existing = await db.query.bannedUsers.findFirst({
      where: eq(bannedUsers.userId, userId),
    });

    if (existing && !existing.banUntil) {
      throw new AppError(400, "VALIDATION_ERROR", "User is already banned");
    }

    // Create ban record
    const banRecord = await db
      .insert(bannedUsers)
      .values({
        userId,
        bannedBy: adminId,
        reason: reason.trim(),
        isPermanent: true,
      })
      .returning();

    logger.info(
      `User ${userId} banned by admin ${adminId} - Reason: ${reason}`,
      "COMMUNITY_POST_SERVICE"
    );

    // Log activity
    await logActivity("user_banned", adminId, "user", userId, {
      reason: reason.trim(),
    });

    return {
      success: true,
      bannedAt: banRecord[0]?.createdAt,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Failed to ban user ${userId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "BAN_USER_ERROR", ERROR_MESSAGES.BAN_USER_ERROR);
  }
}

/**
 * Unban a user from the community
 */
export async function unbanUser(userId: string, adminId: string) {
  try {
    // Find active ban
    const ban = await db.query.bannedUsers.findFirst({
      where: and(
        eq(bannedUsers.userId, userId),
        isNull(bannedUsers.banUntil)
      ),
    });

    if (!ban) {
      throw new NotFoundError("User is not banned");
    }

    // Update ban record
    await db
      .update(bannedUsers)
      .set({ banUntil: new Date() })
      .where(eq(bannedUsers.userId, userId));

    logger.info(
      `User ${userId} unbanned by admin ${adminId}`,
      "COMMUNITY_POST_SERVICE"
    );

    // Log activity
    await logActivity("user_unbanned", adminId, "user", userId, {});

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Failed to unban user ${userId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "UNBAN_USER_ERROR", ERROR_MESSAGES.UNBAN_USER_ERROR);
  }
}

/**
 * Get all banned users
 */
export async function getBannedUsers(params: GetPostsParams) {
  try {
    const { page = 1, limit = 20 } = params;

    // Get total count of banned users
    const countResult = await db
      .select({ count: count(bannedUsers.id) })
      .from(bannedUsers)
      .where(isNull(bannedUsers.banUntil));

    const total = countResult[0]?.count || 0;

    // Get paginated banned users
    const offset = (page - 1) * limit;
    const bans = await db.query.bannedUsers.findMany({
      where: isNull(bannedUsers.banUntil),
      with: {
        user: { with: { profile: true } },
        bannedByUser: { with: { profile: true } },
      },
      limit,
      offset,
    });

    const formattedBans = bans.map((ban: any) => ({
      id: ban.id,
      userId: ban.userId,
      userName: ban.user?.profile?.fullName || "Unknown",
      userEmail: ban.user?.email || "Unknown",
      reason: ban.reason,
      bannedBy: ban.bannedByUser?.profile?.fullName || "Unknown",
      bannedAt: ban.createdAt,
      isPermanent: ban.isPermanent,
    }));

    return {
      data: formattedBans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(
      "Failed to get banned users",
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "BANNED_USERS_ERROR", ERROR_MESSAGES.BANNED_USERS_ERROR);
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  description?: string,
  color?: string
) {
  try {
    if (!name || name.trim().length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Category name is required");
    }

    if (name.length > 100) {
      throw new AppError(400, "VALIDATION_ERROR", "Category name is too long (max 100 chars)");
    }

    // Check if category already exists
    const existing = await db.query.communityCategories.findFirst({
      where: eq(communityCategories.name, name.trim()),
    });

    if (existing) {
      throw new AppError(400, "VALIDATION_ERROR", "Category already exists");
    }

    // Create category
    const category = await db
      .insert(communityCategories)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
      })
      .returning();

    logger.info(
      `Category created: ${name}`,
      "COMMUNITY_POST_SERVICE",
      { categoryId: category[0]?.id }
    );

    // Log activity
    await logActivity("category_created", "system", "category", category[0]!.id.toString(), {
      name: name.trim(),
    });

    return {
      id: category[0]?.id,
      name: category[0]?.name,
      description: category[0]?.description,
      slug: category[0]?.slug,
      createdAt: category[0]?.createdAt,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Failed to create category`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "CATEGORY_CREATE_ERROR", ERROR_MESSAGES.CATEGORY_CREATE_ERROR);
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: number) {
  try {
    const category = await db.query.communityCategories.findFirst({
      where: eq(communityCategories.id, categoryId),
    });

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Check if category has posts
    const postCount = await db
      .select({ count: count(communityPosts.id) })
      .from(communityPosts)
      .where(eq(communityPosts.categoryId, categoryId));

    if (postCount[0]?.count && postCount[0].count > 0) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Cannot delete category with existing posts"
      );
    }

    // Delete category
    await db
      .delete(communityCategories)
      .where(eq(communityCategories.id, categoryId));

    logger.info(
      `Category deleted: ${category.name}`,
      "COMMUNITY_POST_SERVICE"
    );

    // Log activity
    await logActivity("category_deleted", "system", "category", categoryId.toString(), {
      name: category.name,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) {
      throw error;
    }
    logger.error(
      `Failed to delete category ${categoryId}`,
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "CATEGORY_DELETE_ERROR", ERROR_MESSAGES.CATEGORY_DELETE_ERROR);
  }
}

/**
 * Get all categories
 */
export async function getAllCategories() {
  try {
    const categories = await db.query.communityCategories.findMany({
      where: eq(communityCategories.isActive, true),
      orderBy: desc(communityCategories.createdAt),
    });

    return {
      data: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        slug: cat.slug,
        isActive: cat.isActive,
        createdAt: cat.createdAt,
      })),
    };
  } catch (error) {
    logger.error(
      "Failed to get categories",
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "CATEGORIES_ERROR", ERROR_MESSAGES.CATEGORIES_ERROR);
  }
}

/**
 * Get activity log
 */
export async function getActivityLog(params: GetPostsParams) {
  try {
    const { page = DEFAULT_PAGINATION.ACTIVITY_LOG_PAGE, limit = DEFAULT_PAGINATION.ACTIVITY_LOG_LIMIT } = params;

    // Get total count
    const countResult = await db
      .select({ count: count(auditLogs.id) })
      .from(auditLogs)
      .where(ilike(auditLogs.entityType, ACTIVITY_LOG_ENTITY_TYPE_PATTERN));

    const total = countResult[0]?.count || 0;

    // Get paginated logs - using raw query without relations since no FK is defined
    const offset = (page - 1) * limit;
    const logs = await db
      .select()
      .from(auditLogs)
      .where(ilike(auditLogs.entityType, ACTIVITY_LOG_ENTITY_TYPE_PATTERN))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      actor: log.userId || "System",
      targetType: log.entityType.replace(/^community_/, ""),
      targetId: log.entityId,
      details: log.newValues,
      createdAt: log.createdAt,
    }));

    return {
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(
      "Failed to get activity log",
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "ACTIVITY_LOG_ERROR", ERROR_MESSAGES.ACTIVITY_LOG_ERROR);
  }
}

/**
 * Get all users who liked a post with pagination
 */
export async function getPostLikes(postId: string, params: GetPostsParams) {
  try {
    const { page = 1, limit = 20 } = params;

    // Verify post exists
    const post = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!post.length) {
      throw new NotFoundError("Post not found");
    }

    // Get total count of likes
    const countResult = await db
      .select({ count: count(postLikes.id) })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));

    const total = countResult[0]?.count || 0;

    // Get paginated likes with user details
    const offset = (page - 1) * limit;
    const likes = await db
      .select({
        id: postLikes.id,
        userId: postLikes.userId,
        createdAt: postLikes.createdAt,
        userEmail: users.email,
        userFullName: userProfiles.fullName,
      })
      .from(postLikes)
      .innerJoin(users, eq(postLikes.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(postLikes.postId, postId))
      .orderBy(desc(postLikes.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedLikes = likes.map((like: any) => ({
      id: like.id,
      userId: like.userId,
      userName: like.userFullName || like.userEmail.split("@")[0],
      avatar: null, // avatarMediaId would require separate media file lookup
      createdAt: like.createdAt,
    }));

    return {
      data: formattedLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(
      "Failed to get post likes",
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "INTERNAL_ERROR", "Failed to fetch post likes");
  }
}

/**
 * Get all comments on a post with pagination
 */
export async function getPostComments(postId: string, params: GetPostsParams) {
  try {
    const { page = 1, limit = 20 } = params;

    // Verify post exists
    const post = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!post.length) {
      throw new NotFoundError("Post not found");
    }

    // Get total count of comments
    const countResult = await db
      .select({ count: count(communityComments.id) })
      .from(communityComments)
      .where(
        and(
          eq(communityComments.postId, postId),
          isNull(communityComments.deletedAt)
        )
      );

    const total = countResult[0]?.count || 0;

    // Get paginated comments with user details
    const offset = (page - 1) * limit;
    const comments = await db
      .select({
        id: communityComments.id,
        postId: communityComments.postId,
        authorId: communityComments.authorId,
        content: communityComments.content,
        likeCount: communityComments.likeCount,
        createdAt: communityComments.createdAt,
        userEmail: users.email,
        userFullName: userProfiles.fullName,
      })
      .from(communityComments)
      .innerJoin(users, eq(communityComments.authorId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(
        and(
          eq(communityComments.postId, postId),
          isNull(communityComments.deletedAt)
        )
      )
      .orderBy(desc(communityComments.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedComments = comments.map((comment: any) => ({
      id: comment.id,
      authorId: comment.authorId,
      authorName: comment.userFullName || comment.userEmail.split("@")[0],
      avatar: null, // avatarMediaId would require separate media file lookup
      content: comment.content,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
    }));

    return {
      data: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(
      "Failed to get post comments",
      "COMMUNITY_POST_SERVICE",
      error as Error
    );
    throw new AppError(500, "INTERNAL_ERROR", "Failed to fetch post comments");
  }
}
