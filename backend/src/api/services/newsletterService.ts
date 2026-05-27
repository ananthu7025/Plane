import { db } from "../../db/index.js";
import { newsletters, newsletterPages } from "../../db/schema.js";
import { eq, desc, ilike, and, isNull, gte, lte } from "drizzle-orm";
import { AppError } from "../../utils/errors.js";
import { uploadPDFToCloudinary, deleteFromCloudinary, getPageImageUrl } from "./cloudinaryService.js";

/**
 * Create a new newsletter
 */
export async function createNewsletter(
  uploadedBy: string,
  data: {
    title: string;
    description?: string;
    category: string;
    isPaid: boolean;
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
        cloudinaryThumbnail: cloudinaryData.thumbnail,
        fileSize: cloudinaryData.fileSize,
        pageCount: cloudinaryData.pageCount,
        isPaid: data.isPaid,
        uploadedBy,
        status: "published",
      })
      .returning();

    const newsletter = result[0];

    // Create page records
    for (const page of cloudinaryData.pages) {
      await db.insert(newsletterPages).values({
        newsletterId: newsletter.id,
        pageNumber: page.page,
        cloudinaryImageUrl: page.url,
        cloudinaryPublicId: page.publicId,
      });
    }

    return newsletter;
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
  isPaid?: boolean;
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

    if (filters.isPaid !== undefined) {
      conditions.push(eq(newsletters.isPaid, filters.isPaid));
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

    // Get first page for preview
    const firstPage = await db
      .select()
      .from(newsletterPages)
      .where(and(eq(newsletterPages.newsletterId, id), eq(newsletterPages.pageNumber, 1)))
      .limit(1);

    return {
      ...result[0],
      previewPage: firstPage[0] || null,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Get newsletter error:", error);
    throw new AppError(500, "NEWSLETTER_FETCH_FAILED", "Failed to fetch newsletter");
  }
}

/**
 * Update newsletter
 */
export async function updateNewsletter(id: string, data: { title?: string; description?: string; category?: string; isPaid?: boolean }) {
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
    if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;

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

/**
 * Get a specific page (WEB ONLY - returns error for pages 2+)
 */
export async function getNewsletterPageWeb(newsletterId: string, pageNumber: number) {
  try {
    // Web platform only supports page 1
    if (pageNumber !== 1) {
      throw new AppError(403, "WEB_RESTRICTED", "Full content is only available in our Mobile App", {
        pageNumber,
        redirectMessage: "Download Mobile App to view full newsletter",
      });
    }

    // Get newsletter
    const newsletter = await db.select().from(newsletters).where(eq(newsletters.id, newsletterId)).limit(1);

    if (!newsletter.length || newsletter[0].deletedAt) {
      throw new AppError(404, "NEWSLETTER_NOT_FOUND", "Newsletter not found");
    }

    // Get page
    const page = await db
      .select()
      .from(newsletterPages)
      .where(and(eq(newsletterPages.newsletterId, newsletterId), eq(newsletterPages.pageNumber, pageNumber)))
      .limit(1);

    if (!page.length) {
      throw new AppError(404, "PAGE_NOT_FOUND", "Page not found");
    }

    return {
      pageNumber: page[0].pageNumber,
      imageUrl: page[0].cloudinaryImageUrl,
      cloudinaryPublicId: page[0].cloudinaryPublicId,
      isLocked: false,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Get newsletter page error:", error);
    throw new AppError(500, "PAGE_FETCH_FAILED", "Failed to fetch page");
  }
}
