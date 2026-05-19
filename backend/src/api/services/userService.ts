import { db } from "../../db/index.js";
import { users, userProfiles, roles } from "../../db/schema.js";
import { eq, and, ilike, inArray, desc, asc } from "drizzle-orm";
import { NotFoundError, AppError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";

/**
 * Get user profile by userId
 * Returns user + profile information
 */
export async function getUserProfile(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true, status: true, createdAt: true },
      with: { profile: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      profile: user.profile || {
        fullName: "Unknown",
        bio: null,
        phone: null,
        city: null,
        country: null,
        reputationScore: 0,
        verified: false,
        avatarMediaId: null,
      },
      createdAt: user.createdAt,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to get user profile for ${userId}`, "USER_SERVICE", error as Error);
    throw new AppError(500, "PROFILE_FETCH_ERROR", "Failed to fetch user profile");
  }
}

/**
 * Update user profile
 * Updates fields in userProfiles table
 */
export async function updateUserProfile(
  userId: string,
  data: {
    fullName?: string;
    bio?: string;
    phone?: string;
    city?: string;
    country?: string;
  }
) {
  try {
    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if profile exists
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    let updatedProfile;

    if (!existingProfile) {
      // Create profile if it doesn't exist
      updatedProfile = await db
        .insert(userProfiles)
        .values({
          userId,
          fullName: data.fullName || user.id,
          phone: data.phone,
          bio: data.bio,
          city: data.city,
          country: data.country,
        })
        .returning();
    } else {
      // Update existing profile
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.fullName) updateData.fullName = data.fullName;
      if (data.bio) updateData.bio = data.bio;
      if (data.phone) updateData.phone = data.phone;
      if (data.city) updateData.city = data.city;
      if (data.country) updateData.country = data.country;

      updatedProfile = await db
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.userId, userId))
        .returning();
    }

    const profile = updatedProfile[0];
    return {
      id: userId,
      email: user.email,
      fullName: profile.fullName,
      bio: profile.bio,
      phone: profile.phone,
      city: profile.city,
      country: profile.country,
      avatarMediaId: profile.avatarMediaId,
      reputationScore: profile.reputationScore,
      verified: profile.verified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to update profile for ${userId}`, "USER_SERVICE", error as Error);
    throw new AppError(500, "PROFILE_UPDATE_ERROR", "Failed to update user profile");
  }
}

/**
 * Get user by userId for public view
 * Returns only non-sensitive information
 */
export async function getPublicProfile(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, createdAt: true },
      with: { profile: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      fullName: user.profile?.fullName || "Anonymous",
      bio: user.profile?.bio,
      avatarMediaId: user.profile?.avatarMediaId,
      reputationScore: user.profile?.reputationScore || 0,
      joinedAt: user.createdAt,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to get public profile for ${userId}`, "USER_SERVICE", error as Error);
    throw new AppError(500, "PROFILE_FETCH_ERROR", "Failed to fetch user profile");
  }
}

/**
 * Admin: Get all users with pagination and filters
 */
export async function getAllUsers(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  role?: "STUDENT" | "MENTOR" | "ADMIN";
  sort: "createdAt" | "email" | "fullName";
  order: "asc" | "desc";
}) {
  try {
    const { page = 1, limit = 20, search, status, role, sort = "createdAt", order = "desc" } = filters;

    // Build where clause
    const whereConditions: any[] = [];

    if (status) {
      whereConditions.push(eq(users.status, status));
    }

    if (search) {
      whereConditions.push(
        ilike(users.email, `%${search}%`)
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Build sort column
    let sortColumn: any = users.createdAt;
    if (sort === "email") {
      sortColumn = users.email;
    } else if (sort === "fullName") {
      sortColumn = userProfiles.fullName;
    }

    const sortDirection = order === "asc" ? asc(sortColumn) : desc(sortColumn);

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch users
    const userList = await db.query.users.findMany({
      where: whereClause,
      with: {
        role: { columns: { name: true } },
        profile: {
          columns: {
            fullName: true,
            avatarMediaId: true,
            reputationScore: true,
          },
        },
      },
      columns: {
        id: true,
        email: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: sortDirection,
      limit: limit + 1, // Fetch one extra to check if there are more
      offset,
    });

    // Filter by role if specified
    let filteredUsers = userList;
    if (role) {
      filteredUsers = userList.filter((u) => u.role?.name === role);
    }

    // Check if there are more results
    const hasMore = filteredUsers.length > limit;
    if (hasMore) {
      filteredUsers = filteredUsers.slice(0, limit);
    }

    // Get total count (for pagination info)
    const allUsers = await db.query.users.findMany({
      where: whereClause,
      columns: { id: true },
    });

    return {
      users: filteredUsers.map((u) => ({
        id: u.id,
        email: u.email,
        status: u.status,
        role: u.role?.name || "STUDENT",
        fullName: u.profile?.fullName || "Unknown",
        avatarMediaId: u.profile?.avatarMediaId,
        reputationScore: u.profile?.reputationScore || 0,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: allUsers.length,
        hasMore,
        totalPages: Math.ceil(allUsers.length / limit),
      },
    };
  } catch (error) {
    logger.error("Failed to fetch all users", "USER_SERVICE", error as Error);
    throw new AppError(500, "USERS_FETCH_ERROR", "Failed to fetch users list");
  }
}

/**
 * Admin: Get single user by ID
 * Returns full user information including role
 */
export async function getUserById(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        role: { columns: { name: true } },
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role?.name || "STUDENT",
      profile: user.profile || {
        fullName: "Unknown",
        bio: null,
        phone: null,
        avatarMediaId: null,
        city: null,
        country: null,
        reputationScore: 0,
        verified: false,
      },
      lastLogin: user.lastLogin,
      lastIpAddress: user.lastIpAddress,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to get user ${userId}`, "USER_SERVICE", error as Error);
    throw new AppError(500, "USER_FETCH_ERROR", "Failed to fetch user");
  }
}

/**
 * Admin: Update user profile (any user)
 */
export async function updateUserProfileAdmin(
  userId: string,
  data: {
    fullName?: string;
    bio?: string;
    phone?: string;
    city?: string;
    country?: string;
  }
) {
  try {
    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if profile exists
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    let updatedProfile;

    if (!existingProfile) {
      updatedProfile = await db
        .insert(userProfiles)
        .values({
          userId,
          fullName: data.fullName || user.id,
          phone: data.phone,
          bio: data.bio,
          city: data.city,
          country: data.country,
        })
        .returning();
    } else {
      const updateData: any = { updatedAt: new Date() };

      if (data.fullName !== undefined) updateData.fullName = data.fullName;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.country !== undefined) updateData.country = data.country;

      updatedProfile = await db
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.userId, userId))
        .returning();
    }

    const profile = updatedProfile[0];
    return {
      id: userId,
      email: user.email,
      fullName: profile.fullName,
      bio: profile.bio,
      phone: profile.phone,
      city: profile.city,
      country: profile.country,
      avatarMediaId: profile.avatarMediaId,
      reputationScore: profile.reputationScore,
      verified: profile.verified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to admin update profile for ${userId}`, "USER_SERVICE", error as Error);
    throw new AppError(500, "PROFILE_UPDATE_ERROR", "Failed to update user profile");
  }
}

/**
 * Admin: Update user status (ACTIVE, INACTIVE, SUSPENDED)
 */
export async function updateUserStatus(userId: string, newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUsers = await db
      .update(users)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    logger.info(`User ${userId} status updated to ${newStatus}`);

    return {
      id: updatedUsers[0].id,
      email: updatedUsers[0].email,
      status: updatedUsers[0].status,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to update user ${userId} status`, "USER_SERVICE", error as Error);
    throw new AppError(500, "STATUS_UPDATE_ERROR", "Failed to update user status");
  }
}

/**
 * Admin: Delete a user (soft delete via status change to SUSPENDED or hard delete)
 * Note: This performs a hard delete of user and related data
 */
export async function deleteUser(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Delete user profile first
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));

    // Delete user record
    await db.delete(users).where(eq(users.id, userId));

    logger.info(`User ${userId} deleted successfully`);

    return {
      id: userId,
      email: user.email,
      message: "User deleted successfully",
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to delete user ${userId}`, "USER_SERVICE", error as Error);
    throw new AppError(500, "USER_DELETE_ERROR", "Failed to delete user");
  }
}
