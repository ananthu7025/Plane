import { db } from "../../../db/index.js";
import { studentLetters, letterAcknowledgements, users, userProfiles, bannedUsers } from "../../../db/schema.js";
import { eq, and, desc, isNull, ilike } from "drizzle-orm";
import { LetterNotFoundError, UserBannedError, ForbiddenError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import type { CreateLetterInput, ResubmitLetterInput, GetLettersParams, GetMyLettersParams, FormattedLetter, PaginatedResponse } from "../../../types/letter.js";

/**
 * Check if user is banned
 */
async function isUserBanned(userId: string): Promise<boolean> {
  const banned = await db.query.bannedUsers.findFirst({
    where: and(eq(bannedUsers.userId, userId), isNull(bannedUsers.banUntil)),
  });
  return !!banned;
}

/**
 * Format letter for response with author info
 */
async function formatLetter(
  letter: any,
  viewerId?: string,
  includeAuthorId = false,
  viewerRoleName?: string
): Promise<FormattedLetter> {
  let author = null;
  const isViewerAdmin = viewerRoleName === "ADMIN";

  if (!letter.isAnonymous || isViewerAdmin) {
    const authorData = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, letter.authorId),
    });
    author = {
      id: letter.authorId,
      fullName: authorData?.fullName || "Unknown",
      avatar: authorData?.avatarMediaId,
    };
  }

  const formatted: FormattedLetter = {
    id: letter.id,
    subject: letter.subject,
    content: letter.content,
    status: letter.status,
    isAnonymous: letter.isAnonymous,
    isPublished: letter.isPublished,
    acknowledgementCount: letter.acknowledgementCount || 0,
    author,
    coverMediaId: letter.coverMediaId,
    createdAt: letter.createdAt,
    publishedAt: letter.publishedAt,
    updatedAt: letter.updatedAt,
  };

  if (includeAuthorId) {
    formatted.authorId = letter.authorId;
  }

  if (viewerId) {
    const like = await db.query.letterAcknowledgements.findFirst({
      where: and(eq(letterAcknowledgements.letterId, letter.id), eq(letterAcknowledgements.userId, viewerId)),
    });
    formatted.isLiked = !!like;
  }

  return formatted;
}

/**
 * Create a new letter
 */
export async function createLetter(userId: string, data: CreateLetterInput): Promise<FormattedLetter> {
  try {
    const banned = await isUserBanned(userId);
    if (banned) {
      throw new UserBannedError("You are banned from creating letters");
    }

    const [letter] = await db
      .insert(studentLetters)
      .values({
        authorId: userId,
        subject: data.subject.trim(),
        content: data.content.trim(),
        isAnonymous: data.isAnonymous || false,
        coverMediaId: data.coverMediaId,
        status: "PENDING",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Letter created", "APP", { letterId: letter.id, userId });

    return formatLetter(letter, userId);
  } catch (error) {
    logger.error("Failed to create letter", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Resubmit letter (creates new version)
 */
export async function resubmitLetter(
  letterId: string,
  userId: string,
  data: ResubmitLetterInput
): Promise<FormattedLetter> {
  try {
    const banned = await isUserBanned(userId);
    if (banned) {
      throw new UserBannedError("You are banned from resubmitting letters");
    }

    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new LetterNotFoundError("Letter not found");
    }

    if (letter.authorId !== userId) {
      throw new ForbiddenError("You can only resubmit your own letters");
    }

    if (letter.status === "APPROVED") {
      throw new ForbiddenError("Cannot resubmit an approved letter");
    }

    const updatedLetter = await db
      .update(studentLetters)
      .set({
        subject: data.subject.trim(),
        content: data.content.trim(),
        coverMediaId: data.coverMediaId,
        status: "PENDING",
        updatedAt: new Date(),
      })
      .where(eq(studentLetters.id, letterId))
      .returning();


    return formatLetter(updatedLetter[0], userId);
  } catch (error) {
    logger.error("Failed to resubmit letter", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Get public feed (published letters only)
 */
export async function getPublicFeed(
  viewerId: string,
  params: GetLettersParams = {},
  viewerRoleName?: string
): Promise<PaginatedResponse<FormattedLetter>> {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 10, 50);
  const offset = (page - 1) * limit;

  try {
    const conditions = [
      eq(studentLetters.status, "APPROVED"),
      eq(studentLetters.isPublished, true),
      isNull(studentLetters.deletedAt),
    ];

    if (params.search) {
      conditions.push(ilike(studentLetters.subject, `%${params.search}%`));
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(studentLetters)
        .where(and(...conditions))
        .orderBy(desc(studentLetters.publishedAt))
        .limit(limit)
        .offset(offset),
      db.select().from(studentLetters).where(and(...conditions)),
    ]);

    const formatted = await Promise.all(items.map((letter) => formatLetter(letter, viewerId, false, viewerRoleName)));

    logger.info("Public feed fetched", "APP", { page, limit, total: countResult.length });

    return {
      items: formatted,
      pagination: {
        page,
        limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch public feed", undefined, error instanceof Error ? error : undefined);
    throw new LetterNotFoundError("Failed to fetch letters");
  }
}

/**
 * Get user's letters
 */
export async function getMyLetters(
  userId: string,
  params: GetMyLettersParams = {},
  viewerRoleName?: string
): Promise<PaginatedResponse<FormattedLetter>> {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 10, 50);
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(studentLetters.authorId, userId), isNull(studentLetters.deletedAt)];

    if (params.status) {
      conditions.push(eq(studentLetters.status, params.status));
    }

    const query = db
      .select()
      .from(studentLetters)
      .where(and(...conditions));

    if (params.sortBy !== "oldest") {
      query.orderBy(desc(studentLetters.createdAt));
    }

    const [items, countResult] = await Promise.all([
      query.limit(limit).offset(offset),
      db.select().from(studentLetters).where(and(...conditions)),
    ]);

    const formatted = await Promise.all(items.map((letter) => formatLetter(letter, userId, true, viewerRoleName)));

    logger.info("User letters fetched", "APP", { userId, page, limit, total: countResult.length });

    return {
      items: formatted,
      pagination: {
        page,
        limit,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch user letters", undefined, error instanceof Error ? error : undefined);
    throw new LetterNotFoundError("Failed to fetch letters");
  }
}

/**
 * Get a single letter by ID
 */
export async function getLetterById(letterId: string, viewerId?: string, viewerRoleName?: string): Promise<FormattedLetter> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: and(
        eq(studentLetters.id, letterId),
        isNull(studentLetters.deletedAt)
      ),
    });

    if (!letter) {
      throw new LetterNotFoundError("Letter not found");
    }

    // Only allow viewing published letters or own letters
    if (letter.status !== "APPROVED" && letter.authorId !== viewerId) {
      throw new LetterNotFoundError("Letter not found");
    }

    return formatLetter(letter, viewerId, false, viewerRoleName);
  } catch (error) {
    if (error instanceof LetterNotFoundError) throw error;
    logger.error("Failed to fetch letter", undefined, error instanceof Error ? error : undefined);
    throw new LetterNotFoundError("Failed to fetch letter");
  }
}

/**
 * Get letter versions (currently returns single version)
 * Future: support multiple versions when version tracking is added to schema
 */
export async function getLetterVersions(letterId: string, viewerId?: string): Promise<any[]> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: and(
        eq(studentLetters.id, letterId),
        isNull(studentLetters.deletedAt)
      ),
    });

    if (!letter) {
      throw new LetterNotFoundError("Letter not found");
    }

    // Only allow viewing published letters or own letters
    if (letter.status !== "APPROVED" && letter.authorId !== viewerId) {
      throw new LetterNotFoundError("Letter not found");
    }

    // Return current letter as v1 (version history support to be added)
    return [
      {
        version: 1,
        subject: letter.subject,
        content: letter.content,
        createdAt: letter.createdAt,
        updatedAt: letter.updatedAt,
        status: letter.status,
      },
    ];
  } catch (error) {
    if (error instanceof LetterNotFoundError) throw error;
    logger.error("Failed to fetch letter versions", undefined, error instanceof Error ? error : undefined);
    throw new LetterNotFoundError("Failed to fetch letter versions");
  }
}
