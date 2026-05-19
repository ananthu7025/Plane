import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { adminMiddleware } from "../../middleware/adminAuth.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { validate, paginationSchema, updateProfileSchema, updateUserStatusSchema } from "../../utils/validation.js";
import { AppError } from "../../utils/errors.js";
import {
  getAllUsers,
  getUserById,
  updateUserProfileAdmin,
  updateUserStatus,
  deleteUser,
} from "../services/userService.js";

const router = Router();

/**
 * @route GET /api/admin/users
 * @description Get all users with pagination and filters
 * @access Protected (requires ADMIN role)
 * @query page=1&limit=20&search=&status=ACTIVE&role=STUDENT&sort=createdAt&order=desc
 */
router.get("/users", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedFilters = validate(paginationSchema, req.query);
    const result = await getAllUsers(validatedFilters);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get users error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/admin/users/:id
 * @description Get full profile of any user
 * @access Protected (requires ADMIN role)
 * @param id User ID
 */
router.get("/users/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid user ID format");
      return;
    }

    const user = await getUserById(id);
    sendSuccess(res, 200, user);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get user error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/admin/users/:id
 * @description Update any user's profile
 * @access Protected (requires ADMIN role)
 * @param id User ID
 * @body { fullName?, bio?, phone?, city?, country? }
 */
router.put("/users/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid user ID format");
      return;
    }

    const validatedData = validate(updateProfileSchema, req.body);
    const updatedProfile = await updateUserProfileAdmin(id, validatedData);

    sendSuccess(res, 200, {
      message: "User profile updated successfully",
      user: updatedProfile,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Update user error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/admin/users/:id/status
 * @description Update user's status (ACTIVE, INACTIVE, SUSPENDED)
 * @access Protected (requires ADMIN role)
 * @param id User ID
 * @body { status: "ACTIVE" | "INACTIVE" | "SUSPENDED" }
 */
router.put("/users/:id/status", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid user ID format");
      return;
    }

    const validatedData = validate(updateUserStatusSchema, req.body);
    const updatedUser = await updateUserStatus(id, validatedData.status);

    sendSuccess(res, 200, {
      message: `User status updated to ${validatedData.status}`,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Update user status error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route DELETE /api/admin/users/:id
 * @description Delete a user (hard delete of user and related data)
 * @access Protected (requires ADMIN role)
 * @param id User ID
 */
router.delete("/users/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || id.length !== 36) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid user ID format");
      return;
    }

    const result = await deleteUser(id);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Delete user error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

export default router;
