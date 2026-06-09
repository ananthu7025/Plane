import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.js";
import { logger } from "../../../utils/logger.js";
import * as paymentService from "../../services/mentorship/paymentService.js";
import * as mentorshipService from "../../services/mentorship/mentorshipService.js";
import type { SubmitMentorshipInput } from "../../../types/mentorship.js";

/**
 * Create a Razorpay order for a mentorship session booking
 * POST /api/mentorship/payment/create-order
 */
export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.userId!;
    const receipt   = `ms_${studentId.slice(0, 8)}_${Date.now().toString(36)}`;
    const result    = await paymentService.createOrder(studentId, receipt);

    logger.info("Razorpay order created via API", "MENTORSHIP", {
      orderId: result.orderId,
      studentId,
    });

    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Verify Razorpay payment and create the mentorship booking
 * POST /api/mentorship/payment/verify
 */
export async function verifyAndBook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.userId!;
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      topic,
      description,
      slotDateTime,
      amountPaidPaise,
    } = req.body;

    const input: SubmitMentorshipInput = {
      topic,
      description,
      preferredDateTime: slotDateTime,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amountPaidPaise,
    };

    const request = await mentorshipService.submitRequest(studentId, input);

    logger.info("Payment verified and booking created", "MENTORSHIP", {
      requestId: request.id,
      studentId,
      razorpayOrderId,
    });

    sendSuccess(res, 201, { request });
  } catch (error) {
    next(error);
  }
}
