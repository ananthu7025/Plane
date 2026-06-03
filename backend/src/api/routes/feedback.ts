/**
 * Feedback Routes
 * Student routes: POST /api/feedback, GET /api/feedback/my
 * Admin routes:   /api/feedback/admin/* (require MANAGE_FEEDBACK)
 *
 * NOTE: /admin/analytics must be defined BEFORE /admin/:id to avoid
 * Express matching "analytics" as an :id param.
 */

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { Permissions } from "../../lib/permissions.js";
import { feedbackSchemas } from "../../validation/feedback.js";
import * as adminController   from "../controllers/feedback/adminFeedbackController.js";
import * as studentController from "../controllers/feedback/studentFeedbackController.js";

const router = Router();

// ── Student ──────────────────────────────────────────────────────────────────

/**
 * Submit new feedback
 * POST /api/feedback
 */
router.post(
  "/",
  authMiddleware,
  validate(feedbackSchemas.submit),
  studentController.submitFeedback
);

/**
 * Get current student's feedback history + stats
 * GET /api/feedback/my
 */
router.get(
  "/my",
  authMiddleware,
  studentController.getMyFeedback
);

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * Get analytics (must be before /admin/:id)
 * GET /api/feedback/admin/analytics
 */
router.get(
  "/admin/analytics",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FEEDBACK),
  adminController.getAnalytics
);

/**
 * Get all feedback with filters
 * GET /api/feedback/admin
 */
router.get(
  "/admin",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FEEDBACK),
  adminController.getAllFeedback
);

/**
 * Get single feedback detail
 * GET /api/feedback/admin/:id
 */
router.get(
  "/admin/:id",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FEEDBACK),
  adminController.getFeedbackDetail
);

/**
 * Respond to a feedback
 * PATCH /api/feedback/admin/:id/respond
 */
router.patch(
  "/admin/:id/respond",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FEEDBACK),
  validate(feedbackSchemas.respond),
  adminController.respondToFeedback
);

export default router;
