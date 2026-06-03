/**
 * FAQ Service
 * Handles all FAQ CRUD operations, ordering, and toggle logic
 */

import { eq, asc, isNull } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { faqs } from "../../../db/schema.js";
import { logger } from "../../../utils/logger.js";
import { FAQNotFoundError } from "../../../utils/errors.js";
import type {
  FAQ,
  FAQStats,
  CreateFAQInput,
  UpdateFAQInput,
  ReorderItem,
  AdminFAQListResponse,
} from "../../../types/faq.js";

/**
 * Get all active FAQs ordered for public/student display
 */
export async function getPublicFAQs(): Promise<FAQ[]> {
  const result = await db
    .select()
    .from(faqs)
    .where(eq(faqs.isActive, true))
    .orderBy(asc(faqs.order));

  logger.info("Public FAQs fetched", "FAQ", { count: result.length });
  return result;
}

/**
 * Get all FAQs (including inactive) with stats for admin panel
 */
export async function getAdminFAQs(): Promise<AdminFAQListResponse> {
  const all = await db
    .select()
    .from(faqs)
    .where(isNull(faqs.deletedAt))
    .orderBy(asc(faqs.order));

  const stats: FAQStats = {
    total:    all.length,
    active:   all.filter((f) => f.isActive).length,
    inactive: all.filter((f) => !f.isActive).length,
  };

  logger.info("Admin FAQs fetched", "FAQ", { total: stats.total });
  return { faqs: all, stats };
}

/**
 * Create a new FAQ, appended at the end of the order
 */
export async function createFAQ(
  userId: string,
  data: CreateFAQInput
): Promise<FAQ> {
  const existing = await db
    .select({ order: faqs.order })
    .from(faqs)
    .where(isNull(faqs.deletedAt))
    .orderBy(asc(faqs.order));

  const maxOrder =
    existing.length > 0 ? Math.max(...existing.map((f) => f.order)) : 0;

  const [faq] = await db
    .insert(faqs)
    .values({
      question:  data.question,
      answer:    data.answer,
      category:  data.category,
      isActive:  data.isActive,
      order:     maxOrder + 1,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  logger.info("FAQ created", "FAQ", { faqId: faq.id, userId });
  return faq;
}

/**
 * Update an existing FAQ's fields by ID
 */
export async function updateFAQ(
  faqId: number,
  data: UpdateFAQInput
): Promise<FAQ> {
  const existing = await db.query.faqs.findFirst({
    where: eq(faqs.id, faqId),
  });

  if (!existing || existing.deletedAt) {
    throw new FAQNotFoundError();
  }

  const [updated] = await db
    .update(faqs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(faqs.id, faqId))
    .returning();

  logger.info("FAQ updated", "FAQ", { faqId });
  return updated;
}

/**
 * Toggle isActive status for a single FAQ
 */
export async function toggleFAQ(faqId: number): Promise<FAQ> {
  const existing = await db.query.faqs.findFirst({
    where: eq(faqs.id, faqId),
  });

  if (!existing || existing.deletedAt) {
    throw new FAQNotFoundError();
  }

  const [updated] = await db
    .update(faqs)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(faqs.id, faqId))
    .returning();

  logger.info("FAQ toggled", "FAQ", { faqId, isActive: updated.isActive });
  return updated;
}

/**
 * Soft delete a FAQ by ID
 */
export async function deleteFAQ(faqId: number): Promise<void> {
  const existing = await db.query.faqs.findFirst({
    where: eq(faqs.id, faqId),
  });

  if (!existing || existing.deletedAt) {
    throw new FAQNotFoundError();
  }

  await db
    .update(faqs)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(faqs.id, faqId));

  logger.info("FAQ soft-deleted", "FAQ", { faqId });
}

/**
 * Bulk update order values for drag-and-drop reordering
 * Runs all updates in parallel for performance
 */
export async function reorderFAQs(items: ReorderItem[]): Promise<void> {
  await Promise.all(
    items.map(({ id, order }) =>
      db
        .update(faqs)
        .set({ order, updatedAt: new Date() })
        .where(eq(faqs.id, id))
    )
  );

  logger.info("FAQs reordered", "FAQ", { count: items.length });
}
