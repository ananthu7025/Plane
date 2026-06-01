import { db } from "../../../db/index.js";
import { newsletters } from "../../../db/schema.js";
import { eq, desc, ilike, and, isNull } from "drizzle-orm";
import { NewsletterNotFoundError, CloudinaryUploadError } from "../../../utils/errors.js";
import { uploadPDFToCloudinary } from "../cloudinaryService.js";
import { logger } from "../../../utils/logger.js";
import type { CreateNewsletterInput, UpdateNewsletterInput, NewsletterFilters, PaginatedResponse, Newsletter } from "../../../types/newsletter.js";

/**
 * Create a new newsletter
 */
export async function createNewsletter(
  uploadedBy: string,
  data: CreateNewsletterInput
): Promise<Newsletter> {
  try {
    // Upload PDF to Cloudinary
    const cloudinaryData = await uploadPDFToCloudinary(data.file, `${Date.now()}`);

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (data.thumbnailFile) {
      try {
        const { uploadPDFToCloudinary: uploadImage } = await import("../cloudinaryService.js");
        const thumbnailData = await uploadImage(data.thumbnailFile, `thumbnail-${Date.now()}`);
        thumbnailUrl = thumbnailData.url;
      } catch (e) {
        logger.warn("Failed to upload thumbnail", "APP", e instanceof Error ? e : undefined);
        // Continue without thumbnail
      }
    }

    // Create newsletter record
    const result = await db
      .insert(newsletters)
      .values({
        title: data.title,
        description: data.description || null,
        category: data.category,
        cloudinaryPublicId: cloudinaryData.publicId,
        cloudinaryUrl: cloudinaryData.url,
        thumbnailCloudinaryUrl: thumbnailUrl,
        fileSize: cloudinaryData.fileSize,
        uploadedBy,
        status: "published",
      })
      .returning();

    logger.info("Newsletter created successfully", "APP", { newsletterId: result[0].id, uploadedBy });
    return result[0] as Newsletter;
  } catch (error) {
    logger.error("Failed to create newsletter", undefined, error instanceof Error ? error : undefined);
    if (error instanceof CloudinaryUploadError) throw error;
    throw new CloudinaryUploadError("Failed to upload PDF or create newsletter");
  }
}

/**
 * Get all newsletters (admin view)
 */
export async function getAdminNewsletters(
  filters: NewsletterFilters = {}
): Promise<PaginatedResponse<Newsletter>> {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 50);
  const offset = (page - 1) * limit;

  try {
    // Apply filters
    const conditions: any[] = [];

    if (filters.search) {
      conditions.push(ilike(newsletters.title, `%${filters.search}%`));
    }

    if (filters.category) {
      conditions.push(eq(newsletters.category, filters.category));
    }

    if (filters.status) {
      conditions.push(eq(newsletters.status, filters.status));
    }

    // Exclude soft-deleted
    conditions.push(isNull(newsletters.deletedAt));

    // Sort
    const sortOrder = filters.sort === "oldest" ? undefined : desc(newsletters.publishedAt);

    const baseQuery = db.select().from(newsletters).where(and(...conditions));

    const [items, countResult] = await Promise.all([
      sortOrder
        ? baseQuery.orderBy(sortOrder).limit(limit).offset(offset)
        : baseQuery.limit(limit).offset(offset),
      db.select().from(newsletters).where(and(...conditions)),
    ]);

    logger.info("Admin newsletters fetched", "APP", { page, limit, total: countResult.length });

    return {
      items: items as Newsletter[],
      pagination: {
        page,
        limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch admin newsletters", undefined, error instanceof Error ? error : undefined);
    throw new NewsletterNotFoundError("Failed to fetch newsletters");
  }
}

/**
 * Update newsletter
 */
export async function updateNewsletter(
  id: string,
  data: UpdateNewsletterInput
): Promise<Newsletter> {
  try {
    // Check if newsletter exists
    const existing = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);

    if (!existing.length || existing[0].deletedAt) {
      throw new NewsletterNotFoundError("Newsletter not found");
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;

    const result = await db.update(newsletters).set(updateData).where(eq(newsletters.id, id)).returning();

    logger.info("Newsletter updated successfully", "APP", { newsletterId: id });
    return result[0] as Newsletter;
  } catch (error) {
    if (error instanceof NewsletterNotFoundError) throw error;
    logger.error("Failed to update newsletter", undefined, error instanceof Error ? error : undefined);
    throw new NewsletterNotFoundError("Failed to update newsletter");
  }
}

/**
 * Toggle newsletter status (publish/archive)
 */
export async function toggleNewsletterStatus(
  id: string,
  status: "published" | "archived" | "draft"
): Promise<Newsletter> {
  try {
    const existing = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);

    if (!existing.length || existing[0].deletedAt) {
      throw new NewsletterNotFoundError("Newsletter not found");
    }

    const archivedAt = status === "archived" ? new Date() : null;

    const result = await db
      .update(newsletters)
      .set({
        status,
        archivedAt,
        updatedAt: new Date(),
      })
      .where(eq(newsletters.id, id))
      .returning();

    logger.info("Newsletter status updated", "APP", { newsletterId: id, status });
    return result[0] as Newsletter;
  } catch (error) {
    if (error instanceof NewsletterNotFoundError) throw error;
    logger.error("Failed to toggle newsletter status", undefined, error instanceof Error ? error : undefined);
    throw new NewsletterNotFoundError("Failed to update newsletter status");
  }
}

/**
 * Delete newsletter (soft delete)
 */
export async function deleteNewsletter(id: string): Promise<Newsletter> {
  try {
    const existing = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);

    if (!existing.length) {
      throw new NewsletterNotFoundError("Newsletter not found");
    }

    // Soft delete
    const result = await db
      .update(newsletters)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(newsletters.id, id))
      .returning();

    logger.info("Newsletter deleted", "APP", { newsletterId: id });
    return result[0] as Newsletter;
  } catch (error) {
    if (error instanceof NewsletterNotFoundError) throw error;
    logger.error("Failed to delete newsletter", undefined, error instanceof Error ? error : undefined);
    throw new NewsletterNotFoundError("Failed to delete newsletter");
  }
}
