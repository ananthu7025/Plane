import { Request, Response, NextFunction } from "express";
import * as letterModerationService from "../../services/letter/letterModerationService.js";
import * as letterStatService from "../../services/letter/letterStatService.js";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";

/**
 * Get pending letters for moderation (admin only)
 * GET /letters/moderation/pending
 */
export async function getPendingLetters(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit, status } = req.query;

    const result = await letterModerationService.getPendingLetters(
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20,
      status as "PENDING" | "APPROVED" | "REJECTED" | undefined
    );

    logger.info("Letters retrieved for moderation", "APP", { status, total: result.pagination.total });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Approve a letter (admin only)
 * POST /letters/:id/approve
 */
export async function approveLetter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const adminId = req.userId!;

    const result = await letterModerationService.approveLetter(id);

    logger.info("Letter approved via API", "APP", { letterId: id, adminId });

    sendSuccess(res, 200, { message: "Letter approved successfully", data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject a letter (admin only)
 * POST /letters/:id/reject
 */
export async function rejectLetter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const { reason } = req.body;
    const adminId = req.userId!;

    const result = await letterModerationService.rejectLetter(id, reason);

    logger.info("Letter rejected via API", "APP", { letterId: id, adminId, reason });

    sendSuccess(res, 200, { message: "Letter rejected successfully", data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a letter (admin only)
 * DELETE /letters/:id
 */
export async function deleteLetter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const adminId = req.userId!;

    const result = await letterModerationService.deleteLetter(id);

    logger.info("Letter deleted via API", "APP", { letterId: id, adminId });

    sendSuccess(res, 200, { message: "Letter deleted successfully", data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Get letter statistics (admin only)
 * GET /letters/admin/stats
 */
export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await letterStatService.getStats();

    logger.info("Letter statistics retrieved", "APP", { stats });

    sendSuccess(res, 200, stats);
  } catch (error) {
    next(error);
  }
}
