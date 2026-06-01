import { db } from "../../../db/index.js";
import { bannedUsers } from "../../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { logger } from "../../../utils/logger.js";
import type { PaginatedResponse } from "../../../types/community.js";

export async function banUser(userId: string, bannedBy: string, reason: string, banUntil?: Date): Promise<void> {
  try {
    await db.insert(bannedUsers).values({
      userId,
      bannedBy,
      reason,
      banUntil,
      createdAt: new Date(),
    });
    logger.info("User banned", "APP", { userId, bannedBy, reason });
  } catch (error) {
    logger.error("Failed to ban user", undefined, error instanceof Error ? error : undefined);
  }
}

export async function unbanUser(userId: string): Promise<void> {
  try {
    await db.delete(bannedUsers).where(eq(bannedUsers.userId, userId));
    logger.info("User unbanned", "APP", { userId });
  } catch (error) {
    logger.error("Failed to unban user", undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * Get all banned users
 */
export async function getBannedUsers(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<any>> {
  const limit_safe = Math.min(limit, 50);
  const offset = (page - 1) * limit_safe;

  try {
    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(bannedUsers)
        .orderBy(desc(bannedUsers.createdAt))
        .limit(limit_safe)
        .offset(offset),
      db.select().from(bannedUsers),
    ]);

    return {
      items,
      pagination: {
        page,
        limit: limit_safe,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit_safe),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch banned users", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}
