import { db } from "../../../db/index.js";
import { newsletters } from "../../../db/schema.js";
import { eq, desc, ilike, and, isNull } from "drizzle-orm";
import { NewsletterNotFoundError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import type { NewsletterFilters, PaginatedResponse, Newsletter } from "../../../types/newsletter.js";

/**
 * Get published newsletters (student view - public)
 */
export async function getPublicNewsletters(
  filters: NewsletterFilters = {}
): Promise<PaginatedResponse<Newsletter>> {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 50);
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(newsletters.status, "published"), isNull(newsletters.deletedAt)];

    if (filters.search) {
      conditions.push(ilike(newsletters.title, `%${filters.search}%`));
    }

    if (filters.category) {
      conditions.push(eq(newsletters.category, filters.category));
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(newsletters)
        .where(and(...conditions))
        .orderBy(desc(newsletters.publishedAt))
        .limit(limit)
        .offset(offset),
      db.select().from(newsletters).where(and(...conditions)),
    ]);

    logger.info("Public newsletters fetched", "APP", { page, limit, total: countResult.length });

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
    logger.error("Failed to fetch public newsletters", undefined, error instanceof Error ? error : undefined);
    throw new NewsletterNotFoundError("Failed to fetch newsletters");
  }
}

/**
 * Get single newsletter details
 */
export async function getNewsletterById(id: string): Promise<Newsletter> {
  try {
    const result = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);

    if (!result.length || result[0].deletedAt) {
      throw new NewsletterNotFoundError("Newsletter not found");
    }

    logger.info("Newsletter retrieved", "APP", { newsletterId: id });
    return result[0] as Newsletter;
  } catch (error) {
    if (error instanceof NewsletterNotFoundError) throw error;
    logger.error("Failed to fetch newsletter", undefined, error instanceof Error ? error : undefined);
    throw new NewsletterNotFoundError("Failed to fetch newsletter");
  }
}
