import { Request, Response, NextFunction } from "express";
import * as newsletterAdminService from "../../services/newsletter/newsletterAdminService.js";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";
import type { CreateNewsletterInput, UpdateNewsletterInput } from "../../../types/newsletter.js";

/**
 * Create a new newsletter
 * POST /newsletters/admin/create
 */
export async function createNewsletter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const uploadedBy = req.userId!;
    const { title, description, category } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files.file || !files.file[0]) {
      throw new Error("PDF file is required");
    }

    const data: CreateNewsletterInput = {
      title,
      description,
      category,
      file: files.file[0],
      thumbnailFile: files.thumbnailFile?.[0],
    };

    const result = await newsletterAdminService.createNewsletter(uploadedBy, data);

    logger.info("Newsletter created via API", "APP", { newsletterId: result.id, uploadedBy });

    sendSuccess(res, 201, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all newsletters (admin view)
 * GET /newsletters/admin/list
 */
export async function getAdminNewsletters(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit, search, category, status, sort } = req.query;

    const result = await newsletterAdminService.getAdminNewsletters({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string,
      category: category as string,
      status: status as "published" | "archived" | "draft",
      sort: (sort as "recent" | "oldest") || "recent",
    });

    logger.info("Admin newsletters retrieved", "APP", { total: result.pagination.total });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get newsletter details (admin view)
 * GET /newsletters/admin/:id
 */
export async function getNewsletterDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    // Get newsletter - uses student service since admin just needs the details
    const { getNewsletterById } = await import("../../services/newsletter/newsletterStudentService.js");
    const newsletter = await getNewsletterById(id);

    logger.info("Newsletter details retrieved (admin)", "APP", { newsletterId: id });

    sendSuccess(res, 200, newsletter);
  } catch (error) {
    next(error);
  }
}

/**
 * Update newsletter
 * PUT /newsletters/admin/:id
 */
export async function updateNewsletter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const { title, description, category } = req.body;

    const data: UpdateNewsletterInput = {
      title,
      description,
      category,
    };

    const result = await newsletterAdminService.updateNewsletter(id, data);

    logger.info("Newsletter updated via API", "APP", { newsletterId: id });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Update newsletter status
 * PUT /newsletters/admin/:id/status
 */
export async function updateNewsletterStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const { status } = req.body;

    const result = await newsletterAdminService.toggleNewsletterStatus(id, status);

    logger.info("Newsletter status updated via API", "APP", { newsletterId: id, status });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete newsletter
 * DELETE /newsletters/admin/:id
 */
export async function deleteNewsletter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    const result = await newsletterAdminService.deleteNewsletter(id);

    logger.info("Newsletter deleted via API", "APP", { newsletterId: id });

    sendSuccess(res, 200, { message: "Newsletter deleted successfully", data: result });
  } catch (error) {
    next(error);
  }
}
