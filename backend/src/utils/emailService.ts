import nodemailer from "nodemailer";
import { db } from "../db/index.js";
import { emailQueue as emailQueueTable } from "../db/schema.js";
import { eq, and, lte, isNull } from "drizzle-orm";
import { logger } from "./logger.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    logger.warn("Email transporter verification failed", "EMAIL", error);
    logger.info("Emails will be logged to console instead", "EMAIL");
  } else {
    logger.info("Email transporter ready", "EMAIL");
  }
});

// Email processor state
let isProcessing = false;

/**
 * OTP Email Template
 */
function getOTPEmailTemplate(fullName: string, otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
          .otp-box { background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #667eea; margin: 10px 0; font-family: monospace; }
          .otp-expires { color: #666; font-size: 12px; margin-top: 10px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; color: #856404; font-size: 13px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
          .footer a { color: #667eea; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Plane & Prop</h1>
            <p>Email Verification</p>
          </div>
          <div class="content">
            <div class="greeting">
              <p>Hi <strong>${fullName}</strong>,</p>
              <p>Welcome to Plane & Prop! Thank you for signing up. Please verify your email address to activate your account.</p>
            </div>
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <div class="otp-expires">This code expires in 15 minutes</div>
            </div>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Plane & Prop staff will never ask for your verification code.
            </div>
            <p style="color: #666; margin-top: 20px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Plane & Prop Community. All rights reserved.</p>
            <p><a href="https://planeprop.com">Visit our website</a> | <a href="https://planeprop.com/support">Support</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Password Reset Email Template
 */
function getPasswordResetEmailTemplate(fullName: string, resetToken: string, email: string): string {
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; margin: 20px 0; font-weight: bold; }
          .warning { background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0; border-radius: 4px; color: #721c24; font-size: 13px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 12px;">${resetLink}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong> This link expires in 1 hour. If you didn't request a password reset, please ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Plane & Prop Community. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Password Confirmation Email Template
 */
function getPasswordConfirmationEmailTemplate(fullName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px; color: #155724; font-size: 13px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Changed</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            <p>Your password has been successfully reset. You can now log in with your new password.</p>
            <div class="success">
              <strong>✅ Success:</strong> Your account is secure. If you did not make this change, please contact support immediately.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Plane & Prop Community. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send OTP to user's email (with persistent queue)
 */
export async function sendOTPEmail(email: string, fullName: string, otp: string): Promise<boolean> {
  try {
    const html = getOTPEmailTemplate(fullName, otp);
    return await queueEmail(email, "🔐 Email Verification - Plane & Prop", html);
  } catch (error) {
    logger.error("Error queuing OTP email", "EMAIL", error as Error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  resetToken: string
): Promise<boolean> {
  try {
    const html = getPasswordResetEmailTemplate(fullName, resetToken, email);
    return await queueEmail(email, "🔐 Password Reset - Plane & Prop", html);
  } catch (error) {
    logger.error("Error queuing password reset email", "EMAIL", error as Error);
    return false;
  }
}

/**
 * Send password confirmation email
 */
export async function sendPasswordConfirmationEmail(email: string, fullName: string): Promise<boolean> {
  try {
    const html = getPasswordConfirmationEmailTemplate(fullName);
    return await queueEmail(email, "✅ Password Changed Successfully - Plane & Prop", html);
  } catch (error) {
    logger.error("Error queuing password confirmation email", "EMAIL", error as Error);
    return false;
  }
}

/**
 * Queue email for later processing (persistent storage)
 */
async function queueEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    // Insert into database queue
    await db.insert(emailQueueTable).values({
      recipientEmail: to,
      subject,
      htmlContent: html,
      status: "PENDING",
      attemptCount: 0,
      maxAttempts: 3,
      nextRetryAt: new Date(), // Send immediately
    });

    logger.debug(`Email queued for ${to}`, "EMAIL");

    // Try to process immediately (non-blocking)
    if (!isProcessing) {
      processEmailQueue().catch((error) => {
        logger.error("Email queue processor error", "EMAIL", error as Error);
      });
    }

    return true;
  } catch (error) {
    logger.error("Error adding email to queue", "EMAIL", error as Error);
    return false;
  }
}

/**
 * Process email queue (handles bulk sends efficiently)
 */
async function processEmailQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // Get pending emails that are ready to retry
    const now = new Date();
    const pendingEmails = await db
      .select()
      .from(emailQueueTable)
      .where(
        and(
          eq(emailQueueTable.status, "PENDING"),
          lte(emailQueueTable.nextRetryAt, now)
        )
      )
      .limit(10); // Process 10 at a time

    for (const emailRecord of pendingEmails) {
      try {
        // Check if transporter is available
        if (!transporter.verify) {
          // If Nodemailer is not configured, log to console for development
          logger.info(`[DEV MODE] Email would be sent to: ${emailRecord.recipientEmail}`, "EMAIL", {
            subject: emailRecord.subject,
          });

          // Mark as sent
          await db
            .update(emailQueueTable)
            .set({
              status: "SENT",
              sentAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(emailQueueTable.id, emailRecord.id));

          continue;
        }

        // Send email
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || "noreply@planeprop.com",
          to: emailRecord.recipientEmail,
          subject: emailRecord.subject,
          html: emailRecord.htmlContent,
        });

        // Mark as sent
        await db
          .update(emailQueueTable)
          .set({
            status: "SENT",
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(emailQueueTable.id, emailRecord.id));

        logger.info(`Email sent to ${emailRecord.recipientEmail}`, "EMAIL", {
          messageId: info.messageId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Update retry count and schedule next retry
        const attemptCount = (emailRecord.attemptCount || 0) + 1;
        const isLastAttempt = attemptCount >= (emailRecord.maxAttempts || 3);

        // Exponential backoff: 5 min, 15 min, 60 min
        const backoffMinutes = [5, 15, 60][Math.min(attemptCount - 1, 2)];
        const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await db
          .update(emailQueueTable)
          .set({
            status: isLastAttempt ? "FAILED" : "PENDING",
            attemptCount,
            lastAttemptAt: new Date(),
            nextRetryAt: isLastAttempt ? null : nextRetry,
            errorMessage: errorMessage,
            updatedAt: new Date(),
          })
          .where(eq(emailQueueTable.id, emailRecord.id));

        const level = isLastAttempt ? "error" : "warn";
        logger.security(
          `Email send failed (attempt ${attemptCount}/${emailRecord.maxAttempts})`,
          isLastAttempt ? "MEDIUM" : "LOW",
          {
            email: emailRecord.recipientEmail,
            error: errorMessage,
            nextRetry: isLastAttempt ? "No more retries" : nextRetry,
          }
        );
      }

      // Small delay to avoid overwhelming SMTP server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    logger.error("Email queue processor error", "EMAIL", error as Error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Start the email processor (runs in the background)
 */
export function startEmailProcessor(): void {
  // Process every 30 seconds
  setInterval(() => {
    if (!isProcessing) {
      processEmailQueue().catch((error) => {
        logger.error("Email queue processor error", "EMAIL", error as Error);
      });
    }
  }, 30 * 1000);

  logger.info("Email processor started (processes every 30 seconds)", "EMAIL");
}

/**
 * Get queue status for monitoring
 */
export async function getEmailQueueStatus() {
  try {
    const pending = await db
      .select()
      .from(emailQueueTable)
      .where(eq(emailQueueTable.status, "PENDING"));

    const failed = await db
      .select()
      .from(emailQueueTable)
      .where(eq(emailQueueTable.status, "FAILED"));

    return {
      pendingCount: pending.length,
      failedCount: failed.length,
      isProcessing,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error getting email queue status", "EMAIL", error as Error);
    return { error: "Failed to get status" };
  }
}

/**
 * Direct send for critical emails (synchronous)
 */
export async function sendEmailDirect(options: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@planeprop.com",
      ...options,
    });
    logger.info(`Email sent directly to ${options.to}`, "EMAIL", {
      messageId: info.messageId,
    });
    return true;
  } catch (error) {
    logger.error("Error sending direct email", "EMAIL", error as Error);
    return false;
  }
}
