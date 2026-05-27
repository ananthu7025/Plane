import { db } from "../../db/index.js";
import { newsletters } from "../../db/schema.js";
import { eq, desc, ilike, and, isNull } from "drizzle-orm";
import { AppError } from "../../utils/errors.js";
import { uploadPDFToCloudinary, deleteFromCloudinary } from "./cloudinaryService.js";

/**
 * Create a new newsletter
 */
export async function createNewsletter(
  uploadedBy: string,
  data: {
    title: string;
    description?: string;
    category: string;
    file: Express.Multer.File;
  }
) {
  try {
    // Upload to Cloudinary
    const cloudinaryData = await uploadPDFToCloudinary(data.file, `${Date.now()}`);

    // Create newsletter record
    const result = await db
      .insert(newsletters)
      .values({
        title: data.title,
        description: data.description || null,
        category: data.category,
        cloudinaryPublicId: cloudinaryData.publicId,
        cloudinaryUrl: cloudinaryData.url,
        fileSize: cloudinaryData.fileSize,
        uploadedBy,
        status: "published",
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Create newsletter error:", error);
    throw new AppError(500, "NEWSLETTER_CREATE_FAILED", "Failed to create newsletter");
  }
}

/**
 * Get all newsletters (admin view)
 */
export async function getAdminNewsletters(filters: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sort?: "recent" | "oldest";
} = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  try {
    // Apply filters
    const conditions: any[] = [];

    if (filters.search) {
      conditions.push(
        ilike(newsletters.title, `%${filters.search}%`)
      );
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
      db
        .select()
        .from(newsletters)
        .where(and(...conditions)),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit),
      },
    };
  } catch (error) {
    console.error("Get admin newsletters error:", error);
    throw new AppError(500, "NEWSLETTER_FETCH_FAILED", "Failed to fetch newsletters");
  }
}

/**
 * Get published newsletters (student view - public)
 */
export async function getPublicNewsletters(filters: { page?: number; limit?: number; search?: string; category?: string } = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  try {
    const conditions = [
      eq(newsletters.status, "published"),
      isNull(newsletters.deletedAt),
    ];

    if (filters.search) {
      conditions.push(ilike(newsletters.title, `%${filters.search}%`));
    }

    if (filters.category) {
      conditions.push(eq(newsletters.category, filters.category));
    }

    const [items, countResult] = await Promise.all([
      db.select().from(newsletters).where(and(...conditions)).orderBy(desc(newsletters.publishedAt)).limit(limit).offset(offset),
      db.select().from(newsletters).where(and(...conditions)),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit),
      },
    };
  } catch (error) {
    console.error("Get public newsletters error:", error);
    throw new AppError(500, "NEWSLETTER_FETCH_FAILED", "Failed to fetch newsletters");
  }
}

/**
 * Get single newsletter
 */
export async function getNewsletterById(id: string) {
  try {
    const result = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);

    if (!result.length || result[0].deletedAt) {
      throw new AppError(404, "NEWSLETTER_NOT_FOUND", "Newsletter not found");
    }

    return result[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Get newsletter error:", error);
    throw new AppError(500, "NEWSLETTER_FETCH_FAILED", "Failed to fetch newsletter");
  }
}

/**
 * Update newsletter
 */
export async function updateNewsletter(id: string, data: { title?: string; description?: string; category?: string }) {
  try {
    // Check if newsletter exists
    const existing = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);

    if (!existing.length || existing[0].deletedAt) {
      throw new AppError(404, "NEWSLETTER_NOT_FOUND", "Newsletter not found");
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;

    const result = await db.update(newsletters).set(updateData).where(eq(newsletters.id, id)).returning();

    return result[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Update newsletter error:", error);
    throw new AppError(500, "NEWSLETTER_UPDATE_FAILED", "Failed to update newsletter");
  }
}

/**
 * Toggle newsletter status (publish/archive)
 */
export async function toggleNewsletterStatus(id: string, status: "published" | "archived" | "draft") {
  try {
    const existing = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);

    if (!existing.length || existing[0].deletedAt) {
      throw new AppError(404, "NEWSLETTER_NOT_FOUND", "Newsletter not found");
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

    return result[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Toggle status error:", error);
    throw new AppError(500, "NEWSLETTER_UPDATE_FAILED", "Failed to update newsletter status");
  }
}

/**
 * Delete newsletter (soft delete)
 */
export async function deleteNewsletter(id: string) {
  try {
    const existing = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);

    if (!existing.length) {
      throw new AppError(404, "NEWSLETTER_NOT_FOUND", "Newsletter not found");
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

    return result[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Delete newsletter error:", error);
    throw new AppError(500, "NEWSLETTER_DELETE_FAILED", "Failed to delete newsletter");
  }
}

