import { db } from "../../../db/index.js";
import { studentLetters, userProfiles } from "../../../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { LetterNotFoundError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

/**
 * Approve a letter (admin only)
 */
export async function approveLetter(letterId: string): Promise<any> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new LetterNotFoundError("Letter not found");
    }

    const updated = await db
      .update(studentLetters)
      .set({
        status: "APPROVED",
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentLetters.id, letterId))
      .returning();

    logger.info("Letter approved", "APP", { letterId });
    return updated[0];
  } catch (error) {
    if (error instanceof LetterNotFoundError) throw error;
    logger.error("Failed to approve letter", undefined, error instanceof Error ? error : undefined);
    throw new LetterNotFoundError("Failed to approve letter");
  }
}

/**
 * Reject a letter (admin only)
 */
export async function rejectLetter(letterId: string, reason: string): Promise<any> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new LetterNotFoundError("Letter not found");
    }

    const updated = await db
      .update(studentLetters)
      .set({
        status: "REJECTED",
        isPublished: false,
        updatedAt: new Date(),
      })
      .where(eq(studentLetters.id, letterId))
      .returning();

    logger.info("Letter rejected", "APP", { letterId, reason });
    return updated[0];
  } catch (error) {
    if (error instanceof LetterNotFoundError) throw error;
    logger.error("Failed to reject letter", undefined, error instanceof Error ? error : undefined);
    throw new LetterNotFoundError("Failed to reject letter");
  }
}

/**
 * Delete a letter (soft delete)
 */
export async function deleteLetter(letterId: string): Promise<any> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new LetterNotFoundError("Letter not found");
    }

    const updated = await db
      .update(studentLetters)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentLetters.id, letterId))
      .returning();

    logger.info("Letter deleted", "APP", { letterId });
    return updated[0];
  } catch (error) {
    if (error instanceof LetterNotFoundError) throw error;
    logger.error("Failed to delete letter", undefined, error instanceof Error ? error : undefined);
    throw new LetterNotFoundError("Failed to delete letter");
  }
}

/**
 * Get letters for moderation (admin only) - filter by status or get all
 */
export async function getPendingLetters(page: number = 1, limit: number = 20, status?: "PENDING" | "APPROVED" | "REJECTED"): Promise<any> {
  try {
    const offset = (page - 1) * limit;
    limit = Math.min(limit, 50);

    // Build conditions array with soft delete filter
    const conditions: any[] = [
      isNull(studentLetters.deletedAt), // Only include non-deleted letters
    ];

    // If status is provided, add status filter
    if (status) {
      conditions.push(eq(studentLetters.status, status));
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(studentLetters)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset),
      db
        .select()
        .from(studentLetters)
        .where(and(...conditions)),
    ]);

    // Enrich items with author information
    const enrichedItems = await Promise.all(
      items.map(async (letter) => {
        const authorProfile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, letter.authorId),
        });
        return {
          ...letter,
          author: {
            id: letter.authorId,
            fullName: authorProfile?.fullName || "Unknown",
            avatar: authorProfile?.avatarMediaId,
          },
        };
      })
    );

    logger.info("Letters fetched for moderation", "APP", { page, limit, status, total: countResult.length });

    return {
      items: enrichedItems,
      pagination: {
        page,
        limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit),
        hasMore: offset + limit < countResult.length,
      },
    };
  } catch (error) {
    logger.error("Failed to fetch letters for moderation", undefined, error instanceof Error ? error : undefined);
    throw new LetterNotFoundError("Failed to fetch letters for moderation");
  }
}
