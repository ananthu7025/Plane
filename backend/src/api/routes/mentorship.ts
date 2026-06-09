/**
 * Mentorship Routes
 * Student: POST /api/mentorship
 *          GET  /api/mentorship/my
 *          GET  /api/mentorship/my/:id
 * Admin:   GET  /api/mentorship/admin         (MANAGE_MENTORSHIP)
 *          GET  /api/mentorship/admin/:id      (MANAGE_MENTORSHIP)
 *          PATCH /api/mentorship/admin/:id/approve
 *          PATCH /api/mentorship/admin/:id/reject
 *          PATCH /api/mentorship/admin/:id/reschedule
 *
 * NOTE: /admin routes must be declared BEFORE /my/:id to avoid Express
 * matching "admin" as a dynamic :id parameter.
 */

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { Permissions } from "../../lib/permissions.js";
import { mentorshipSchemas } from "../../validation/mentorship.js";
import * as studentController from "../controllers/mentorship/studentMentorshipController.js";
import * as adminController   from "../controllers/mentorship/adminMentorshipController.js";
const router = Router();

// ── Student ───────────────────────────────────────────────────────────────────

/**
 * Submit a new mentorship request
 * POST /api/mentorship
 */
router.post(
  "/",
  authMiddleware,
  validate(mentorshipSchemas.submit),
  studentController.submitRequest
);

/**
 * Get own requests and stats
 * GET /api/mentorship/my
 */
router.get(
  "/my",
  authMiddleware,
  studentController.getMyRequests
);

/**
 * Get a single own request
 * GET /api/mentorship/my/:id
 */
router.get(
  "/my/:id",
  authMiddleware,
  studentController.getRequestById
);

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * List all requests with filters (must be before /admin/:id)
 * GET /api/mentorship/admin
 */
router.get(
  "/admin",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.adminQuery, "query"),
  adminController.getAllRequests
);

/**
 * Get single request detail
 * GET /api/mentorship/admin/:id
 */
router.get(
  "/admin/:id",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  adminController.getRequestById
);

/**
 * Approve request and create Teams meeting
 * PATCH /api/mentorship/admin/:id/approve
 */
router.patch(
  "/admin/:id/approve",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.approve),
  adminController.approveRequest
);

/**
 * Reject request with reason
 * PATCH /api/mentorship/admin/:id/reject
 */
router.patch(
  "/admin/:id/reject",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.reject),
  adminController.rejectRequest
);

/**
 * Delete a mentorship request
 * DELETE /api/mentorship/admin/:id
 */
router.delete(
  "/admin/:id",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  adminController.deleteRequest
);

/**
 * Retry Teams meeting creation for an approved request with no meeting link
 * POST /api/mentorship/admin/:id/create-meeting
 */
router.post(
  "/admin/:id/create-meeting",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  adminController.retryCreateMeeting
);

/**
 * Reschedule request to a new datetime
 * PATCH /api/mentorship/admin/:id/reschedule
 */
router.patch(
  "/admin/:id/reschedule",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.reschedule),
  adminController.rescheduleRequest
);

export default router;
