import { db } from "../../db/index.js";
import {
  studentLetters,
  letterAcknowledgements,
  users,
  userProfiles,
  bannedUsers,
} from "../../db/schema.js";
import {
  eq,
  and,
  desc,
  asc,
  count,
  isNull,
  ilike,
  inArray,
  sql,
} from "drizzle-orm";
import {
  NotFoundError,
  ForbiddenError,
  AppError,
  ValidationError,
} from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreateLetterData {
  subject: string;
  content: string;
  isAnonymous?: boolean;
  coverMediaId?: string;
}

export interface ResubmitLetterData {
  subject: string;
  content: string;
  coverMediaId?: string;
}

export interface GetLettersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "recent" | "popular" | "trending";
}

export interface GetMyLettersParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  sortBy?: "recent" | "oldest";
}

export interface FormattedLetter {
  id: string;
  subject: string;
  content: string;
  status: string;
  isAnonymous: boolean;
  isPublished: boolean;
  acknowledgementCount: number;
  viewCount: number;
  author?: {
    id: string;
    fullName: string;
    avatar?: string | null;
  } | null;
  authorId?: string; // Only for admins
  coverMediaId?: string | null;
  isLiked?: boolean;
  createdAt: Date;
  publishedAt?: Date | null;
  updatedAt: Date;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user is banned
 */
async function isUserBanned(userId: string): Promise<boolean> {
  const banned = await db.query.bannedUsers.findFirst({
    where: and(
      eq(bannedUsers.userId, userId),
      isNull(bannedUsers.banUntil)
    ),
  });
  return !!banned;
}

/**
 * Format letter for response with author info
 */
async function formatLetter(
  letter: any,
  viewerId?: string,
  includeAuthorId = false
): Promise<FormattedLetter> {
  let author = null;
  let isViewerAdmin = false;

  // Check if viewer is admin
  if (viewerId) {
    try {
      const viewer = await db.query.users.findFirst({
        where: eq(users.id, viewerId),
      });
      isViewerAdmin = viewer?.roleId === 1; // Assuming roleId 1 is ADMIN (from schema.ts)
    } catch (e) {
      logger.warn(`Failed to check admin status for user ${viewerId}`);
    }
  }

  // Get author info
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
    viewCount: letter.viewCount || 0,
    author,
    coverMediaId: letter.coverMediaId,
    createdAt: letter.createdAt,
    publishedAt: letter.publishedAt,
    updatedAt: letter.updatedAt,
  };

  // Add authorId for admin views
  if (includeAuthorId) {
    formatted.authorId = letter.authorId;
  }

  // Check if viewer has liked this letter
  if (viewerId) {
    const like = await db.query.letterAcknowledgements.findFirst({
      where: and(
        eq(letterAcknowledgements.letterId, letter.id),
        eq(letterAcknowledgements.userId, viewerId)
      ),
    });
    formatted.isLiked = !!like;
  }

  return formatted;
}

/**
 * Validate letter content
 */
function validateLetterContent(subject: string, content: string): void {
  if (!subject || subject.trim().length < 5 || subject.length > 255) {
    throw new ValidationError(
      "Subject must be between 5 and 255 characters",
      { field: "subject" }
    );
  }

  if (!content || content.trim().length < 20 || content.length > 10000) {
    throw new ValidationError(
      "Content must be between 20 and 10000 characters",
      { field: "content" }
    );
  }
}

// ============================================================================
// STUDENT ENDPOINTS
// ============================================================================

/**
 * 1. Create a Letter
 * POST /api/letters
 */
export async function createLetter(
  userId: string,
  data: CreateLetterData
): Promise<FormattedLetter> {
  try {
    // Validate user is not banned
    const banned = await isUserBanned(userId);
    if (banned) {
      throw new ForbiddenError("You are banned from creating letters");
    }

    // Validate input
    validateLetterContent(data.subject, data.content);

    // Create letter
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

    logger.info(`Letter created: ${letter.id} by ${userId}`);

    return formatLetter(letter, userId);
  } catch (error) {
    logger.error(`Error creating letter: ${error}`);
    throw error;
  }
}

/**
 * 2. Resubmit Letter (Create Version)
 * POST /api/letters/:id/resubmit
 */
export async function resubmitLetter(
  letterId: string,
  userId: string,
  data: ResubmitLetterData
): Promise<FormattedLetter> {
  try {
    // Check if user is banned
    const banned = await isUserBanned(userId);
    if (banned) {
      throw new ForbiddenError("You are banned from resubmitting letters");
    }

    // Find the letter
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new NotFoundError("Letter not found");
    }

    // Check ownership (user must be the author)
    if (letter.authorId !== userId) {
      throw new ForbiddenError("You can only resubmit your own letters");
    }

    // Only allow resubmit if letter was rejected
    if (letter.status !== "REJECTED") {
      throw new AppError(
        400,
        "INVALID_LETTER_STATE",
        `Cannot resubmit a letter with status: ${letter.status}`
      );
    }

    // Validate new content
    validateLetterContent(data.subject, data.content);

    // Update the letter with new content (creates implicit version)
    const [updatedLetter] = await db
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

    logger.info(`Letter resubmitted: ${letterId} by ${userId}`);

    return formatLetter(updatedLetter, userId);
  } catch (error) {
    logger.error(`Error resubmitting letter: ${error}`);
    throw error;
  }
}

/**
 * 3. Get Public Letters (Feed) - Infinite Scroll
 * GET /api/letters
 */
export async function getPublicLetters(
  userId: string | undefined,
  params: GetLettersParams
): Promise<{
  letters: FormattedLetter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}> {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, params.limit || 10);
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any[] = [
      eq(studentLetters.status, "APPROVED"),
      eq(studentLetters.isPublished, true),
      isNull(studentLetters.deletedAt),
    ];

    if (params.search && params.search.trim()) {
      const searchTerm = `%${params.search.trim()}%`;
      whereConditions.push(
        sql`(${studentLetters.subject} ILIKE ${searchTerm} OR ${studentLetters.content} ILIKE ${searchTerm})`
      );
    }

    // Apply sorting
    let orderBy: any;
    if (params.sortBy === "popular") {
      orderBy = desc(studentLetters.acknowledgementCount);
    } else if (params.sortBy === "trending") {
      orderBy = desc(
        sql`${studentLetters.acknowledgementCount} / (EXTRACT(EPOCH FROM (now() - ${studentLetters.publishedAt})) / 3600 + 1)`
      );
    } else {
      orderBy = desc(studentLetters.publishedAt);
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(studentLetters)
      .where(and(...whereConditions));

    // Get paginated results
    const letters = await db
      .select()
      .from(studentLetters)
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Format letters
    const formattedLetters = await Promise.all(
      letters.map((letter) => formatLetter(letter, userId))
    );

    const totalPages = Math.ceil(total / limit);

    return {
      letters: formattedLetters,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    logger.error(`Error fetching public letters: ${error}`);
    throw error;
  }
}

/**
 * 4. Get Letter Detail
 * GET /api/letters/:id
 */
export async function getLetterDetail(
  letterId: string,
  userId?: string
): Promise<FormattedLetter> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new NotFoundError("Letter not found");
    }

    // Permission check: must be author, admin, or letter must be approved & published
    let isAuthor = false;
    let isAdmin = false;

    if (userId) {
      isAuthor = letter.authorId === userId;

      // Check if admin
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      isAdmin = user?.roleId === 1; // Assuming roleId 1 is ADMIN
    }

    if (
      !isAuthor &&
      !isAdmin &&
      (letter.status !== "APPROVED" || !letter.isPublished)
    ) {
      throw new ForbiddenError("You cannot view this letter");
    }

    // Increment view count
    await db
      .update(studentLetters)
      .set({
        viewCount: (letter.viewCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(studentLetters.id, letterId));

    return formatLetter(letter, userId, isAdmin);
  } catch (error) {
    logger.error(`Error fetching letter detail: ${error}`);
    throw error;
  }
}

/**
 * 5. Toggle Like on Letter (Acknowledgement)
 * POST /api/letters/:id/acknowledge
 */
export async function toggleLetteLike(
  letterId: string,
  userId: string
): Promise<{ isLiked: boolean; acknowledgementCount: number }> {
  try {
    // Check if user is banned
    const banned = await isUserBanned(userId);
    if (banned) {
      throw new ForbiddenError("You are banned from liking letters");
    }

    // Find the letter
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new NotFoundError("Letter not found");
    }

    // Check if user already liked
    const existingLike = await db.query.letterAcknowledgements.findFirst({
      where: and(
        eq(letterAcknowledgements.letterId, letterId),
        eq(letterAcknowledgements.userId, userId)
      ),
    });

    if (existingLike) {
      // Unlike
      await db
        .delete(letterAcknowledgements)
        .where(
          and(
            eq(letterAcknowledgements.letterId, letterId),
            eq(letterAcknowledgements.userId, userId)
          )
        );

      // Decrement count
      await db
        .update(studentLetters)
        .set({
          acknowledgementCount: Math.max(0, (letter.acknowledgementCount || 0) - 1),
          updatedAt: new Date(),
        })
        .where(eq(studentLetters.id, letterId));

      logger.info(`Letter unliked: ${letterId} by ${userId}`);

      return {
        isLiked: false,
        acknowledgementCount: Math.max(0, (letter.acknowledgementCount || 0) - 1),
      };
    } else {
      // Like
      await db
        .insert(letterAcknowledgements)
        .values({
          letterId,
          userId,
          createdAt: new Date(),
        })
        .onConflictDoNothing();

      // Increment count
      const [updatedLetter] = await db
        .update(studentLetters)
        .set({
          acknowledgementCount: (letter.acknowledgementCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(studentLetters.id, letterId))
        .returning();

      logger.info(`Letter liked: ${letterId} by ${userId}`);

      return {
        isLiked: true,
        acknowledgementCount: updatedLetter.acknowledgementCount || 0,
      };
    }
  } catch (error) {
    logger.error(`Error toggling letter like: ${error}`);
    throw error;
  }
}

/**
 * 6. Get My Letters
 * GET /api/letters/user/my-letters
 */
export async function getMyLetters(
  userId: string,
  params: GetMyLettersParams
): Promise<{
  letters: FormattedLetter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, params.limit || 10);
    const offset = (page - 1) * limit;

    // Build where clause
    const whereConditions = [eq(studentLetters.authorId, userId)];

    if (params.status) {
      whereConditions.push(eq(studentLetters.status, params.status));
    }

    const totalResult = await db
      .select({ count: count() })
      .from(studentLetters)
      .where(and(...whereConditions));

    const total = totalResult[0]?.count || 0;

    // Get paginated results
    const letters = await db
      .select()
      .from(studentLetters)
      .where(and(...whereConditions))
      .orderBy(
        params.sortBy === "oldest"
          ? asc(studentLetters.createdAt)
          : desc(studentLetters.createdAt)
      )
      .limit(limit)
      .offset(offset);

    // Format letters
    const formattedLetters = await Promise.all(
      letters.map((letter) => formatLetter(letter, userId))
    );

    const totalPages = Math.ceil(total / limit);

    return {
      letters: formattedLetters,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    logger.error(`Error fetching user letters: ${error}`);
    throw error;
  }
}

/**
 * 7. Get Letter Versions
 * GET /api/letters/:id/versions
 */
export async function getLetterVersions(
  letterId: string,
  userId: string
): Promise<{
  current: FormattedLetter;
  history: Array<{
    id: string;
    version: number;
    createdAt: Date;
    status: string;
    rejectionReason?: string;
  }>;
}> {
  try {
    // Find the letter
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new NotFoundError("Letter not found");
    }

    // Check ownership
    if (letter.authorId !== userId) {
      throw new ForbiddenError("You can only view versions of your own letters");
    }

    const current = await formatLetter(letter, userId);

    // For now, return simplified version history
    // In a full implementation, you would query a separate letterVersions table
    const history = [
      {
        id: letter.id,
        version: 1,
        createdAt: letter.createdAt,
        status: letter.status,
      },
    ];

    return {
      current,
      history,
    };
  } catch (error) {
    logger.error(`Error fetching letter versions: ${error}`);
    throw error;
  }
}

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * 8. Get Moderation Queue
 * GET /api/admin/letters/queue
 */
export async function getModerationQueue(params: {
  page?: number;
  limit?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}): Promise<{
  letters: FormattedLetter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, params.limit || 20);
    const offset = (page - 1) * limit;

    const whereConditions = [];
    if (params.status) {
      whereConditions.push(eq(studentLetters.status, params.status));
    } else {
      whereConditions.push(eq(studentLetters.status, "PENDING"));
    }

    // Get total
    const [{ total }] = await db
      .select({ total: count() })
      .from(studentLetters)
      .where(and(...whereConditions));

    // Get paginated results
    const letters = await db
      .select()
      .from(studentLetters)
      .where(and(...whereConditions))
      .orderBy(asc(studentLetters.createdAt))
      .limit(limit)
      .offset(offset);

    // Format letters (include authorId for admins)
    const formattedLetters = await Promise.all(
      letters.map((letter) => formatLetter(letter, undefined, true))
    );

    const totalPages = Math.ceil(total / limit);

    return {
      letters: formattedLetters,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    logger.error(`Error fetching moderation queue: ${error}`);
    throw error;
  }
}

/**
 * 9. Approve Letter
 * PUT /api/admin/letters/:id/approve
 */
export async function approveLetter(letterId: string): Promise<FormattedLetter> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new NotFoundError("Letter not found");
    }

    const [updatedLetter] = await db
      .update(studentLetters)
      .set({
        status: "APPROVED",
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentLetters.id, letterId))
      .returning();

    logger.info(`Letter approved: ${letterId}`);

    return formatLetter(updatedLetter, undefined, true);
  } catch (error) {
    logger.error(`Error approving letter: ${error}`);
    throw error;
  }
}

/**
 * 10. Reject Letter
 * PUT /api/admin/letters/:id/reject
 */
export async function rejectLetter(
  letterId: string,
  rejectionReason: string
): Promise<FormattedLetter> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new NotFoundError("Letter not found");
    }

    const [updatedLetter] = await db
      .update(studentLetters)
      .set({
        status: "REJECTED",
        isPublished: false,
        updatedAt: new Date(),
      })
      .where(eq(studentLetters.id, letterId))
      .returning();

    logger.info(`Letter rejected: ${letterId} - Reason: ${rejectionReason}`);

    return formatLetter(updatedLetter, undefined, true);
  } catch (error) {
    logger.error(`Error rejecting letter: ${error}`);
    throw error;
  }
}

/**
 * 11. Delete Letter (Admin)
 * DELETE /api/admin/letters/:id
 */
export async function deleteLetter(letterId: string): Promise<void> {
  try {
    const letter = await db.query.studentLetters.findFirst({
      where: eq(studentLetters.id, letterId),
    });

    if (!letter) {
      throw new NotFoundError("Letter not found");
    }

    // Soft delete
    await db
      .update(studentLetters)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentLetters.id, letterId));

    logger.info(`Letter deleted: ${letterId}`);
  } catch (error) {
    logger.error(`Error deleting letter: ${error}`);
    throw error;
  }
}

/**
 * 12. Get Letter Stats (Admin)
 * GET /api/admin/letters/stats
 */
export async function getLetterStats(): Promise<{
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalLikes: number;
  totalViews: number;
  avgViewsPerLetter: number;
  avgLikesPerLetter: number;
}> {
  try {
    const stats = await db
      .select({
        total: count(),
        approved: sql<number>`COUNT(CASE WHEN ${studentLetters.status} = 'APPROVED' THEN 1 END)`,
        pending: sql<number>`COUNT(CASE WHEN ${studentLetters.status} = 'PENDING' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN ${studentLetters.status} = 'REJECTED' THEN 1 END)`,
        totalLikes: sql<number>`COALESCE(SUM(${studentLetters.acknowledgementCount}), 0)`,
        totalViews: sql<number>`COALESCE(SUM(${studentLetters.viewCount}), 0)`,
        avgLikes: sql<number>`COALESCE(AVG(NULLIF(${studentLetters.acknowledgementCount}, 0)), 0)`,
        avgViews: sql<number>`COALESCE(AVG(NULLIF(${studentLetters.viewCount}, 0)), 0)`,
      })
      .from(studentLetters);

    const data = stats[0];

    return {
      total: data.total,
      approved: Number(data.approved) || 0,
      pending: Number(data.pending) || 0,
      rejected: Number(data.rejected) || 0,
      totalLikes: Number(data.totalLikes) || 0,
      totalViews: Number(data.totalViews) || 0,
      avgViewsPerLetter:
        Number(data.avgViews) || 0,
      avgLikesPerLetter:
        Number(data.avgLikes) || 0,
    };
  } catch (error) {
    logger.error(`Error fetching letter stats: ${error}`);
    throw error;
  }
}
