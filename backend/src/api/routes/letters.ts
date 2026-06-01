import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { letterSchemas } from "../../validation/letter.js";
import { Permissions } from "../../lib/permissions.js";
import * as studentController from "../controllers/letter/studentController.js";
import * as moderationController from "../controllers/letter/moderationController.js";

const router = Router();

// Student Routes
router.post("/submit", authMiddleware, requirePermission(Permissions.CREATE_LETTER), validate(letterSchemas.submit), studentController.submitLetter);
router.post("/:id/resubmit", authMiddleware, requirePermission(Permissions.CREATE_LETTER), validate(letterSchemas.resubmit), studentController.resubmitLetter);
router.get("/feed", authMiddleware, validate(letterSchemas.getFeed, "query"), studentController.getPublicFeed);
router.get("/my-letters", authMiddleware, validate(letterSchemas.getMyLetters, "query"), studentController.getMyLetters);
router.post("/:id/like", authMiddleware, studentController.likeLetter);
router.delete("/:id/like", authMiddleware, studentController.unlikeLetter);

// Admin Stats Route
router.get("/admin/stats", authMiddleware, requirePermission(Permissions.MODERATE_LETTERS), moderationController.getStats);

// Moderation Routes (Admin Only)
router.get("/moderation/pending", authMiddleware, requirePermission(Permissions.MODERATE_LETTERS), validate(letterSchemas.getFeed, "query"), moderationController.getPendingLetters);
router.put("/:id/approve", authMiddleware, requirePermission(Permissions.MODERATE_LETTERS), moderationController.approveLetter);
router.put("/:id/reject", authMiddleware, requirePermission(Permissions.MODERATE_LETTERS), validate(letterSchemas.rejectLetter), moderationController.rejectLetter);
router.delete("/:id", authMiddleware, requirePermission(Permissions.DELETE_LETTER), moderationController.deleteLetter);

// Letter Versions Route
router.get("/:id/versions", authMiddleware, studentController.getLetterVersions);

// Detail Route (must be last to avoid conflicts with other /:id routes)
router.get("/:id", authMiddleware, studentController.getLetterDetail);

export default router;
