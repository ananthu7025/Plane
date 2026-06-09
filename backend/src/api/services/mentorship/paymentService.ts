import crypto from "crypto";
import Razorpay from "razorpay";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { systemSettings } from "../../../db/schema.js";
import { logger } from "../../../utils/logger.js";
import { PaymentVerificationError } from "../../../utils/errors.js";
import type { CreateOrderResult, MentorshipSettings } from "../../../types/mentorship.js";

const KEY_ID     = process.env.RAZORPAY_KEY_ID!;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const DEFAULT_FEE_PAISE = parseInt(process.env.MENTORSHIP_SESSION_FEE_PAISE ?? "199900", 10);

const SETTINGS_KEY = "mentorship_session_fee";

let rzp: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!rzp) {
    rzp = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }
  return rzp;
}

export async function getSessionFee(): Promise<MentorshipSettings> {
  const [row] = await db
    .select({ settingValue: systemSettings.settingValue })
    .from(systemSettings)
    .where(eq(systemSettings.settingKey, SETTINGS_KEY));

  const paise = (row?.settingValue as { amount?: number })?.amount ?? DEFAULT_FEE_PAISE;
  return {
    sessionFeePaise:    paise,
    sessionFeeFormatted: formatPaise(paise),
  };
}

export async function updateSessionFee(
  adminId: string,
  paise: number
): Promise<MentorshipSettings> {
  const existing = await db
    .select({ id: systemSettings.id })
    .from(systemSettings)
    .where(eq(systemSettings.settingKey, SETTINGS_KEY));

  if (existing.length > 0) {
    await db
      .update(systemSettings)
      .set({ settingValue: { amount: paise }, updatedBy: adminId, updatedAt: new Date() })
      .where(eq(systemSettings.settingKey, SETTINGS_KEY));
  } else {
    await db.insert(systemSettings).values({
      settingKey:   SETTINGS_KEY,
      settingValue: { amount: paise },
      dataType:     "number",
      description:  "Mentorship session fee in paise",
      updatedBy:    adminId,
    });
  }

  logger.info("Mentorship session fee updated", "MENTORSHIP", { paise, adminId });

  return { sessionFeePaise: paise, sessionFeeFormatted: formatPaise(paise) };
}

export async function createOrder(
  studentId: string,
  receipt: string
): Promise<CreateOrderResult> {
  const { sessionFeePaise } = await getSessionFee();

  const order = await getRazorpay().orders.create({
    amount:   sessionFeePaise,
    currency: "INR",
    receipt,
    notes:    { studentId },
  });

  logger.info("Razorpay order created", "MENTORSHIP", { orderId: order.id, studentId });

  return {
    orderId:  order.id,
    amount:   sessionFeePaise,
    currency: "INR",
    keyId:    KEY_ID,
  };
}

export function verifySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): void {
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expected !== razorpaySignature) {
    throw new PaymentVerificationError("Invalid payment signature");
  }
}

function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN")}`;
}
