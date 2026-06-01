import { Request, Response, NextFunction } from "express";
import * as postService from "../../services/community/postService.js";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";

export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await postService.createPost(req.userId!, req.body);
    logger.info("Post created via API", "APP", { postId: result.id });
    sendSuccess(res, 201, result);
  } catch (error) {
    next(error);
  }
}

export async function getPostFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, categoryId, search } = req.query;
    const result = await postService.getPostFeed(
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20,
      categoryId ? parseInt(categoryId as string) : undefined,
      search as string,
      req.userId
    );
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function getPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const result = await postService.getPostById(id, req.userId);
    await postService.incrementViewCount(id);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const result = await postService.updatePost(id, req.userId!, req.body);
    logger.info("Post updated via API", "APP", { postId: id });
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    await postService.deletePost(id, req.userId!);
    sendSuccess(res, 200, { message: "Post deleted" });
  } catch (error) {
    next(error);
  }
}

export async function getMyPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, status } = req.query;
    const result = await postService.getMyPosts(
      req.userId!,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20,
      status as string | undefined
    );
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function getModerationPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, search, status, categoryId } = req.query;
    const result = await postService.getModerationPosts(
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20,
      search as string | undefined,
      status as string | undefined,
      categoryId ? parseInt(categoryId as string) : undefined
    );
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function adminDeletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    await postService.adminDeletePost(id);
    sendSuccess(res, 200, { message: "Post deleted" });
  } catch (error) {
    next(error);
  }
}
