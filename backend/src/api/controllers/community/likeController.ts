import { Request, Response, NextFunction } from "express";
import * as likeService from "../../services/community/likeService.js";
import { sendSuccess } from "../../../utils/response.js";

export async function likePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const result = await likeService.likePost(id, req.userId!);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function unlikePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const result = await likeService.unlikePost(id, req.userId!);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function likeComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const replyId = typeof req.params.replyId === 'string' ? req.params.replyId : req.params.replyId[0];
    const result = await likeService.likeComment(replyId, req.userId!);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function unlikeComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const replyId = typeof req.params.replyId === 'string' ? req.params.replyId : req.params.replyId[0];
    const result = await likeService.unlikeComment(replyId, req.userId!);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function togglePostLike(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const result = await likeService.togglePostLike(id, req.userId!);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function toggleCommentLike(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const replyId = typeof req.params.replyId === 'string' ? req.params.replyId : req.params.replyId[0];
    const result = await likeService.toggleCommentLike(replyId, req.userId!);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function getPostLikes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const { page, limit } = req.query;
    const result = await likeService.getPostLikers(
      id,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}
