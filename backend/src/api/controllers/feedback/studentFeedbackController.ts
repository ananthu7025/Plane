/**
 * Student Feedback Controller
 */

import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";
import * as feedbackService from "../../services/feedback/feedbackService.js";

/**
 * Submit new feedback
 * POST /api/feedback
 */
export async function submitFeedback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.userId!;
    const { category, subject, rating, feedback } = req.body;

    const result = await feedbackService.submitFeedback(studentId, {
      category,
      subject,
      rating,
      feedback,
    });

    logger.info("Feedback submitted via API", "FEEDBACK", {
      feedbackId: result.id,
      studentId,
    });

    sendSuccess(res, 201, { feedback: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current student's feedback history + stats
 * GET /api/feedback/my
 */
export async function getMyFeedback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.userId!;
    const result = await feedbackService.getMyFeedback(studentId);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}
