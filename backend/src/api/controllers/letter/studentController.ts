import { Request, Response, NextFunction } from "express";
import * as letterService from "../../services/letter/letterService.js";
import * as letterStatService from "../../services/letter/letterStatService.js";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";

/**
 * Submit a new letter
 * POST /letters/submit
 */
export async function submitLetter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const { subject, content, isAnonymous, coverMediaId } = req.body;

    const result = await letterService.createLetter(userId, {
      subject,
      content,
      isAnonymous,
      coverMediaId,
    });

    logger.info("Letter submitted via API", "APP", { letterId: result.id, userId });

    sendSuccess(res, 201, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Resubmit a letter
 * POST /letters/:id/resubmit
 */
export async function resubmitLetter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const { subject, content, coverMediaId } = req.body;

    const result = await letterService.resubmitLetter(id, userId, {
      subject,
      content,
      coverMediaId,
    });

    logger.info("Letter resubmitted via API", "APP", { letterId: id, userId });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get public feed (published letters)
 * GET /letters/feed
 */
export async function getPublicFeed(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const roleName = (req as any).roleName;
    const { page, limit, search, sortBy } = req.query;

    const result = await letterService.getPublicFeed(userId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      sortBy: (sortBy as "recent" | "popular" | "trending") || "recent",
    }, roleName);

    logger.info("Public feed retrieved", "APP", { total: result.pagination.total });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's letters
 * GET /letters/my-letters
 */
export async function getMyLetters(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const roleName = (req as any).roleName;
    const { page, limit, status, sortBy } = req.query;

    const result = await letterService.getMyLetters(userId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as "PENDING" | "APPROVED" | "REJECTED",
      sortBy: (sortBy as "recent" | "oldest") || "recent",
    }, roleName);

    logger.info("User letters retrieved", "APP", { userId, total: result.pagination.total });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Like a letter
 * POST /letters/:id/like
 */
export async function likeLetter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    await letterStatService.likeLetter(id, userId);
    const count = await letterStatService.getLikeCount(id);

    logger.info("Letter liked via API", "APP", { letterId: id, userId });

    sendSuccess(res, 200, { isLiked: true, acknowledgementCount: count });
  } catch (error) {
    next(error);
  }
}

/**
 * Unlike a letter
 * DELETE /letters/:id/like
 */
export async function unlikeLetter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    await letterStatService.unlikeLetter(id, userId);
    const count = await letterStatService.getLikeCount(id);

    logger.info("Letter unliked via API", "APP", { letterId: id, userId });

    sendSuccess(res, 200, { isLiked: false, acknowledgementCount: count });
  } catch (error) {
    next(error);
  }
}

/**
 * Get letter versions
 * GET /letters/:id/versions
 */
export async function getLetterVersions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    const result = await letterService.getLetterVersions(id, userId);

    logger.info("Letter versions retrieved", "APP", { letterId: id, userId });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get letter detail
 * GET /letters/:id
 */
export async function getLetterDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const roleName = (req as any).roleName;
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    const result = await letterService.getLetterById(id, userId, roleName);

    logger.info("Letter detail retrieved", "APP", { letterId: id, userId });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}
