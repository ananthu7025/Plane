import { Request, Response, NextFunction } from "express";
import * as userMgmtService from "../../services/community/userManagementService.js";
import { sendSuccess } from "../../../utils/response.js";

export async function banUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, reason, banUntil } = req.body;
    await userMgmtService.banUser(userId, req.userId!, reason, banUntil);
    sendSuccess(res, 200, { message: "User banned" });
  } catch (error) {
    next(error);
  }
}

export async function unbanUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.body;
    await userMgmtService.unbanUser(userId);
    sendSuccess(res, 200, { message: "User unbanned" });
  } catch (error) {
    next(error);
  }
}

export async function getBannedUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.query;
    const result = await userMgmtService.getBannedUsers(
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}
