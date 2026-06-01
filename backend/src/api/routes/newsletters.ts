import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { validate } from "../../middleware/validation/validationMiddleware.js";
import { newsletterSchemas } from "../../validation/newsletter.js";
import { Permissions } from "../../lib/permissions.js";
import * as adminController from "../controllers/newsletter/adminController.js";
import * as studentController from "../controllers/newsletter/studentController.js";
import { deleteFromCloudinary } from "../services/cloudinaryService.js";
import * as newsletterStudentService from "../services/newsletter/newsletterStudentService.js";
import { logger } from "../../utils/logger.js";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept PDFs for main file, images for thumbnail
    if (file.fieldname === "file" && file.mimetype === "application/pdf") {
      cb(null, true);
    } else if (file.fieldname === "thumbnailFile" && ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type for field: " + file.fieldname));
    }
  },
});

// Admin Routes
router.post("/admin/create", authMiddleware, requirePermission(Permissions.MANAGE_NEWSLETTERS), upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnailFile", maxCount: 1 }]), validate(newsletterSchemas.createNewsletter), adminController.createNewsletter);
router.get("/admin/list", authMiddleware, requirePermission(Permissions.VIEW_NEWSLETTERS), validate(newsletterSchemas.getAdminList, "query"), adminController.getAdminNewsletters);
router.get("/admin/:id", authMiddleware, requirePermission(Permissions.VIEW_NEWSLETTERS), adminController.getNewsletterDetails);
router.put("/admin/:id", authMiddleware, requirePermission(Permissions.MANAGE_NEWSLETTERS), validate(newsletterSchemas.updateNewsletter), adminController.updateNewsletter);
router.put("/admin/:id/status", authMiddleware, requirePermission(Permissions.MANAGE_NEWSLETTERS), validate(newsletterSchemas.updateNewsletterStatus), adminController.updateNewsletterStatus);
router.delete("/admin/:id", authMiddleware, requirePermission(Permissions.MANAGE_NEWSLETTERS), async (req, res, next) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const newsletter = await newsletterStudentService.getNewsletterById(id);
    await adminController.deleteNewsletter(req, res, next);

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(newsletter.cloudinaryPublicId);
    } catch (cloudinaryError) {
      logger.warn("Failed to delete from Cloudinary", "CLOUDINARY");
    }
  } catch (error) {
    next(error);
  }
});

// Student Routes
router.get("/list", authMiddleware, validate(newsletterSchemas.getPublicList, "query"), studentController.getPublicNewsletters);
router.get("/:id/pdf", authMiddleware, studentController.getNewsletterPdf);
router.get("/:id/access", authMiddleware, studentController.checkNewsletterAccess);
router.get("/:id", authMiddleware, studentController.getNewsletterDetails);

export default router;
