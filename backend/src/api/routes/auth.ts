import { Router } from "express";
import { authSchemas } from "../../validation/auth.js";
import { authMiddleware } from "../../middleware/auth.js";
import * as authController from "../controllers/authController.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";

const router = Router();

// Public routes
router.post("/signup", validate(authSchemas.signup), authController.signup);
router.post("/signin", validate(authSchemas.signin), authController.signin);
router.post("/verify-email", validate(authSchemas.verifyEmail), authController.verifyEmail);
router.post("/refresh", validate(authSchemas.refreshToken), authController.refreshAccessToken);
router.post("/resend-otp", validate(authSchemas.resendOTP), authController.resendOTP);
router.post("/forgot-password", validate(authSchemas.forgotPassword), authController.forgotPassword);
router.post("/reset-password", validate(authSchemas.resetPassword), authController.resetPassword);

// Authenticated routes
router.get("/profile", authMiddleware, authController.getProfile);
router.post("/signout", authMiddleware, validate(authSchemas.refreshToken), authController.signout);

export default router;
