/**
 * Blog Routes
 * REST endpoints for blog management and reading
 * Admin routes require ADMIN role, student routes are public or require student auth
 */

import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { Permissions } from "../../lib/permissions.js";
import { blogSchemas } from "../../validation/blog.js";
import * as adminController from "../controllers/blog/adminController.js";
import * as studentController from "../controllers/blog/studentController.js";

const router = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for cover images
  fileFilter: (_req, file, cb) => {
    if (["image/png", "image/jpeg", "image/webp", "image/jpg"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, and WebP images are allowed"));
    }
  },
});

// ============================================================================
// ADMIN ROUTES (require ADMIN role)
// ============================================================================

/**
 * Create a new blog post
 * POST /api/admin/blogs (multipart/form-data with optional coverImage)
 */
router.post(
  "/admin",
  authMiddleware,
  requirePermission(Permissions.MANAGE_BLOGS),
  upload.single("coverImage"),
  adminController.createBlog
);

/**
 * Get all blogs (admin view)
 * GET /api/admin/blogs?search=&category=&status=&page=1&limit=20
 */
router.get(
  "/admin",
  authMiddleware,
  requirePermission(Permissions.MANAGE_BLOGS),
  adminController.getAllBlogs
);

/**
 * Get single blog (admin view)
 * GET /api/admin/blogs/:blogId
 */
router.get(
  "/admin/:blogId",
  authMiddleware,
  requirePermission(Permissions.MANAGE_BLOGS),
  adminController.getBlog
);

/**
 * Update blog
 * PUT /api/admin/blogs/:blogId (multipart/form-data with optional coverImage)
 */
router.put(
  "/admin/:blogId",
  authMiddleware,
  requirePermission(Permissions.MANAGE_BLOGS),
  upload.single("coverImage"),
  adminController.updateBlog
);

/**
 * Delete blog (soft delete)
 * DELETE /api/admin/blogs/:blogId
 */
router.delete(
  "/admin/:blogId",
  authMiddleware,
  requirePermission(Permissions.MANAGE_BLOGS),
  adminController.deleteBlog
);

/**
 * Publish or unpublish blog
 * PATCH /api/admin/blogs/:blogId/publish
 */
router.patch(
  "/admin/:blogId/publish",
  authMiddleware,
  requirePermission(Permissions.MANAGE_BLOGS),
  validate(blogSchemas.publishBlog),
  adminController.publishBlog
);

// ============================================================================
// STUDENT/PUBLIC ROUTES (public or require student auth)
// ============================================================================

/**
 * Get blog categories (public)
 * GET /api/blogs/categories
 */
router.get("/categories", studentController.getCategories);

/**
 * Get all published blogs (public)
 * GET /api/blogs?search=&category=&page=1&limit=20
 */
router.get("/", studentController.getPublishedBlogs);

/**
 * Get single published blog (public)
 * GET /api/blogs/:blogId
 */
router.get("/:blogId", studentController.getBlog);

/**
 * Toggle blog acknowledgement (requires auth)
 * POST /api/blogs/:blogId/acknowledge
 */
router.post(
  "/:blogId/acknowledge",
  authMiddleware,
  studentController.toggleAcknowledge
);

/**
 * Record blog view (public, optional auth)
 * POST /api/blogs/:blogId/view
 */
router.post(
  "/:blogId/view",
  studentController.recordView
);

export default router;
