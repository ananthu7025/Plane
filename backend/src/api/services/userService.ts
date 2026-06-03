import { db } from "../../db/index.js";
import { users, userProfiles, roles } from "../../db/schema.js";
import { eq, and, ilike, inArray, desc, asc } from "drizzle-orm";
import { NotFoundError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";

/**
 * Get user profile by userId
 * Returns user + profile information including academic fields
 */
export async function getUserProfile(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, email: true, status: true, createdAt: true },
    with: {
      profile: true,
      role: { columns: { name: true } },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  logger.info("User profile fetched", "APP", { userId });

  return {
    id: user.id,
    email: user.email,
    role: user.role?.name ?? "STUDENT",
    status: user.status,
    profile: {
      fullName: user.profile?.fullName ?? "Unknown",
      bio: user.profile?.bio ?? null,
      phone: user.profile?.phone ?? null,
      city: user.profile?.city ?? null,
      country: user.profile?.country ?? null,
      avatarMediaId: user.profile?.avatarMediaId ?? null,
      reputationScore: user.profile?.reputationScore ?? 0,
      verified: user.profile?.verified ?? false,
      qualification: user.profile?.qualification ?? null,
      institution: user.profile?.institution ?? null,
      careerGoal: user.profile?.careerGoal ?? null,
      targetExam: user.profile?.targetExam ?? null,
      enrolledSubjects: user.profile?.enrolledSubjects ?? [],
    },
    createdAt: user.createdAt,
  };
}

/**
 * Update user profile
 * Updates fields in userProfiles table including academic fields
 */
export async function updateUserProfile(
  userId: string,
  data: {
    fullName?: string;
    bio?: string;
    phone?: string;
    city?: string;
    country?: string;
    qualification?: string;
    institution?: string;
    careerGoal?: string;
    targetExam?: string;
    enrolledSubjects?: string[];
  }
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  let updatedProfile;

  if (!existingProfile) {
    updatedProfile = await db
      .insert(userProfiles)
      .values({
        userId,
        fullName: data.fullName ?? "Unknown",
        phone: data.phone,
        bio: data.bio,
        city: data.city,
        country: data.country,
        qualification: data.qualification,
        institution: data.institution,
        careerGoal: data.careerGoal,
        targetExam: data.targetExam,
        enrolledSubjects: data.enrolledSubjects,
      })
      .returning();
  } else {
    const updateData: Partial<typeof userProfiles.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.qualification !== undefined) updateData.qualification = data.qualification;
    if (data.institution !== undefined) updateData.institution = data.institution;
    if (data.careerGoal !== undefined) updateData.careerGoal = data.careerGoal;
    if (data.targetExam !== undefined) updateData.targetExam = data.targetExam;
    if (data.enrolledSubjects !== undefined) updateData.enrolledSubjects = data.enrolledSubjects;

    updatedProfile = await db
      .update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.userId, userId))
      .returning();
  }

  const profile = updatedProfile[0];
  logger.info("User profile updated", "APP", { userId });

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
    qualification: profile.qualification,
    institution: profile.institution,
    careerGoal: profile.careerGoal,
    targetExam: profile.targetExam,
    enrolledSubjects: profile.enrolledSubjects ?? [],
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * Get user by userId for public view
 * Returns only non-sensitive information
 */
export async function getPublicProfile(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, createdAt: true },
    with: { profile: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  logger.info("Public profile fetched", "APP", { userId });

  return {
    id: user.id,
    fullName: user.profile?.fullName || "Anonymous",
    bio: user.profile?.bio,
    avatarMediaId: user.profile?.avatarMediaId,
    reputationScore: user.profile?.reputationScore || 0,
    joinedAt: user.createdAt,
  };
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

  logger.info("All users fetched", "APP", { page, limit, total: allUsers.length });

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
}

/**
 * Admin: Get single user by ID
 * Returns full user information including role
 */
export async function getUserById(userId: string) {
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

  logger.info("User fetched by ID", "APP", { userId });

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
  logger.info("User profile updated by admin", "APP", { userId });

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
}

/**
 * Admin: Update user status (ACTIVE, INACTIVE, SUSPENDED)
 */
export async function updateUserStatus(userId: string, newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
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

  logger.info("User status updated", "APP", { userId, newStatus });

  return {
    id: updatedUsers[0].id,
    email: updatedUsers[0].email,
    status: updatedUsers[0].status,
  };
}

/**
 * Admin: Delete a user (soft delete via status change to SUSPENDED or hard delete)
 * Note: This performs a hard delete of user and related data
 */
export async function deleteUser(userId: string) {
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

  logger.info("User deleted", "APP", { userId, email: user.email });

  return {
    id: userId,
    email: user.email,
    message: "User deleted successfully",
  };
}
