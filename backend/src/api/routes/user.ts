import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { validate, updateProfileSchema } from "../../utils/validation.js";
import { AppError } from "../../utils/errors.js";
import { getUserProfile, updateUserProfile, getPublicProfile } from "../services/userService.js";

const router = Router();

/**
 * @route GET /api/user/profile
 * @description Get current authenticated user's profile
 * @access Protected (requires valid access token)
 */
router.get("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const profile = await getUserProfile(userId);
    sendSuccess(res, 200, profile);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get profile error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route PUT /api/user/profile
 * @description Update current user's profile information
 * @access Protected (requires valid access token)
 * @body { fullName?, bio?, phone?, city?, country? }
 */
router.put("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const validatedData = validate(updateProfileSchema, req.body);

    const updatedProfile = await updateUserProfile(userId, validatedData);
    sendSuccess(res, 200, updatedProfile);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Update profile error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/user/:userId/public
 * @description Get public profile of any user
 * @access Public (no authentication required)
 * @param userId User ID to fetch profile for
 */
router.get("/:userId/public", async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    // Validate userId is UUID format
    if (!userId || userId.length !== 36) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid user ID format");
      return;
    }

    const publicProfile = await getPublicProfile(userId);
    sendSuccess(res, 200, publicProfile);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get public profile error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

export default router;
