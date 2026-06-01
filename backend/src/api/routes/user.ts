import { Router } from "express";
import { userSchemas } from "../../validation/user.js";
import { authMiddleware } from "../../middleware/auth.js";
import * as userController from "../controllers/userController.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";

const router = Router();

router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, validate(userSchemas.updateProfile), userController.updateProfile);
router.get("/:userId/public", userController.getPublicUserProfile);

export default router;
