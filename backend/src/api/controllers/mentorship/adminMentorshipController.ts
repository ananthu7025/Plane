import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";
import * as mentorshipService from "../../services/mentorship/mentorshipService.js";
import type { AdminMentorshipFilters } from "../../../types/mentorship.js";

/**
 * Get all mentorship requests with optional filters and pagination
 * GET /api/mentorship/admin
 */
export async function getAllRequests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await mentorshipService.getAdminRequests(
      req.query as unknown as AdminMentorshipFilters
    );

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single mentorship request by ID
 * GET /api/mentorship/admin/:id
 */
export async function getRequestById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await mentorshipService.findById(id);
    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve a mentorship request and create the Teams meeting
 * PATCH /api/mentorship/admin/:id/approve
 */
export async function approveRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.userId!;
    const id      = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { scheduledDateTime } = req.body;

    const result = await mentorshipService.approveRequest(id, adminId, { scheduledDateTime });

    logger.info("Mentorship request approved via API", "MENTORSHIP", { id, adminId });

    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject a mentorship request with a reason
 * PATCH /api/mentorship/admin/:id/reject
 */
export async function rejectRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.userId!;
    const id      = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;

    const result = await mentorshipService.rejectRequest(id, adminId, { reason });

    logger.info("Mentorship request rejected via API", "MENTORSHIP", { id, adminId });

    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a mentorship request
 * DELETE /api/mentorship/admin/:id
 */
export async function deleteRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await mentorshipService.deleteRequest(id);
    sendSuccess(res, 200, { message: "Request deleted" });
  } catch (error) {
    next(error);
  }
}

/**
 * Retry Teams meeting creation for an approved request that has no meeting link
 * POST /api/mentorship/admin/:id/create-meeting
 */
export async function retryCreateMeeting(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await mentorshipService.createMeetingForApproved(id);
    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Reschedule a mentorship request to a new datetime
 * PATCH /api/mentorship/admin/:id/reschedule
 */
export async function rescheduleRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.userId!;
    const id      = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { rescheduledDateTime } = req.body;

    const result = await mentorshipService.rescheduleRequest(id, adminId, { rescheduledDateTime });

    logger.info("Mentorship request rescheduled via API", "MENTORSHIP", { id, adminId });

    sendSuccess(res, 200, { request: result });
  } catch (error) {
    next(error);
  }
}
