/**
 * FAQ Controller
 * Request handlers for all FAQ endpoints
 * Follows the 5-10 line try-catch wrapper pattern
 */

import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";
import * as faqService from "../../services/faq/faqService.js";

/**
 * Get all active FAQs — public, no auth required
 * GET /api/faqs
 */
export async function getPublicFAQs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const faqs = await faqService.getPublicFAQs();
    sendSuccess(res, 200, { faqs });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all FAQs with stats for admin panel
 * GET /api/faqs/admin
 */
export async function getAdminFAQs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await faqService.getAdminFAQs();

    logger.info("Admin FAQs fetched via API", "FAQ", {
      adminId: req.userId,
      total: result.stats.total,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new FAQ
 * POST /api/faqs/admin
 */
export async function createFAQ(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const { question, answer, category, isActive } = req.body;

    const faq = await faqService.createFAQ(userId, { question, answer, category, isActive });

    logger.info("FAQ created via API", "FAQ", { faqId: faq.id, userId });

    sendSuccess(res, 201, { faq });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a FAQ by ID
 * PUT /api/faqs/admin/:id
 */
export async function updateFAQ(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const faqId = parseInt(String(req.params.id), 10);
    const { question, answer, category, isActive } = req.body;

    const faq = await faqService.updateFAQ(faqId, { question, answer, category, isActive });

    logger.info("FAQ updated via API", "FAQ", { faqId, adminId: req.userId });

    sendSuccess(res, 200, { faq });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle FAQ active/inactive status
 * PATCH /api/faqs/admin/:id/toggle
 */
export async function toggleFAQ(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const faqId = parseInt(String(req.params.id), 10);
    const faq = await faqService.toggleFAQ(faqId);

    logger.info("FAQ toggled via API", "FAQ", { faqId, isActive: faq.isActive });

    sendSuccess(res, 200, { faq });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft delete a FAQ
 * DELETE /api/faqs/admin/:id
 */
export async function deleteFAQ(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const faqId = parseInt(String(req.params.id), 10);
    await faqService.deleteFAQ(faqId);

    logger.info("FAQ deleted via API", "FAQ", { faqId, adminId: req.userId });

    sendSuccess(res, 200, { message: "FAQ deleted successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk reorder FAQs
 * PATCH /api/faqs/admin/reorder
 */
export async function reorderFAQs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { items } = req.body;
    await faqService.reorderFAQs(items);

    logger.info("FAQs reordered via API", "FAQ", {
      adminId: req.userId,
      count: items.length,
    });

    sendSuccess(res, 200, { message: "FAQs reordered successfully" });
  } catch (error) {
    next(error);
  }
}
