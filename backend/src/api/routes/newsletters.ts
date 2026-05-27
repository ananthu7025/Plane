import { Router, Request, Response } from "express";
import multer from "multer";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { AppError } from "../../utils/errors.js";
import {
  createNewsletter,
  getAdminNewsletters,
  getPublicNewsletters,
  getNewsletterById,
  updateNewsletter,
  toggleNewsletterStatus,
  deleteNewsletter,
  getNewsletterPageWeb,
} from "../services/newsletterService.js";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * @route POST /api/newsletters
 * @description Upload new newsletter via Cloudinary
 * @access Private (admin only)
 */
router.post(
  "/newsletters",
  authMiddleware,
  requirePermission("MANAGE_NEWSLETTERS"),
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        throw new AppError(400, "FILE_REQUIRED", "PDF file is required");
      }

      const userId = (req as any).userId;
      const { title, description, category, isPaid } = req.body;

      // Validation
      if (!title || !category) {
        throw new AppError(400, "VALIDATION_ERROR", "Title and category are required");
      }

      const result = await createNewsletter(userId, {
        title,
        description,
        category,
        isPaid: isPaid === "true" || isPaid === true,
        file: req.file,
      });

      sendSuccess(res, 201, result);
    } catch (error) {
      if (error instanceof AppError) {
        sendError(res, error.statusCode, error.code, error.message, error.details);
      } else {
        console.error("Create newsletter error:", error);
        sendError(res, 500, "INTERNAL_ERROR", "Failed to create newsletter");
      }
    }
  }
);

/**
 * @route GET /api/newsletters
 * @description List all newsletters (admin view)
 * @access Private (admin only)
 */
router.get("/newsletters", authMiddleware, requirePermission("VIEW_NEWSLETTERS"), async (req: Request, res: Response) => {
  try {
    const { page, limit, search, category, isPaid, status, sort } = req.query;

    const result = await getAdminNewsletters({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string,
      category: category as string,
      isPaid: isPaid ? isPaid === "true" : undefined,
      status: status as string,
      sort: (sort as any) || "recent",
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get newsletters error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch newsletters");
    }
  }
});

// ============================================================================
// WEB STUDENT ENDPOINTS (defined before :id routes to prevent conflicts)
// ============================================================================

/**
 * @route GET /api/newsletters/web
 * @description List published newsletters (web platform)
 * @access Private (authenticated users)
 */
router.get("/newsletters/web", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page, limit, search, category } = req.query;

    const result = await getPublicNewsletters({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string,
      category: category as string,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get newsletters error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch newsletters");
    }
  }
});

/**
 * @route GET /api/newsletters/:id/pages/:pageNumber/web
 * @description Get page 1 only (web platform - pages 2+ blocked)
 * @access Private (authenticated users)
 * @note Must be defined BEFORE /:id/web to prevent route conflicts
 */
router.get("/newsletters/:id/pages/:pageNumber/web", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const pageNumber = typeof req.params.pageNumber === "string" ? req.params.pageNumber : req.params.pageNumber[0];
    const pageNum = parseInt(pageNumber);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new AppError(400, "INVALID_PAGE_NUMBER", "Invalid page number");
    }

    const result = await getNewsletterPageWeb(id, pageNum);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get page error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch page");
    }
  }
});

/**
 * @route GET /api/newsletters/:id/web
 * @description Get single newsletter details (web platform)
 * @access Private (authenticated users)
 */
router.get("/newsletters/:id/web", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const result = await getNewsletterById(id);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get newsletter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch newsletter");
    }
  }
});

// ============================================================================
// PUBLIC ENDPOINTS (NO AUTH REQUIRED)
// ============================================================================

/**
 * @route GET /api/newsletters/public
 * @description List published newsletters (public, no auth)
 * @access Public
 */
router.get("/newsletters/public", async (req: Request, res: Response) => {
  try {
    const { page, limit, search, category } = req.query;

    const result = await getPublicNewsletters({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string,
      category: category as string,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get newsletters error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch newsletters");
    }
  }
});

/**
 * @route GET /api/newsletters/:id/public
 * @description Get public newsletter details (no auth)
 * @access Public
 */
router.get("/newsletters/:id/public", async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const result = await getNewsletterById(id);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get newsletter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch newsletter");
    }
  }
});

// ============================================================================
// ADMIN :ID/:STATUS ROUTE (defined before generic :id route)
// ============================================================================

/**
 * @route PUT /api/newsletters/:id/status
 * @description Toggle archive status
 * @access Private (admin only)
 */
router.put(
  "/newsletters/:id/status",
  authMiddleware,
  requirePermission("MANAGE_NEWSLETTERS"),
  async (req: Request, res: Response) => {
    try {
      const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
      const { status } = req.body;

      if (!["published", "archived", "draft"].includes(status)) {
        throw new AppError(400, "INVALID_STATUS", "Invalid status value");
      }

      const result = await toggleNewsletterStatus(id, status);

      sendSuccess(res, 200, result);
    } catch (error) {
      if (error instanceof AppError) {
        sendError(res, error.statusCode, error.code, error.message, error.details);
      } else {
        console.error("Update status error:", error);
        sendError(res, 500, "INTERNAL_ERROR", "Failed to update status");
      }
    }
  }
);

// ============================================================================
// ADMIN :ID ROUTES (defined after specific sub-routes)
// ============================================================================

/**
 * @route GET /api/newsletters/:id
 * @description Get single newsletter details (admin view)
 * @access Private (admin only)
 */
router.get("/newsletters/:id", authMiddleware, requirePermission("VIEW_NEWSLETTERS"), async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const result = await getNewsletterById(id);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get newsletter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch newsletter");
    }
  }
});

/**
 * @route PUT /api/newsletters/:id
 * @description Edit newsletter metadata
 * @access Private (admin only)
 */
router.put("/newsletters/:id", authMiddleware, requirePermission("MANAGE_NEWSLETTERS"), async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const { title, description, category, isPaid } = req.body;

    const result = await updateNewsletter(id, {
      title,
      description,
      category,
      isPaid,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Update newsletter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to update newsletter");
    }
  }
});

/**
 * @route DELETE /api/newsletters/:id
 * @description Delete newsletter (soft delete)
 * @access Private (admin only)
 */
router.delete("/newsletters/:id", authMiddleware, requirePermission("MANAGE_NEWSLETTERS"), async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const result = await deleteNewsletter(id);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Delete newsletter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to delete newsletter");
    }
  }
});

export default router;
