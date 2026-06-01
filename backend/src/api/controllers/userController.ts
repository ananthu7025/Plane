import { AppError } from '../../utils/errors.js';
import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/response.js';
import { getUserProfile, updateUserProfile, getPublicProfile } from '../services/userService.js';

/**
 * Get current authenticated user's profile
 * GET /user/profile
 */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).userId;
    const profile = await getUserProfile(userId);
    sendSuccess(res, 200, profile);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Get profile error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

/**
 * Update current user's profile
 * PUT /user/profile
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).userId;
    const updatedProfile = await updateUserProfile(userId, req.body);
    sendSuccess(res, 200, updatedProfile);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Update profile error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

/**
 * Get public profile of any user
 * GET /user/:userId/public
 */
export async function getPublicUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    if (!userId || userId.length !== 36) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format');
      return;
    }

    const publicProfile = await getPublicProfile(userId);
    sendSuccess(res, 200, publicProfile);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Get public profile error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}
