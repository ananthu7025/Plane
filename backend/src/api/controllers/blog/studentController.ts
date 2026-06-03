/**
 * Blog Student Controller
 * Request handlers for student blog reading endpoints
 * Thin wrapper layer: extract request data → call service → send response
 */

import { Request, Response, NextFunction } from "express";
import * as blogStudentService from "../../services/blog/blogStudentService.js";
import * as blogAccessService from "../../services/blog/blogAccessService.js";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";

/**
 * Get all published blogs with pagination and filters
 * GET /api/blogs?search=&category=&page=1&limit=20
 */
export async function getPublishedBlogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { search, category, page, limit } = req.query;

    const result = await blogStudentService.getPublishedBlogs(
      search as string | undefined,
      category as string | undefined,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    logger.info("Published blogs fetch endpoint called", "APP", {
      total: result.total,
      page,
      limit,
    });

    sendSuccess(res, 200, {
      blogs: result.blogs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single published blog by ID
 * GET /api/blogs/:blogId
 */
export async function getBlog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const blogId = parseInt(req.params.blogId as string);
    const userId = req.userId;

    const result = await blogStudentService.getBlogStudent(blogId, userId);

    logger.info("Published blog detail endpoint called", "APP", {
      blogId,
      userId: userId || "anonymous",
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle blog acknowledgement (like/unlike)
 * POST /api/blogs/:blogId/acknowledge
 */
export async function toggleAcknowledge(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const blogId = parseInt(req.params.blogId as string);

    const result = await blogAccessService.toggleBlogAcknowledgement(
      blogId,
      userId
    );

    logger.info("Blog acknowledge toggle endpoint called", "APP", {
      blogId,
      userId,
      acknowledged: result.acknowledged,
    });

    sendSuccess(res, 200, {
      acknowledged: result.acknowledged,
      acknowledgementCount: result.count,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record blog view for analytics
 * POST /api/blogs/:blogId/view
 */
export async function recordView(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const blogId = parseInt(req.params.blogId as string);

    const viewCount = await blogAccessService.recordBlogView(blogId, userId);

    logger.info("Blog view record endpoint called", "APP", {
      blogId,
      userId: userId || "anonymous",
      viewCount,
    });

    sendSuccess(res, 200, { viewCount });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all blog categories
 * GET /api/blogs/categories
 */
export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await blogStudentService.getBlogCategories();

    logger.info("Blog categories fetch endpoint called", "APP", {
      count: categories.length,
    });

    sendSuccess(res, 200, { categories });
  } catch (error) {
    next(error);
  }
}
