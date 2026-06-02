import { Request, Response, NextFunction } from "express";
import * as newsletterStudentService from "../../services/newsletter/newsletterStudentService.js";
import * as newsletterAccessService from "../../services/newsletter/newsletterAccessService.js";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";

/**
 * Get public newsletters (student view)
 * GET /newsletters/list
 */
export async function getPublicNewsletters(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit, search, category } = req.query;

    const result = await newsletterStudentService.getPublicNewsletters({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string,
      category: category as string,
    });

    logger.info("Public newsletters retrieved", "APP", { total: result.pagination.total });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get newsletter details
 * GET /newsletters/:id
 */
export async function getNewsletterDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    const newsletter = await newsletterStudentService.getNewsletterById(id);

    logger.info("Newsletter details retrieved", "APP", { newsletterId: id });

    sendSuccess(res, 200, newsletter);
  } catch (error) {
    next(error);
  }
}

/**
 * Check newsletter access (returns access level and preview)
 * GET /newsletters/:id/access
 */
export async function checkNewsletterAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const userRole = (req as any).roleName || "STUDENT";
    const userSubscriptionStatus = (req as any).subscriptionStatus;
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    // Get newsletter details
    const newsletter = await newsletterStudentService.getNewsletterById(id);

    // Check access permissions
    const hasFullAccess = newsletterAccessService.hasFullAccess(userRole, userSubscriptionStatus);
    const canViewPreview = newsletterAccessService.canViewPreview(userRole);

    logger.info("Newsletter access checked", "APP", {
      newsletterId: id,
      userId,
      hasFullAccess,
      canViewPreview
    });

    sendSuccess(res, 200, {
      newsletter,
      access: {
        hasFullAccess,
        canViewPreview,
        requiresSubscription: !hasFullAccess && userRole !== "ADMIN",
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get newsletter PDF file
 * GET /newsletters/:id/pdf
 */
export async function getNewsletterPdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const userRole = (req as any).roleName || "STUDENT";
    const userSubscriptionStatus = (req as any).subscriptionStatus;
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    logger.info("getNewsletterPdf called", "APP", {
      userId,
      userRole,
      userSubscriptionStatus,
      newsletterId: id,
    });

    // Get newsletter details
    const newsletter = await newsletterStudentService.getNewsletterById(id);

    logger.info("Newsletter found", "APP", {
      newsletterId: id,
      title: newsletter.title,
      hasCloudinaryUrl: !!newsletter.cloudinaryUrl,
    });

    // Check access permissions
    const hasFullAccess = newsletterAccessService.hasFullAccess(userRole, userSubscriptionStatus);
    const canViewPreview = newsletterAccessService.canViewPreview(userRole);

    // Fetch PDF from Cloudinary
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      logger.info("Fetching PDF from Cloudinary", "APP", {
        cloudinaryUrl: newsletter.cloudinaryUrl?.substring(0, 50) + "..."
      });

      const response = await fetch(newsletter.cloudinaryUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Cloudinary returned ${response.status}: ${response.statusText}`);
      }

      const pdfBytes = await response.arrayBuffer();

      if (!pdfBytes || pdfBytes.byteLength === 0) {
        throw new Error("Received empty PDF from Cloudinary");
      }

      logger.info("PDF fetched from Cloudinary", "APP", {
        size: pdfBytes.byteLength,
        newsletterId: id
      });

      // Format PDF based on user role only (admin = full, others = page 1 only)
      const { formatPDFByRole } = await import("../../services/newsletter/newsletterAccessService.js");
      const formattedPdf = await formatPDFByRole(pdfBytes, userRole, id);

      if (!formattedPdf || formattedPdf.length === 0) {
        throw new Error("PDF formatting returned empty result");
      }

      logger.info("Newsletter PDF served", "APP", {
        newsletterId: id,
        userId,
        accessLevel: hasFullAccess ? "full" : "preview",
        formattedSize: formattedPdf.length,
      });

      // Sanitize filename - remove special characters
      const sanitizedTitle = newsletter.title
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .trim()
        .substring(0, 50) || "newsletter";

      // Set response headers with explicit type conversion to ensure valid header values
      res.type("application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${sanitizedTitle}.pdf"`);
      res.setHeader("Content-Length", String(formattedPdf.length));
      // Never cache PDFs - always fetch fresh to prevent stale content
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      res.setHeader("Accept-Ranges", "bytes");

      // Send PDF buffer
      res.send(formattedPdf);
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      logger.error("Failed to fetch or process PDF from Cloudinary", undefined, fetchError instanceof Error ? fetchError : new Error(errorMsg));

      // Ensure we send JSON response with proper content-type
      res.status(500);
      res.setHeader("Content-Type", "application/json");
      res.json({
        success: false,
        data: null,
        error: {
          code: "PDF_FETCH_ERROR",
          message: "Failed to fetch PDF file: " + errorMsg,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    next(error);
  }
}
