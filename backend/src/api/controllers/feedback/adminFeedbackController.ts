/**
 * Admin Feedback Controller
 */

import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";
import * as feedbackService from "../../services/feedback/feedbackService.js";
import * as analyticsService from "../../services/feedback/feedbackAnalyticsService.js";

/**
 * Get all feedback with filters, pagination and stats
 * GET /api/feedback/admin
 */
export async function getAllFeedback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit, search, status, category } = req.query as Record<string, string>;

    const result = await feedbackService.getAdminFeedback({
      page:     page     ? parseInt(page)     : 1,
      limit:    limit    ? parseInt(limit)    : 20,
      search:   search   || undefined,
      status:   status   || undefined,
      category: category || undefined,
    });

    logger.info("Admin feedback fetched via API", "FEEDBACK", {
      adminId: req.userId,
      total: result.stats.total,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get single feedback detail
 * GET /api/feedback/admin/:id
 */
export async function getFeedbackDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    const feedback = await feedbackService.getFeedbackById(id);
    sendSuccess(res, 200, { feedback });
  } catch (error) {
    next(error);
  }
}

/**
 * Respond to a feedback submission
 * PATCH /api/feedback/admin/:id/respond
 */
export async function respondToFeedback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id       = parseInt(String(req.params.id), 10);
    const adminId  = req.userId!;
    const { response } = req.body;

    const feedback = await feedbackService.respondToFeedback(id, adminId, response);

    logger.info("Feedback response sent via API", "FEEDBACK", { feedbackId: id, adminId });

    sendSuccess(res, 200, { feedback });
  } catch (error) {
    next(error);
  }
}

/**
 * Get analytics — per-category counts and avg ratings
 * GET /api/feedback/admin/analytics
 */
export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categoryStats = await analyticsService.getCategoryStats();
    sendSuccess(res, 200, { categoryStats });
  } catch (error) {
    next(error);
  }
}
