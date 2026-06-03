/**
 * Blog Admin Controller
 * Request handlers for admin blog management endpoints
 * Thin wrapper layer: extract request data → call service → send response
 */

import { Request, Response, NextFunction } from "express";
import * as blogAdminService from "../../services/blog/blogAdminService.js";
import { uploadImageToCloudinary } from "../../services/cloudinaryService.js";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";

/**
 * Create a new blog post
 * POST /api/admin/blogs
 */
export async function createBlog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const { title, excerpt, content, category, status } = req.body;

    let coverImageUrl: string | undefined;
    if (req.file) {
      const uploaded = await uploadImageToCloudinary(req.file, "covers");
      coverImageUrl = uploaded.url;
    }

    const result = await blogAdminService.createBlog(userId, {
      title,
      excerpt,
      content,
      category,
      status,
      coverImageUrl,
    });

    logger.info("Blog creation endpoint called", "APP", {
      blogId: result.id,
      userId,
      status: result.status,
    });

    sendSuccess(res, 201, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all blogs (admin view with filters)
 * GET /api/admin/blogs?search=&category=&status=&page=1&limit=20
 */
export async function getAllBlogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { search, category, status, page, limit } = req.query;

    const result = await blogAdminService.getAllBlogsAdmin(
      search as string | undefined,
      category as string | undefined,
      status as string | undefined,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    logger.info("Blog list endpoint called", "APP", {
      total: result.total,
      page,
      limit,
    });

    sendSuccess(res, 200, {
      blogs: result.blogs,
      total: result.total,
      stats: result.stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single blog by ID (admin view)
 * GET /api/admin/blogs/:blogId
 */
export async function getBlog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const blogId = parseInt(req.params.blogId as string);

    const result = await blogAdminService.getBlogAdmin(blogId);

    logger.info("Blog detail endpoint called", "APP", { blogId });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Update blog content and metadata
 * PUT /api/admin/blogs/:blogId
 */
export async function updateBlog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const blogId = parseInt(req.params.blogId as string);
    const { title, excerpt, content, category, status } = req.body;

    let coverImageUrl: string | undefined;
    if (req.file) {
      const uploaded = await uploadImageToCloudinary(req.file, "covers");
      coverImageUrl = uploaded.url;
    }

    const result = await blogAdminService.updateBlog(blogId, {
      title,
      excerpt,
      content,
      category,
      status,
      coverImageUrl,
    });

    logger.info("Blog update endpoint called", "APP", { blogId });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete blog (soft delete)
 * DELETE /api/admin/blogs/:blogId
 */
export async function deleteBlog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const blogId = parseInt(req.params.blogId as string);

    await blogAdminService.deleteBlog(blogId);

    logger.info("Blog delete endpoint called", "APP", { blogId });

    sendSuccess(res, 200, { message: "Blog deleted successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * Publish or unpublish blog
 * PATCH /api/admin/blogs/:blogId/publish
 */
export async function publishBlog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const blogId = parseInt(req.params.blogId as string);
    const { action } = req.body;

    const result = await blogAdminService.publishBlog(
      blogId,
      action as "publish" | "unpublish"
    );

    logger.info("Blog publish endpoint called", "APP", {
      blogId,
      action,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}
