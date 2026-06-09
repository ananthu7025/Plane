import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.js";
import { ForbiddenError } from "../../../utils/errors.js";
import * as mentorshipService from "../../services/mentorship/mentorshipService.js";

/**
 * Get all mentorship requests for the authenticated student
 * GET /api/mentorship/my
 */
export async function getMyRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.userId!;
    const result = await mentorshipService.getMyRequests(studentId);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single mentorship request by ID (student can only view their own)
 * GET /api/mentorship/my/:id
 */
export async function getRequestById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.userId!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await mentorshipService.findById(id);

    if (result.studentId !== studentId) {
      throw new ForbiddenError("You can only view your own mentorship requests");
    }

    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}
