/**
 * Mentorship Routes
 *
 * Public (authenticated student):
 *   GET    /api/mentorship/slots                 — available slots for a date
 *   GET    /api/mentorship/settings              — session fee
 *   POST   /api/mentorship/payment/create-order  — create Razorpay order
 *   POST   /api/mentorship/payment/verify        — verify payment + create booking
 *   GET    /api/mentorship/my                    — own requests + stats
 *   GET    /api/mentorship/my/:id                — single own request
 *
 * Admin (MANAGE_MENTORSHIP):
 *   GET    /api/mentorship/admin                       — all requests
 *   GET    /api/mentorship/admin/:id                   — single request
 *   PATCH  /api/mentorship/admin/:id/approve           — approve
 *   PATCH  /api/mentorship/admin/:id/reject            — reject
 *   PATCH  /api/mentorship/admin/:id/reschedule        — reschedule
 *   DELETE /api/mentorship/admin/:id                   — delete
 *   POST   /api/mentorship/admin/:id/create-meeting    — retry Teams meeting
 *   GET    /api/mentorship/admin/slots                 — all slot templates
 *   POST   /api/mentorship/admin/slots                 — create slot template
 *   DELETE /api/mentorship/admin/slots/:id             — delete slot template
 *   PATCH  /api/mentorship/admin/slots/:id/toggle      — toggle active
 *   POST   /api/mentorship/admin/slots/copy            — copy slots to other days
 *   PATCH  /api/mentorship/admin/settings              — update session fee
 *
 * NOTE: Specifc /admin/* paths must be declared BEFORE /admin/:id to avoid
 * Express matching "slots" or "settings" as a dynamic :id parameter.
 */

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { Permissions } from "../../lib/permissions.js";
import { mentorshipSchemas } from "../../validation/mentorship.js";
import * as studentController from "../controllers/mentorship/studentMentorshipController.js";
import * as adminController   from "../controllers/mentorship/adminMentorshipController.js";
import * as slotController    from "../controllers/mentorship/slotController.js";
import * as paymentController from "../controllers/mentorship/paymentController.js";

const router = Router();

// ── Public / Student ──────────────────────────────────────────────────────────

router.get("/slots",    authMiddleware, slotController.getAvailableSlots);
router.get("/settings", authMiddleware, slotController.getSettings);

router.post(
  "/payment/create-order",
  authMiddleware,
  paymentController.createOrder
);

router.post(
  "/payment/verify",
  authMiddleware,
  paymentController.verifyAndBook
);

router.get("/my",     authMiddleware, studentController.getMyRequests);
router.get("/my/:id", authMiddleware, studentController.getRequestById);

// ── Admin — Slot Management (must be before /admin/:id) ───────────────────────

router.get(
  "/admin/slots",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  slotController.getAllSlots
);

router.post(
  "/admin/slots",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.createSlot),
  slotController.createSlot
);

router.post(
  "/admin/slots/copy",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.copySlots),
  slotController.copySlots
);

router.delete(
  "/admin/slots/:id",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  slotController.deleteSlot
);

router.patch(
  "/admin/slots/:id/toggle",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  slotController.toggleSlot
);

// ── Admin — Settings ──────────────────────────────────────────────────────────

router.patch(
  "/admin/settings",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.updateSettings),
  slotController.updateSettings
);

// ── Admin — Requests ──────────────────────────────────────────────────────────

router.get(
  "/admin",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.adminQuery, "query"),
  adminController.getAllRequests
);

router.get(
  "/admin/:id",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  adminController.getRequestById
);

router.patch(
  "/admin/:id/approve",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.approve),
  adminController.approveRequest
);

router.patch(
  "/admin/:id/reject",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.reject),
  adminController.rejectRequest
);

router.patch(
  "/admin/:id/reschedule",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  validate(mentorshipSchemas.reschedule),
  adminController.rescheduleRequest
);

router.delete(
  "/admin/:id",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  adminController.deleteRequest
);

router.post(
  "/admin/:id/create-meeting",
  authMiddleware,
  requirePermission(Permissions.MANAGE_MENTORSHIP),
  adminController.retryCreateMeeting
);

export default router;
