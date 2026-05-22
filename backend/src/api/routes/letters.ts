import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { AppError } from "../../utils/errors.js";
import {
  createLetter,
  resubmitLetter,
  getPublicLetters,
  getLetterDetail,
  toggleLetteLike,
  getMyLetters,
  getLetterVersions,
  getModerationQueue,
  approveLetter,
  rejectLetter,
  deleteLetter,
  getLetterStats,
} from "../services/letterService.js";

const router = Router();

// ============================================================================
// STUDENT ENDPOINTS
// ============================================================================

/**
 * @route POST /api/letters
 * @description Create a new letter
 * @access Private (authenticated users)
 */
router.post("/", authMiddleware, requirePermission("CREATE_LETTER"), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { subject, content, isAnonymous, coverMediaId } = req.body;

    const result = await createLetter(userId, {
      subject,
      content,
      isAnonymous,
      coverMediaId,
    });

    sendSuccess(res, 201, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Create letter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to create letter");
    }
  }
});

/**
 * @route POST /api/letters/:id/resubmit
 * @description Resubmit a rejected letter with new content
 * @access Private (authenticated users)
 */
router.post("/:id/resubmit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const { subject, content, coverMediaId } = req.body;

    const result = await resubmitLetter(id, userId, {
      subject,
      content,
      coverMediaId,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Resubmit letter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to resubmit letter");
    }
  }
});

/**
 * @route GET /api/letters
 * @description Get public letters (feed) with infinite scroll
 * @access Public
 * @query page, limit, search, sortBy (recent|popular|trending)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // Optional - from authMiddleware if present
    const { page, limit, search, sortBy } = req.query;

    const result = await getPublicLetters(userId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      sortBy: (sortBy as any) || "recent",
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get public letters error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch letters");
    }
  }
});

/**
 * @route GET /api/letters/:id
 * @description Get single letter details
 * @access Public (for approved letters) / Private (for personal/admin)
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // Optional
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];

    const result = await getLetterDetail(id, userId);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get letter detail error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch letter");
    }
  }
});

/**
 * @route POST /api/letters/:id/acknowledge
 * @description Toggle like on a letter
 * @access Private (authenticated users)
 */
router.post("/:id/acknowledge", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];

    const result = await toggleLetteLike(id, userId);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Toggle like error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to toggle like");
    }
  }
});

/**
 * @route GET /api/letters/user/my-letters
 * @description Get current user's letters
 * @access Private (authenticated users)
 * @query page, limit, status (PENDING|APPROVED|REJECTED), sortBy (recent|oldest)
 */
router.get("/user/my-letters", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page, limit, status, sortBy } = req.query;

    const result = await getMyLetters(userId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      status: status as any,
      sortBy: (sortBy as any) || "recent",
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get my letters error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch your letters");
    }
  }
});

/**
 * @route GET /api/letters/:id/versions
 * @description Get letter versions and history
 * @access Private (authenticated users - author only)
 */
router.get("/:id/versions", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];

    const result = await getLetterVersions(id, userId);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get letter versions error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch letter versions");
    }
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * @route GET /api/admin/letters/queue
 * @description Get moderation queue
 * @access Private (admin only)
 * @query page, limit, status (PENDING|APPROVED|REJECTED)
 */
router.get("/admin/queue", authMiddleware, requirePermission("APPROVE_LETTER"), async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = req.query;

    const result = await getModerationQueue({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      status: status as any,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get moderation queue error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch moderation queue");
    }
  }
});

/**
 * @route PUT /api/admin/letters/:id/approve
 * @description Approve a letter for publication
 * @access Private (admin only)
 */
router.put("/:id/approve", authMiddleware, requirePermission("APPROVE_LETTER"), async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];

    const result = await approveLetter(id);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Approve letter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to approve letter");
    }
  }
});

/**
 * @route PUT /api/admin/letters/:id/reject
 * @description Reject a letter with reason
 * @access Private (admin only)
 */
router.put("/:id/reject", authMiddleware, requirePermission("APPROVE_LETTER"), async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return sendError(res, 400, "VALIDATION_ERROR", "Rejection reason is required");
    }

    const result = await rejectLetter(id, rejectionReason);

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Reject letter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to reject letter");
    }
  }
});

/**
 * @route DELETE /api/admin/letters/:id
 * @description Delete a letter (soft delete)
 * @access Private (admin only)
 */
router.delete("/:id", authMiddleware, requirePermission("DELETE_LETTER"), async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];

    await deleteLetter(id);

    sendSuccess(res, 200, { message: "Letter deleted successfully" });
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Delete letter error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to delete letter");
    }
  }
});

/**
 * @route GET /api/admin/letters/stats
 * @description Get letter statistics
 * @access Private (admin only)
 */
router.get("/admin/stats", authMiddleware, requirePermission("APPROVE_LETTER"), async (req: Request, res: Response) => {
  try {
    const result = await getLetterStats();

    sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.code, error.message, error.details);
    } else {
      console.error("Get letter stats error:", error);
      sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch letter statistics");
    }
  }
});

export default router;
