import { PDFDocument } from "pdf-lib";
import { logger } from "../../../utils/logger.js";
import { NewsletterNotFoundError } from "../../../utils/errors.js";

/**
 * Format PDF based on user role only
 * - Admin: Return full PDF
 * - Other roles: Return page 1 only as preview
 */
export async function formatPDFByRole(
  pdfBytes: ArrayBuffer,
  userRole: string,
  newsletterId: string
): Promise<Buffer> {
  try {
    // Load PDF once to validate and normalize it
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    // Normalize role - handle potential quotes or whitespace issues
    const normalizedRole = (userRole || "").toString().trim().toUpperCase().replace(/"/g, "");

    logger.info("formatPDFByRole called", "APP", {
      newsletterId,
      userRole,
      normalizedRole,
      pdfSize: pdfBytes.byteLength,
      totalPages,
      isAdmin: normalizedRole === "ADMIN",
    });

    // Admin gets full PDF
    if (normalizedRole === "ADMIN") {
      logger.info("Returning full PDF to admin", "APP", {
        newsletterId,
        pdfSize: pdfBytes.byteLength,
        totalPages,
      });
      const fullPdfBytes = await pdfDoc.save();
      return Buffer.from(fullPdfBytes);
    }

    // Non-admin users get page 1 only (preview)
    logger.info("Extracting PDF preview for non-admin", "APP", {
      newsletterId,
      originalSize: pdfBytes.byteLength,
      totalPages,
      detectedRole: userRole,
    });

    const newPdfDoc = await PDFDocument.create();
    const pages = await newPdfDoc.copyPages(pdfDoc, [0]);
    pages.forEach(page => newPdfDoc.addPage(page));

    const previewBytes = await newPdfDoc.save();

    logger.info("PDF preview generated", "APP", {
      newsletterId,
      totalPages,
      previewSize: previewBytes.length,
    });

    return Buffer.from(previewBytes);
  } catch (error) {
    logger.error("Failed to format PDF", undefined, error instanceof Error ? error : undefined);
    throw new NewsletterNotFoundError("Failed to format PDF");
  }
}

/**
 * Check if user has access to view full newsletter
 */
export function hasFullAccess(userRole: string, userSubscriptionStatus?: string): boolean {
  // Normalize role
  const normalizedRole = (userRole || "").toString().trim().toUpperCase().replace(/"/g, "");

  // Admins always have full access
  if (normalizedRole === "ADMIN") return true;

  // Students need paid subscription for full access
  return userSubscriptionStatus === "PAID";
}

/**
 * Check if user can view page 1 (always free preview)
 */
export function canViewPreview(userRole: string): boolean {
  // Everyone can view page 1 preview
  return true;
}
