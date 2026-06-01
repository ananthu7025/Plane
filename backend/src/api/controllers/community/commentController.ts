import { Request, Response, NextFunction } from "express";
import * as commentService from "../../services/community/commentService.js";
import { sendSuccess } from "../../../utils/response.js";

export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await commentService.createComment(req.userId!, req.body);
    sendSuccess(res, 201, result);
  } catch (error) {
    next(error);
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = typeof req.params.postId === 'string' ? req.params.postId : req.params.postId[0];
    const { page, limit } = req.query;
    const result = await commentService.getPostComments(postId, page ? parseInt(page as string) : 1, limit ? parseInt(limit as string) : 20);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    await commentService.deleteComment(id, req.userId!);
    sendSuccess(res, 200, { message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
}

/**
 * Create reply (alias for createComment with postId from URL params)
 */
export async function createReply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = typeof req.params.postId === 'string' ? req.params.postId : req.params.postId[0];
    const result = await commentService.createComment(req.userId!, {
      ...req.body,
      postId,
    });
    sendSuccess(res, 201, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete reply (alias for deleteComment with replyId from URL params)
 */
export async function deleteReply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const replyId = typeof req.params.replyId === 'string' ? req.params.replyId : req.params.replyId[0];
    await commentService.deleteComment(replyId, req.userId!);
    sendSuccess(res, 200, { message: "Reply deleted" });
  } catch (error) {
    next(error);
  }
}
