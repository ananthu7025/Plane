import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.js";
import { ValidationError } from "../../../utils/errors.js";
import * as slotService from "../../services/mentorship/slotService.js";
import * as paymentService from "../../services/mentorship/paymentService.js";

/**
 * GET /api/mentorship/slots?date=YYYY-MM-DD
 */
export async function getAvailableSlots(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { date } = req.query as { date?: string };
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ValidationError("date query param must be YYYY-MM-DD");
    }

    const [slots, settings] = await Promise.all([
      slotService.getAvailableSlotsForDate(date),
      paymentService.getSessionFee(),
    ]);

    sendSuccess(res, 200, { slots, ...settings });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/mentorship/settings
 */
export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = await paymentService.getSessionFee();
    sendSuccess(res, 200, settings);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/mentorship/admin/slots
 */
export async function getAllSlots(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const templates = await slotService.getAllTemplates();
    sendSuccess(res, 200, { templates });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/mentorship/admin/slots
 */
export async function createSlot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.userId!;
    const { dayOfWeek, startTime } = req.body;
    const template = await slotService.createTemplate(adminId, { dayOfWeek, startTime });
    sendSuccess(res, 201, { template });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/mentorship/admin/slots/:id
 */
export async function deleteSlot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await slotService.deleteTemplate(req.params.id as string);
    sendSuccess(res, 200, { message: "Slot deleted" });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/mentorship/admin/slots/:id/toggle
 */
export async function toggleSlot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const template = await slotService.toggleTemplate(req.params.id as string);
    sendSuccess(res, 200, { template });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/mentorship/admin/slots/copy
 */
export async function copySlots(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.userId!;
    const { fromDay, toDays } = req.body;
    const result = await slotService.copySlots(adminId, { fromDay, toDays });
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/mentorship/admin/settings
 */
export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.userId!;
    const { sessionFeePaise } = req.body;
    const settings = await paymentService.updateSessionFee(adminId, sessionFeePaise);
    sendSuccess(res, 200, settings);
  } catch (error) {
    next(error);
  }
}
