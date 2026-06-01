import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/response.js';
import { AppError } from '../../utils/errors.js';
import {
  getAllUsers,
  getUserById,
  updateUserProfileAdmin,
  updateUserStatus,
  deleteUser,
} from '../services/userService.js';

/**
 * Get all users with pagination and filters
 * GET /admin/users
 */
export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getAllUsers(req.query as any);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Get users error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

/**
 * Get full profile of any user
 * GET /admin/users/:id
 */
export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format');
      return;
    }

    const user = await getUserById(id);
    sendSuccess(res, 200, user);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Get user error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

/**
 * Update any user's profile
 * PUT /admin/users/:id
 */
export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format');
      return;
    }

    const updatedProfile = await updateUserProfileAdmin(id, req.body);

    sendSuccess(res, 200, {
      message: 'User profile updated successfully',
      user: updatedProfile,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Update user error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

/**
 * Update user's status
 * PUT /admin/users/:id/status
 */
export async function updateUserStatusController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format');
      return;
    }

    const updatedUser = await updateUserStatus(id, req.body.status);

    sendSuccess(res, 200, {
      message: `User status updated to ${req.body.status}`,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Update user status error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}

/**
 * Delete a user
 * DELETE /admin/users/:id
 */
export async function deleteUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format');
      return;
    }

    const result = await deleteUser(id);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error('Delete user error:', error);
      sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
    }
  }
}
