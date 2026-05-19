import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { adminMiddleware } from "../../middleware/adminAuth.js";
import { communityRateLimit, rateLimitPresets } from "../../middleware/communityRateLimit.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { validate, createPostSchema, paginationSchema } from "../../utils/validation.js";
import { AppError } from "../../utils/errors.js";
import {
  createPost,
  getAllApprovedPosts,
  getPostById,
  deletePost,
  togglePostLike,
  getUserPosts,
  addReply,
  deleteReply,
  toggleReplyLike,
  getPostsForModeration,
  approvePost,
  declinePost,
  deletePostAdmin,
  deleteReplyAdmin,
  banUser,
  unbanUser,
  getBannedUsers,
  createCategory,
  deleteCategory,
  getAllCategories,
  getActivityLog,
  getPostLikes,
  getPostComments,
} from "../services/communityPostService.js";
import { CONTENT_LIMITS, HTTP_STATUS } from "../services/communityConstants.js";

const router = Router();

/**
 * @route POST /api/community/posts
 * @description Create a new community post (pending approval)
 * @access Protected (requires valid access token)
 * @body { content, categoryId, isAnonymous? }
 */
router.post("/posts", authMiddleware, communityRateLimit(rateLimitPresets.createPost), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const validatedData = validate(createPostSchema, req.body);

    const post = await createPost(userId, validatedData);
    sendSuccess(res, 201, { post });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Create post error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/community/posts
 * @description Get all approved community posts with pagination and filtering
 * @access Public (optional authentication)
 * @query { page?, limit?, category?, search? }
 */
router.get("/posts", async (req: Request, res: Response) => {
  try {
    const validatedParams = validate(paginationSchema, {
      page: req.query.page,
      limit: req.query.limit,
    });

    const posts = await getAllApprovedPosts({
      page: validatedParams.page,
      limit: validatedParams.limit,
      category: req.query.category as string,
      search: req.query.search as string,
    });

    sendSuccess(res, 200, posts);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get posts error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/community/posts/:id
 * @description Get a single post by ID with all details
 * @access Public (optional authentication)
 * @param id Post ID
 */
router.get("/posts/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post ID format");
      return;
    }

    const post = await getPostById(id);
    sendSuccess(res, 200, { post });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get post error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route DELETE /api/community/posts/:id
 * @description Delete own post (user can only delete pending posts)
 * @access Protected (requires valid access token)
 * @param id Post ID
 */
router.delete("/posts/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = req.params.id as string;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post ID format");
      return;
    }

    const result = await deletePost(id, userId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Delete post error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/community/posts/:id/like
 * @description Like or unlike a post
 * @access Protected (requires valid access token)
 * @param id Post ID
 */
router.put("/posts/:id/like", authMiddleware, communityRateLimit(rateLimitPresets.likeContent), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = req.params.id as string;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post ID format");
      return;
    }

    const result = await togglePostLike(id, userId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Toggle like error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/community/my-posts
 * @description Get current user's posts (all statuses)
 * @access Protected (requires valid access token)
 * @query { status?, page?, limit? }
 */
router.get("/my-posts", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const validatedParams = validate(paginationSchema, {
      page: req.query.page,
      limit: req.query.limit,
    });

    const posts = await getUserPosts(userId, {
      page: validatedParams.page,
      limit: validatedParams.limit,
      status: req.query.status as string,
    });

    sendSuccess(res, 200, posts);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get user posts error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/community/posts/:id/replies
 * @description Add a reply to a post
 * @access Protected (requires valid access token)
 * @param id Post ID
 * @body { content }
 */
router.post("/posts/:id/replies", authMiddleware, communityRateLimit(rateLimitPresets.createReply), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = req.params.id as string;
    const { content } = req.body;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post ID format");
      return;
    }

    if (!content || typeof content !== "string") {
      sendError(res, 400, "VALIDATION_ERROR", "Reply content is required");
      return;
    }

    const reply = await addReply(id, userId, content);
    sendSuccess(res, 201, { reply });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Add reply error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route DELETE /api/community/posts/:id/replies/:replyId
 * @description Delete own reply
 * @access Protected (requires valid access token)
 * @param id Post ID
 * @param replyId Reply ID
 */
router.delete("/posts/:id/replies/:replyId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = req.params.id as string;
    const replyId = req.params.replyId as string;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH || !replyId || replyId.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post or reply ID format");
      return;
    }

    const result = await deleteReply(id, replyId, userId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Delete reply error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/community/posts/:id/replies/:replyId/like
 * @description Like or unlike a reply
 * @access Protected (requires valid access token)
 * @param id Post ID
 * @param replyId Reply ID
 */
router.put("/posts/:id/replies/:replyId/like", authMiddleware, communityRateLimit(rateLimitPresets.likeContent), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = req.params.id as string;
    const replyId = req.params.replyId as string;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH || !replyId || replyId.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post or reply ID format");
      return;
    }

    const result = await toggleReplyLike(id, replyId, userId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Toggle reply like error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

// ============= ADMIN MODERATION ROUTES =============

/**
 * @route GET /api/community/admin/posts
 * @description Get posts for moderation (admin only)
 * @access Admin (requires ADMIN role)
 * @query { status?, category?, search?, page?, limit? }
 */
router.get("/admin/posts", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const validatedParams = validate(paginationSchema, {
      page: req.query.page,
      limit: req.query.limit,
    });

    const posts = await getPostsForModeration({
      page: validatedParams.page,
      limit: validatedParams.limit,
      category: req.query.category as string,
      search: req.query.search as string,
      status: req.query.status as string,
    }, adminId);

    sendSuccess(res, 200, posts);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get moderation posts error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/community/admin/posts/:id/approve
 * @description Approve a pending post (admin only)
 * @access Admin (requires ADMIN role)
 * @param id Post ID
 */
router.put("/admin/posts/:id/approve", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const id = req.params.id as string;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post ID format");
      return;
    }

    const post = await approvePost(id, adminId);
    sendSuccess(res, 200, { post });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Approve post error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/community/admin/posts/:id/decline
 * @description Decline a pending post (admin only)
 * @access Admin (requires ADMIN role)
 * @param id Post ID
 * @body { reason }
 */
router.put("/admin/posts/:id/decline", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const id = req.params.id as string;
    const { reason } = req.body;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post ID format");
      return;
    }

    if (!reason || typeof reason !== "string") {
      sendError(res, 400, "VALIDATION_ERROR", "Decline reason is required");
      return;
    }

    const result = await declinePost(id, adminId, reason);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Decline post error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route DELETE /api/community/admin/posts/:id
 * @description Delete a post (admin only)
 * @access Admin (requires ADMIN role)
 * @param id Post ID
 */
router.delete("/admin/posts/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const id = req.params.id as string;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post ID format");
      return;
    }

    const result = await deletePostAdmin(id, adminId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Delete post error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route DELETE /api/community/admin/posts/:id/replies/:replyId
 * @description Delete a reply (admin only)
 * @access Admin (requires ADMIN role)
 * @param id Post ID
 * @param replyId Reply ID
 */
router.delete("/admin/posts/:id/replies/:replyId", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const id = req.params.id as string;
    const replyId = req.params.replyId as string;

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH || !replyId || replyId.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post or reply ID format");
      return;
    }

    const result = await deleteReplyAdmin(id, replyId, adminId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Delete reply error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

// ============= ADMIN CONTROLS (PHASE 4) =============

/**
 * @route POST /api/community/admin/users/:userId/ban
 * @description Ban a user from the community (admin only)
 * @access Admin (requires ADMIN role)
 * @param userId User ID to ban
 * @body { reason }
 */
router.post("/admin/users/:userId/ban", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const userId = req.params.userId as string;
    const { reason } = req.body;

    if (!userId || userId.length !== 36) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid user ID format");
      return;
    }

    if (!reason || typeof reason !== "string") {
      sendError(res, 400, "VALIDATION_ERROR", "Ban reason is required");
      return;
    }

    const result = await banUser(userId, adminId, reason);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Ban user error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/community/admin/users/:userId/unban
 * @description Unban a user from the community (admin only)
 * @access Admin (requires ADMIN role)
 * @param userId User ID to unban
 */
router.put("/admin/users/:userId/unban", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const userId = req.params.userId as string;

    if (!userId || userId.length !== 36) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid user ID format");
      return;
    }

    const result = await unbanUser(userId, adminId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Unban user error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/community/admin/banned-users
 * @description Get list of banned users (admin only)
 * @access Admin (requires ADMIN role)
 * @query { page?, limit? }
 */
router.get("/admin/banned-users", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedParams = validate(paginationSchema, {
      page: req.query.page,
      limit: req.query.limit,
    });

    const bannedUsers = await getBannedUsers({
      page: validatedParams.page,
      limit: validatedParams.limit,
    });

    sendSuccess(res, 200, bannedUsers);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get banned users error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/community/admin/categories
 * @description Create a new category (admin only)
 * @access Admin (requires ADMIN role)
 * @body { name, description?, color? }
 */
router.post("/admin/categories", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, description, color } = req.body;

    if (!name || typeof name !== "string") {
      sendError(res, 400, "VALIDATION_ERROR", "Category name is required");
      return;
    }

    const category = await createCategory(name, description, color);
    sendSuccess(res, 201, { category });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Create category error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route DELETE /api/community/admin/categories/:id
 * @description Delete a category (admin only)
 * @access Admin (requires ADMIN role)
 * @param id Category ID
 */
router.delete("/admin/categories/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid category ID format");
      return;
    }

    const result = await deleteCategory(categoryId);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Delete category error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/community/categories
 * @description Get all categories (public)
 * @access Public (no authentication required)
 */
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    sendSuccess(res, 200, categories);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get categories error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/community/admin/activity
 * @description Get community activity log (admin only)
 * @access Admin (requires ADMIN role)
 * @query { page?, limit? }
 */
router.get("/admin/activity", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedParams = validate(paginationSchema, {
      page: req.query.page,
      limit: req.query.limit,
    });

    const activityLog = await getActivityLog({
      page: validatedParams.page,
      limit: validatedParams.limit,
    });

    sendSuccess(res, 200, activityLog);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get activity log error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/community/posts/:id/likes
 * @description Get all users who liked a post
 * @access Public (optional authentication)
 * @param id Post ID
 * @query { page?, limit? }
 */
router.get("/posts/:id/likes", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validatedParams = validate(paginationSchema, {
      page: req.query.page,
      limit: req.query.limit,
    });

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post ID format");
      return;
    }

    const likes = await getPostLikes(id, {
      page: validatedParams.page,
      limit: validatedParams.limit,
    });

    sendSuccess(res, 200, likes);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get post likes error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/community/posts/:id/comments
 * @description Get all comments on a post
 * @access Public (optional authentication)
 * @param id Post ID
 * @query { page?, limit? }
 */
router.get("/posts/:id/comments", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validatedParams = validate(paginationSchema, {
      page: req.query.page,
      limit: req.query.limit,
    });

    if (!id || id.length !== CONTENT_LIMITS.POST_ID_LENGTH) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid post ID format");
      return;
    }

    const comments = await getPostComments(id, {
      page: validatedParams.page,
      limit: validatedParams.limit,
    });

    sendSuccess(res, 200, comments);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get post comments error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

export default router;
