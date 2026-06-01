import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { communitySchemas } from "../../validation/community.js";
import { Permissions } from "../../lib/permissions.js";
import * as postController from "../controllers/community/postController.js";
import * as commentController from "../controllers/community/commentController.js";
import * as likeController from "../controllers/community/likeController.js";
import * as moderationController from "../controllers/community/moderationController.js";
import * as userMgmtController from "../controllers/community/userManagementController.js";
import * as categoryController from "../controllers/community/categoryController.js";

const router = Router();

// Post Routes
router.post("/posts", authMiddleware, validate(communitySchemas.createPost), postController.createPost);
router.get("/posts", authMiddleware, validate(communitySchemas.getPostFeed, "query"), postController.getPostFeed);
router.get("/posts/:id", authMiddleware, postController.getPost);
router.put("/posts/:id", authMiddleware, validate(communitySchemas.updatePost), postController.updatePost);
router.delete("/posts/:id", authMiddleware, postController.deletePost);

// Comment Routes
router.post("/posts/:postId/comments", authMiddleware, validate(communitySchemas.createComment), commentController.createComment);
router.get("/posts/:postId/comments", authMiddleware, validate(communitySchemas.getComments, "query"), commentController.getComments);
router.delete("/comments/:id", authMiddleware, commentController.deleteComment);

// Like Routes
router.post("/posts/:id/like", authMiddleware, likeController.likePost);
router.delete("/posts/:id/like", authMiddleware, likeController.unlikePost);
router.put("/posts/:id/like", authMiddleware, likeController.togglePostLike);

// Moderation Routes (Admin Only)
router.post("/posts/:id/approve", authMiddleware, requirePermission(Permissions.MODERATE_POSTS), validate(communitySchemas.moderationAction), moderationController.approvePost);
router.post("/posts/:id/reject", authMiddleware, requirePermission(Permissions.MODERATE_POSTS), validate(communitySchemas.moderationAction), moderationController.rejectPost);
router.post("/comments/:id/approve", authMiddleware, requirePermission(Permissions.MODERATE_COMMENTS), validate(communitySchemas.moderationAction), moderationController.approveComment);

// User Management Routes (Admin Only)
router.post("/users/ban", authMiddleware, requirePermission(Permissions.MANAGE_USERS), validate(communitySchemas.banUser), userMgmtController.banUser);
router.post("/users/unban", authMiddleware, requirePermission(Permissions.MANAGE_USERS), validate(communitySchemas.unbanUser), userMgmtController.unbanUser);

// Category Routes
router.get("/categories", authMiddleware, categoryController.getCategories);
router.post("/admin/categories", authMiddleware, requirePermission(Permissions.MANAGE_COMMUNITY), validate(communitySchemas.createCategory), categoryController.createCategory);
router.delete("/admin/categories/:id", authMiddleware, requirePermission(Permissions.MANAGE_COMMUNITY), categoryController.deleteCategory);

// My Posts Route
router.get("/my-posts", authMiddleware, validate(communitySchemas.getMyPosts, "query"), postController.getMyPosts);

// Replies Routes (map to comment controllers)
router.post("/posts/:postId/replies", authMiddleware, validate(communitySchemas.createComment), commentController.createReply);
router.delete("/posts/:postId/replies/:replyId", authMiddleware, commentController.deleteReply);
router.post("/posts/:postId/replies/:replyId/like", authMiddleware, likeController.likeComment);
router.delete("/posts/:postId/replies/:replyId/like", authMiddleware, likeController.unlikeComment);
router.put("/posts/:postId/replies/:replyId/like", authMiddleware, likeController.toggleCommentLike);

// Post Likes Route
router.get("/posts/:id/likes", authMiddleware, validate(communitySchemas.pagination, "query"), likeController.getPostLikes);

// Admin - Moderation Queue & Actions
router.get("/admin/posts", authMiddleware, requirePermission(Permissions.MODERATE_POSTS), validate(communitySchemas.getAdminPosts, "query"), postController.getModerationPosts);
router.put("/admin/posts/:id/approve", authMiddleware, requirePermission(Permissions.MODERATE_POSTS), moderationController.adminApprovePost);
router.put("/admin/posts/:id/decline", authMiddleware, requirePermission(Permissions.MODERATE_POSTS), validate(communitySchemas.moderationAction), moderationController.adminDeclinePost);
router.delete("/admin/posts/:id", authMiddleware, requirePermission(Permissions.MODERATE_POSTS), postController.adminDeletePost);
router.delete("/admin/posts/:postId/replies/:replyId", authMiddleware, requirePermission(Permissions.MODERATE_COMMENTS), moderationController.adminDeleteReply);

// Banned Users Route
router.get("/banned-users", authMiddleware, requirePermission(Permissions.MANAGE_USERS), validate(communitySchemas.pagination, "query"), userMgmtController.getBannedUsers);

export default router;
