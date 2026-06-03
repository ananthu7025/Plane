/**
 * Feedback Analytics Service
 * Category-level stats for the admin analytics tab
 */

import { eq, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { studentFeedback } from "../../../db/schema.js";
import { logger } from "../../../utils/logger.js";
import type { CategoryStat } from "../../../types/feedback.js";

const CATEGORIES = ["general", "course", "mcq", "mentorship", "newsletter", "community"];

/**
 * Get per-category count and average rating
 */
export async function getCategoryStats(): Promise<CategoryStat[]> {
  const rows = await db
    .select({
      category:  studentFeedback.category,
      count:     sql<number>`count(*)::int`,
      avgRating: sql<number>`round(avg(${studentFeedback.rating})::numeric, 1)::float`,
    })
    .from(studentFeedback)
    .groupBy(studentFeedback.category);

  const statsMap = new Map(rows.map((r) => [r.category, r]));

  const result: CategoryStat[] = CATEGORIES.map((cat) => {
    const row = statsMap.get(cat);
    return {
      category:  cat,
      count:     row?.count     ?? 0,
      avgRating: row?.avgRating ?? 0,
    };
  });

  logger.info("Category stats computed", "FEEDBACK", { categories: result.length });
  return result;
}
