import { Router, Request, Response } from "express";
import { signup, signin, verifyEmail, refreshAccessToken, signout, resendOTP, initiatePasswordReset, resetPassword } from "../services/authService.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { validate, signupRequestSchema, signinRequestSchema, verifyEmailRequestSchema, refreshTokenSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema } from "../../utils/validation.js";
import { AppError } from "../../utils/errors.js";
import { authMiddleware } from "../../middleware/auth.js";
import { db } from "../../db/index.js";
import { users, userProfiles, roles } from "../../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * @route POST /api/auth/signup
 * @description Create new user account with email and password verification
 */
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const validatedData = validate(signupRequestSchema, req.body);
    const result = await signup(validatedData.email, validatedData.password, validatedData.full_name);
    sendSuccess(res, 201, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Signup error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/auth/signin
 * @description User login with email and password
 */
router.post("/signin", async (req: Request, res: Response) => {
  try {
    const validatedData = validate(signinRequestSchema, req.body);
    const result = await signin(validatedData.email, validatedData.password);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Signin error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/auth/verify-email
 * @description Verify user email with OTP
 */
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const validatedData = validate(verifyEmailRequestSchema, req.body);
    const result = await verifyEmail(validatedData.email, validatedData.otp);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Email verification error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/auth/refresh
 * @description Refresh access token using refresh token
 */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const validatedData = validate(refreshTokenSchema, req.body);
    const result = await refreshAccessToken(validatedData.refreshToken);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Token refresh error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/auth/signout
 * @description Sign out user and revoke refresh token
 * @requires Authorization header with access token
 */
router.post("/signout", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const validatedData = validate(refreshTokenSchema, req.body);
    const result = await signout(userId, validatedData.refreshToken);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Signout error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/auth/resend-otp
 * @description Resend verification code to user's email
 */
router.post("/resend-otp", async (req: Request, res: Response) => {
  try {
    const validatedData = validate(resendOtpSchema, req.body);
    const result = await resendOTP(validatedData.email);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Resend OTP error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @description Initiate password reset flow
 */
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const validatedData = validate(forgotPasswordSchema, req.body);
    const result = await initiatePasswordReset(validatedData.email);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Forgot password error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route POST /api/auth/reset-password
 * @description Complete password reset using token
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const validatedData = validate(resetPasswordSchema, req.body);
    const result = await resetPassword(validatedData.email, validatedData.token, validatedData.newPassword);
    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Reset password error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

/**
 * @route GET /api/auth/profile
 * @description Get current user's profile (protected route for testing token refresh)
 * @requires Authorization header with access token
 */
router.get("/profile", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Fetch user with role
    const userData = await db.query.users.findFirst({
      columns: { id: true, email: true, roleId: true },
      where: eq(users.id, userId),
      with: {
        role: { columns: { name: true } },
      },
    });

    if (!userData) {
      sendError(res, 404, "USER_NOT_FOUND", "User not found");
      return;
    }

    // Fetch user profile
    const profileData = await db.query.userProfiles.findFirst({
      columns: { fullName: true },
      where: eq(userProfiles.userId, userId),
    });

    sendSuccess(res, 200, {
      user: {
        id: userData.id,
        email: userData.email,
        fullName: profileData?.fullName || "Unknown",
        role: userData.role?.name || "STUDENT",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Profile fetch error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
    }
  }
});

export default router;
