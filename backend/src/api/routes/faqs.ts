/**
 * FAQ Routes
 * Public endpoint: GET /api/faqs (no auth)
 * Admin endpoints: all under /api/faqs/admin (require MANAGE_FAQS permission)
 *
 * NOTE: PATCH /admin/reorder is defined BEFORE PATCH /admin/:id/toggle
 * to prevent Express matching "reorder" as an :id param value.
 */

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { Permissions } from "../../lib/permissions.js";
import { faqSchemas } from "../../validation/faq.js";
import * as faqController from "../controllers/faq/faqController.js";

const router = Router();

// ============================================================================
// PUBLIC ROUTES (no auth)
// ============================================================================

/**
 * Get all active FAQs (public)
 * GET /api/faqs
 */
router.get("/", faqController.getPublicFAQs);

// ============================================================================
// ADMIN ROUTES (require MANAGE_FAQS permission)
// ============================================================================

/**
 * Get all FAQs with stats (admin view, includes inactive)
 * GET /api/faqs/admin
 */
router.get(
  "/admin",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FAQS),
  faqController.getAdminFAQs
);

/**
 * Create a new FAQ
 * POST /api/faqs/admin
 */
router.post(
  "/admin",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FAQS),
  validate(faqSchemas.createFAQ),
  faqController.createFAQ
);

/**
 * Bulk reorder FAQs — MUST be before /admin/:id routes
 * PATCH /api/faqs/admin/reorder
 */
router.patch(
  "/admin/reorder",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FAQS),
  validate(faqSchemas.reorderFAQs),
  faqController.reorderFAQs
);

/**
 * Toggle FAQ active/inactive
 * PATCH /api/faqs/admin/:id/toggle
 */
router.patch(
  "/admin/:id/toggle",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FAQS),
  faqController.toggleFAQ
);

/**
 * Update FAQ fields
 * PUT /api/faqs/admin/:id
 */
router.put(
  "/admin/:id",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FAQS),
  validate(faqSchemas.updateFAQ),
  faqController.updateFAQ
);

/**
 * Soft delete a FAQ
 * DELETE /api/faqs/admin/:id
 */
router.delete(
  "/admin/:id",
  authMiddleware,
  requirePermission(Permissions.MANAGE_FAQS),
  faqController.deleteFAQ
);

export default router;
