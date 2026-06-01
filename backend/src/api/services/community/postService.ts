import { db } from "../../../db/index.js";
import { communityPosts, userProfiles, postLikes } from "../../../db/schema.js";
import { eq, desc, ilike, and, isNull } from "drizzle-orm";
import { PostNotFoundError, UserBannedError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import type { CreatePostInput, UpdatePostInput, PaginatedResponse } from "../../../types/community.js";

/**
 * Helper: Enrich post with isLiked status for current user
 */
async function enrichPostWithLikeStatus(post: any, userId?: string): Promise<any> {
  if (!userId) {
    return { ...post, isLiked: false };
  }

  const likeRecord = await db.query.postLikes.findFirst({
    where: and(eq(postLikes.postId, post.id), eq(postLikes.userId, userId)),
  });

  return { ...post, isLiked: !!likeRecord };
}

/**
 * Helper: Enrich multiple posts with like status
 */
async function enrichPostsWithLikeStatus(posts: any[], userId?: string): Promise<any[]> {
  if (!userId) {
    return posts.map((post) => ({ ...post, isLiked: false }));
  }

  return Promise.all(posts.map((post) => enrichPostWithLikeStatus(post, userId)));
}

/**
 * Create a post
 */
export async function createPost(
  userId: string,
  data: CreatePostInput
): Promise<any> {
  try {
    const [post] = await db
      .insert(communityPosts)
      .values({
        authorId: userId,
        title: data.title,
        content: data.content,
        categoryId: data.categoryId,
        status: "PENDING",
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Post created", "APP", { postId: post.id, userId });
    return post;
  } catch (error) {
    logger.error("Failed to create post", undefined, error instanceof Error ? error : undefined);
    throw new PostNotFoundError("Failed to create post");
  }
}

/**
 * Get all posts (feed)
 */
export async function getPostFeed(
  page: number = 1,
  limit: number = 20,
  categoryId?: number,
  search?: string,
  currentUserId?: string
): Promise<PaginatedResponse<any>> {
  const limit_safe = Math.min(limit, 50);
  const offset = (page - 1) * limit_safe;

  try {
    const conditions = [
      eq(communityPosts.status, "APPROVED"),
      isNull(communityPosts.deletedAt),
    ];

    if (categoryId) {
      conditions.push(eq(communityPosts.categoryId, categoryId));
    }

    if (search) {
      conditions.push(ilike(communityPosts.title, `%${search}%`));
    }

    const [items, countResult] = await Promise.all([
      db.query.communityPosts.findMany({
        where: and(...conditions),
        orderBy: desc(communityPosts.createdAt),
        limit: limit_safe,
        offset,
        with: {
          category: {
            columns: {
              id: true,
              name: true,
            },
          },
          author: {
            columns: {
              id: true,
              email: true,
            },
          },
        },
      }),
      db.select().from(communityPosts).where(and(...conditions)),
    ]);

    // Enrich items with author names from userProfiles AND like status
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let enriched: any = item;

        if (item.author?.id) {
          const authorProfile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, item.author.id),
            columns: { fullName: true },
          });
          enriched = {
            ...item,
            author: {
              ...item.author,
              name: authorProfile?.fullName || "Unknown",
            } as any,
          };
        }

        // Add isLiked status
        return enrichPostWithLikeStatus(enriched, currentUserId);
      })
    );

    return {
      items: enrichedItems,
      pagination: {
        page,
        limit: limit_safe,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit_safe),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch post feed", undefined, error instanceof Error ? error : undefined);
    throw new PostNotFoundError("Failed to fetch posts");
  }
}

/**
 * Get post by ID
 */
export async function getPostById(id: string, currentUserId?: string): Promise<any> {
  try {
    const post = await db.query.communityPosts.findFirst({
      where: eq(communityPosts.id, id),
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            description: true,
          },
        },
        author: {
          columns: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!post || post.deletedAt) {
      throw new PostNotFoundError("Post not found");
    }

    // Fetch author profile for display name and enrich post data
    let enriched: any = post;
    if (post.author?.id) {
      const authorProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, post.author.id),
        columns: { fullName: true },
      });
      // Return enriched post with author name
      enriched = {
        ...post,
        author: {
          ...post.author,
          name: authorProfile?.fullName || "Unknown",
        } as any,
      };
    }

    // Add isLiked status
    return enrichPostWithLikeStatus(enriched, currentUserId);
  } catch (error) {
    if (error instanceof PostNotFoundError) throw error;
    logger.error("Failed to fetch post", undefined, error instanceof Error ? error : undefined);
    throw new PostNotFoundError("Failed to fetch post");
  }
}

/**
 * Update post
 */
export async function updatePost(
  id: string,
  userId: string,
  data: UpdatePostInput
): Promise<any> {
  try {
    const post = await getPostById(id);

    if (post.authorId !== userId) {
      throw new UserBannedError("You can only update your own posts");
    }

    const updated = await db
      .update(communityPosts)
      .set({
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, id))
      .returning();

    logger.info("Post updated", "APP", { postId: id, userId });
    return updated[0];
  } catch (error) {
    if (error instanceof PostNotFoundError || error instanceof UserBannedError) throw error;
    logger.error("Failed to update post", undefined, error instanceof Error ? error : undefined);
    throw new PostNotFoundError("Failed to update post");
  }
}

/**
 * Delete post (soft delete)
 */
export async function deletePost(id: string, userId: string): Promise<void> {
  try {
    const post = await getPostById(id);

    if (post.authorId !== userId) {
      throw new UserBannedError("You can only delete your own posts");
    }

    await db
      .update(communityPosts)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, id));

    logger.info("Post deleted", "APP", { postId: id, userId });
  } catch (error) {
    if (error instanceof PostNotFoundError || error instanceof UserBannedError) throw error;
    logger.error("Failed to delete post", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Increment view count
 */
export async function incrementViewCount(id: string): Promise<void> {
  try {
    const post = await getPostById(id);

    await db
      .update(communityPosts)
      .set({
        viewCount: (post.viewCount || 0) + 1,
      })
      .where(eq(communityPosts.id, id));
  } catch (error) {
    logger.error("Failed to increment view count", undefined, error instanceof Error ? error : undefined);
  }
}

/**
 * Get user's own posts
 */
export async function getMyPosts(
  userId: string,
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<PaginatedResponse<any>> {
  const limit_safe = Math.min(limit, 50);
  const offset = (page - 1) * limit_safe;

  try {
    const conditions = [eq(communityPosts.authorId, userId), isNull(communityPosts.deletedAt)];

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      conditions.push(eq(communityPosts.status, status as any));
    }

    const [items, countResult] = await Promise.all([
      db.query.communityPosts.findMany({
        where: and(...conditions),
        orderBy: desc(communityPosts.createdAt),
        limit: limit_safe,
        offset,
        with: {
          category: {
            columns: {
              id: true,
              name: true,
            },
          },
          author: {
            columns: {
              id: true,
              email: true,
            },
          },
        },
      }),
      db.select().from(communityPosts).where(and(...conditions)),
    ]);

    // Enrich items with author names from userProfiles
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        if (item.author?.id) {
          const authorProfile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, item.author.id),
            columns: { fullName: true },
          });
          return {
            ...item,
            author: {
              ...item.author,
              name: authorProfile?.fullName || "Unknown",
            },
          };
        }
        return item;
      })
    );

    return {
      items: enrichedItems,
      pagination: {
        page,
        limit: limit_safe,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit_safe),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch user posts", undefined, error instanceof Error ? error : undefined);
    throw new PostNotFoundError("Failed to fetch your posts");
  }
}

/**
 * Get posts for moderation (admin)
 */
export async function getModerationPosts(
  page: number = 1,
  limit: number = 20,
  search?: string,
  status?: string,
  categoryId?: number
): Promise<PaginatedResponse<any>> {
  const limit_safe = Math.min(limit, 50);
  const offset = (page - 1) * limit_safe;

  try {
    const conditions = [isNull(communityPosts.deletedAt)];

    if (status && ["PENDING", "APPROVED", "REJECTED", "FLAGGED"].includes(status)) {
      conditions.push(eq(communityPosts.status, status as any));
    }

    if (search) {
      conditions.push(ilike(communityPosts.title, `%${search}%`));
    }

    if (categoryId) {
      conditions.push(eq(communityPosts.categoryId, categoryId));
    }

    const [items, countResult] = await Promise.all([
      db.query.communityPosts.findMany({
        where: and(...conditions),
        orderBy: desc(communityPosts.createdAt),
        limit: limit_safe,
        offset,
        with: {
          category: {
            columns: {
              id: true,
              name: true,
            },
          },
          author: {
            columns: {
              id: true,
              email: true,
            },
          },
        },
      }),
      db.select().from(communityPosts).where(and(...conditions)),
    ]);

    // Enrich items with author names from userProfiles
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        if (item.author?.id) {
          const authorProfile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, item.author.id),
            columns: { fullName: true },
          });
          return {
            ...item,
            author: {
              ...item.author,
              name: authorProfile?.fullName || "Unknown",
            },
          };
        }
        return item;
      })
    );

    return {
      items: enrichedItems,
      pagination: {
        page,
        limit: limit_safe,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / limit_safe),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch moderation posts", undefined, error instanceof Error ? error : undefined);
    throw new PostNotFoundError("Failed to fetch posts for moderation");
  }
}

/**
 * Admin delete post (hard delete)
 */
export async function adminDeletePost(id: string): Promise<void> {
  try {
    const post = await getPostById(id);

    await db
      .update(communityPosts)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, id));

    logger.info("Post deleted by admin", "APP", { postId: id });
  } catch (error) {
    if (error instanceof PostNotFoundError) throw error;
    logger.error("Failed to delete post", undefined, error instanceof Error ? error : undefined);
    throw error;
  }
}
