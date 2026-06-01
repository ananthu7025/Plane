import { Request, Response, NextFunction } from "express";
import * as moderationService from "../../services/community/moderationService.js";
import { sendSuccess } from "../../../utils/response.js";

export async function approvePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    await moderationService.approvePost(id);
    sendSuccess(res, 200, { message: "Post approved" });
  } catch (error) {
    next(error);
  }
}

export async function rejectPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    await moderationService.rejectPost(id);
    sendSuccess(res, 200, { message: "Post rejected" });
  } catch (error) {
    next(error);
  }
}

export async function approveComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    await moderationService.approveComment(id);
    sendSuccess(res, 200, { message: "Comment approved" });
  } catch (error) {
    next(error);
  }
}

export async function adminApprovePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const result = await moderationService.adminApprovePost(id);
    sendSuccess(res, 200, { post: result });
  } catch (error) {
    next(error);
  }
}

export async function adminDeclinePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
    const result = await moderationService.adminDeclinePost(id);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteReply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const replyId = typeof req.params.replyId === 'string' ? req.params.replyId : req.params.replyId[0];
    await moderationService.adminDeleteReply(replyId);
    sendSuccess(res, 200, { message: "Reply deleted" });
  } catch (error) {
    next(error);
  }
}
