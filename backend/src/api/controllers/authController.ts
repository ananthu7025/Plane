import { logger } from "../../utils/logger.js";
import { sendSuccess } from "../../utils/response.js";
import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService.js";

/**
 * User signup
 * POST /auth/signup
 */
export async function signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, fullName } = req.body;

    const result = await authService.signup(email, password, fullName);

    logger.info("User signup successful", "AUTH", { email, userId: result.userId });

    sendSuccess(res, 201, result);
  } catch (error) {
    next(error);
  }
}

/**
 * User signin
 * POST /auth/signin
 */
export async function signin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await authService.signin(email, password);

    logger.info("User signin successful", "AUTH", { email, userId: result.user.id });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Verify email with OTP
 * POST /auth/verify-email
 */
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp } = req.body;

    const result = await authService.verifyEmail(email, otp);

    logger.info("Email verification successful", "APP", { email });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
export async function refreshAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    logger.info("Access token refreshed", "APP", { userId: result.user.id });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Resend OTP for email verification
 * POST /auth/resend-otp
 */
export async function resendOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    const result = await authService.resendOTP(email);

    logger.info("OTP resent", "APP", { email });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 * GET /auth/profile
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User data is already available from auth middleware
    const user = {
      id: req.userId!,
      roleId: req.roleId,
      roleName: req.roleName,
      email: req.email,
      permissions: req.userPermissions,
    };

    logger.info("Profile retrieved", "APP", { userId: req.userId! });

    sendSuccess(res, 200, user);
  } catch (error) {
    next(error);
  }
}

/**
 * Sign out user
 * POST /auth/signout
 */
export async function signout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const userId = req.userId!;

    const result = await authService.signout(userId, refreshToken);

    logger.info("User signout successful", "APP", { userId });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Initiate password reset
 * POST /auth/forgot-password
 */
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    const result = await authService.initiatePasswordReset(email);

    logger.info("Password reset initiated", "APP", { email });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password with token
 * POST /auth/reset-password
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, token, newPassword } = req.body;

    const result = await authService.resetPassword(email, token, newPassword);

    logger.info("Password reset successful", "APP", { email });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}
