import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
import { getUserProfile, updateUserProfile, getPublicProfile } from '../services/userService.js';

/**
 * Get current authenticated user's profile
 * GET /user/profile
 */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const profile = await getUserProfile(userId);
    logger.info("User profile retrieved", "APP", { userId });
    sendSuccess(res, 200, profile);
  } catch (error) {
    next(error);
  }
}

/**
 * Update current user's profile
 * PUT /user/profile
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const updatedProfile = await updateUserProfile(userId, req.body);
    logger.info("User profile updated", "APP", { userId });
    sendSuccess(res, 200, updatedProfile);
  } catch (error) {
    next(error);
  }
}

/**
 * Get public profile of any user
 * GET /user/:userId/public
 */
export async function getPublicUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId[0];
    const publicProfile = await getPublicProfile(userId);
    logger.info("Public profile retrieved", "APP", { userId });
    sendSuccess(res, 200, publicProfile);
  } catch (error) {
    next(error);
  }
}
