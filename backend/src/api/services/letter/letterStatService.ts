import { db } from "../../../db/index.js";
import { studentLetters, letterAcknowledgements } from "../../../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { LetterNotFoundError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

/**
 * Like a letter
 */
export async function likeLetter(letterId: string, userId: string): Promise<void> {
  try {
    // Check if letter exists
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new LetterNotFoundError("Letter not found");
    }

    // Check if already liked
    const existing = await db.query.letterAcknowledgements.findFirst({
      where: and(
        eq(letterAcknowledgements.letterId, letterId),
        eq(letterAcknowledgements.userId, userId)
      ),
    });

    if (existing) {
      return; // Already liked, skip
    }

    // Add like
    await db.insert(letterAcknowledgements).values({
      letterId,
      userId,
      createdAt: new Date(),
    });

    // Increment like count
    await db
      .update(studentLetters)
      .set({
        acknowledgementCount: (letter.acknowledgementCount || 0) + 1,
      })
      .where(eq(studentLetters.id, letterId));

    logger.info("Letter liked", "APP", { letterId, userId });
  } catch (error) {
    if (error instanceof LetterNotFoundError) throw error;
    logger.error("Failed to like letter", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Unlike a letter
 */
export async function unlikeLetter(letterId: string, userId: string): Promise<void> {
  try {
    // Check if letter exists
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new LetterNotFoundError("Letter not found");
    }

    // Check if user has liked it
    const like = await db.query.letterAcknowledgements.findFirst({
      where: and(
        eq(letterAcknowledgements.letterId, letterId),
        eq(letterAcknowledgements.userId, userId)
      ),
    });

    if (!like) {
      return; // Not liked, skip
    }

    // Remove like
    await db
      .delete(letterAcknowledgements)
      .where(
        and(
          eq(letterAcknowledgements.letterId, letterId),
          eq(letterAcknowledgements.userId, userId)
        )
      );

    // Decrement like count
    await db
      .update(studentLetters)
      .set({
        acknowledgementCount: Math.max((letter.acknowledgementCount || 1) - 1, 0),
      })
      .where(eq(studentLetters.id, letterId));

    logger.info("Letter unliked", "APP", { letterId, userId });
  } catch (error) {
    if (error instanceof LetterNotFoundError) throw error;
    logger.error("Failed to unlike letter", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Get like count for a letter
 */
export async function getLikeCount(letterId: string): Promise<number> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new LetterNotFoundError("Letter not found");
    }

    return letter.acknowledgementCount || 0;
  } catch (error) {
    if (error instanceof LetterNotFoundError) throw error;
    logger.error("Failed to get like count", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Check if user has liked a letter
 */
export async function hasUserLiked(letterId: string, userId: string): Promise<boolean> {
  try {
    const like = await db.query.letterAcknowledgements.findFirst({
      where: and(
        eq(letterAcknowledgements.letterId, letterId),
        eq(letterAcknowledgements.userId, userId)
      ),
    });

    return !!like;
  } catch (error) {
    logger.error("Failed to check if user liked", undefined, error instanceof Error ? error : undefined);
    return false;
  }
}

/**
 * Get letter statistics (excluding soft-deleted letters)
 */
export async function getStats() {
  try {
    const letters = await db.query.studentLetters.findMany({
      where: isNull(studentLetters.deletedAt),
    });

    const total = letters.length;
    const approved = letters.filter(l => l.status === "APPROVED").length;
    const pending = letters.filter(l => l.status === "PENDING").length;
    const rejected = letters.filter(l => l.status === "REJECTED").length;
    const totalLikes = letters.reduce((sum, l) => sum + (l.acknowledgementCount || 0), 0);
    const avgLikesPerLetter = total > 0 ? Math.round((totalLikes / total) * 100) / 100 : 0;

    return {
      total,
      approved,
      pending,
      rejected,
      totalLikes,
      avgLikesPerLetter,
    };
  } catch (error) {
    logger.error("Failed to get letter stats", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}
