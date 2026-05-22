import { db } from "../../db/index.js";
import { roles, permissions, rolePermissions, users } from "../../db/schema.js";
import { eq, and, ilike, sql, count, desc } from "drizzle-orm";
import { NotFoundError, AppError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";

/**
 * Get all roles with their permissions and user counts
 */
export async function getAllRoles() {
  try {
    const allRoles = await db.query.roles.findMany({
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
    });

    // Get user counts for each role
    const userCountsByRole = await db
      .select({
        roleId: users.roleId,
        userCount: count(users.id),
      })
      .from(users)
      .groupBy(users.roleId);

    const userCountMap = Object.fromEntries(
      userCountsByRole.map((row) => [row.roleId, row.userCount])
    );

    return allRoles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
      })),
      userCount: userCountMap[role.id] || 0,
      createdAt: role.createdAt,
    }));
  } catch (error) {
    logger.error("Failed to get all roles", "ROLES_SERVICE", error as Error);
    throw new AppError(500, "ROLES_FETCH_ERROR", "Failed to fetch roles");
  }
}

/**
 * Get single role by ID with permissions
 */
export async function getRoleById(roleId: number) {
  try {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    // Get user count for this role
    const userCountResult = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(eq(users.roleId, roleId));

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        module: rp.permission.module,
      })),
      userCount: userCountResult[0]?.count || 0,
      createdAt: role.createdAt,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to get role ${roleId}`, "ROLES_SERVICE", error as Error);
    throw new AppError(500, "ROLE_FETCH_ERROR", "Failed to fetch role");
  }
}

/**
 * Get all permissions with optional filtering and pagination
 */
export async function getAllPermissions(filters: {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
}) {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const whereConditions = [];

    if (filters.search) {
      whereConditions.push(ilike(permissions.name, `%${filters.search}%`));
    }

    if (filters.module) {
      whereConditions.push(eq(permissions.module, filters.module));
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const allPermissions = await db
      .select()
      .from(permissions)
      .where(where)
      .orderBy(desc(permissions.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count(permissions.id) })
      .from(permissions)
      .where(where);

    const total = totalResult[0]?.count || 0;

    return {
      permissions: allPermissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    logger.error("Failed to get permissions", "ROLES_SERVICE", error as Error);
    throw new AppError(500, "PERMISSIONS_FETCH_ERROR", "Failed to fetch permissions");
  }
}

/**
 * Create a new permission
 */
export async function createPermission(data: {
  name: string;
  description?: string;
  module: string;
}) {
  try {
    // Check if permission already exists
    const existing = await db.query.permissions.findFirst({
      where: eq(permissions.name, data.name),
    });

    if (existing) {
      throw new AppError(400, "PERMISSION_EXISTS", "Permission with this name already exists");
    }

    const result = await db
      .insert(permissions)
      .values({
        name: data.name,
        description: data.description || null,
        module: data.module,
        createdAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Failed to create permission", "ROLES_SERVICE", error as Error);
    throw new AppError(500, "PERMISSION_CREATE_ERROR", "Failed to create permission");
  }
}

/**
 * Update a permission
 */
export async function updatePermission(
  permissionId: number,
  data: {
    name?: string;
    description?: string;
    module?: string;
  }
) {
  try {
    // Check if permission exists
    const existing = await db.query.permissions.findFirst({
      where: eq(permissions.id, permissionId),
    });

    if (!existing) {
      throw new NotFoundError("Permission not found");
    }

    // Check if new name already exists (if updating name)
    if (data.name && data.name !== existing.name) {
      const duplicate = await db.query.permissions.findFirst({
        where: eq(permissions.name, data.name),
      });

      if (duplicate) {
        throw new AppError(400, "PERMISSION_EXISTS", "Permission with this name already exists");
      }
    }

    const result = await db
      .update(permissions)
      .set({
        name: data.name || existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        module: data.module || existing.module,
      })
      .where(eq(permissions.id, permissionId))
      .returning();

    return result[0];
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
    logger.error(`Failed to update permission ${permissionId}`, "ROLES_SERVICE", error as Error);
    throw new AppError(500, "PERMISSION_UPDATE_ERROR", "Failed to update permission");
  }
}

/**
 * Delete a permission
 * Note: rolePermissions rows will be cascade deleted by FK constraint
 */
export async function deletePermission(permissionId: number) {
  try {
    // Check if permission exists
    const existing = await db.query.permissions.findFirst({
      where: eq(permissions.id, permissionId),
    });

    if (!existing) {
      throw new NotFoundError("Permission not found");
    }

    await db.delete(permissions).where(eq(permissions.id, permissionId));

    return { message: "Permission deleted successfully" };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to delete permission ${permissionId}`, "ROLES_SERVICE", error as Error);
    throw new AppError(500, "PERMISSION_DELETE_ERROR", "Failed to delete permission");
  }
}

/**
 * Assign permission to role
 */
export async function assignPermissionToRole(roleId: number, permissionId: number) {
  try {
    // Verify role exists
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    // Verify permission exists
    const perm = await db.query.permissions.findFirst({
      where: eq(permissions.id, permissionId),
    });

    if (!perm) {
      throw new NotFoundError("Permission not found");
    }

    // Check if assignment already exists
    const existing = await db.query.rolePermissions.findFirst({
      where: and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)),
    });

    if (existing) {
      throw new AppError(400, "PERMISSION_ALREADY_ASSIGNED", "Permission already assigned to this role");
    }

    const result = await db
      .insert(rolePermissions)
      .values({
        roleId,
        permissionId,
        createdAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) throw error;
    logger.error(`Failed to assign permission ${permissionId} to role ${roleId}`, "ROLES_SERVICE", error as Error);
    throw new AppError(500, "PERMISSION_ASSIGN_ERROR", "Failed to assign permission to role");
  }
}

/**
 * Remove permission from role
 */
export async function removePermissionFromRole(roleId: number, permissionId: number) {
  try {
    // Verify role exists
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    // Verify permission exists
    const perm = await db.query.permissions.findFirst({
      where: eq(permissions.id, permissionId),
    });

    if (!perm) {
      throw new NotFoundError("Permission not found");
    }

    // Check if assignment exists
    const existing = await db.query.rolePermissions.findFirst({
      where: and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)),
    });

    if (!existing) {
      throw new NotFoundError("Permission not assigned to this role");
    }

    await db
      .delete(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)));

    return { message: "Permission removed from role successfully" };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to remove permission ${permissionId} from role ${roleId}`, "ROLES_SERVICE", error as Error);
    throw new AppError(500, "PERMISSION_REMOVE_ERROR", "Failed to remove permission from role");
  }
}

/**
 * Update a user's role
 */
export async function updateUserRole(userId: string, newRole: string) {
  try {
    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get the role ID for the new role name
    const roleRecord = await db.query.roles.findFirst({
      where: eq(roles.name, newRole),
    });

    if (!roleRecord) {
      throw new NotFoundError(`Role '${newRole}' not found`);
    }

    const result = await db
      .update(users)
      .set({
        roleId: roleRecord.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return result[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`Failed to update role for user ${userId}`, "ROLES_SERVICE", error as Error);
    throw new AppError(500, "USER_ROLE_UPDATE_ERROR", "Failed to update user role");
  }
}

/**
 * Create a new role
 */
export async function createRole(name: string, description?: string) {
  try {
    // Check if role name already exists
    const existingRoles = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);

    if (existingRoles.length > 0) {
      throw new AppError(409, "ROLE_EXISTS", "Role with this name already exists");
    }

    const result = await db
      .insert(roles)
      .values({
        name,
        description: description || null,
        createdAt: new Date(),
      })
      .returning();

    return {
      id: result[0].id,
      name: result[0].name,
      description: result[0].description,
      permissions: [],
      userCount: 0,
      createdAt: result[0].createdAt,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(`Failed to create role "${name}"`, "ROLES_SERVICE", error as Error);
    throw new AppError(500, "ROLE_CREATE_ERROR", "Failed to create role");
  }
}

/**
 * Update an existing role
 */
export async function updateRole(
  roleId: number,
  name?: string,
  description?: string
) {
  try {
    const roleResult = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (roleResult.length === 0) {
      throw new NotFoundError("Role not found");
    }

    const role = roleResult[0];

    // If name is being changed, check if new name already exists
    if (name && name !== role.name) {
      const existingRoles = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);

      if (existingRoles.length > 0) {
        throw new AppError(409, "ROLE_EXISTS", "Role with this name already exists");
      }
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const result = await db
      .update(roles)
      .set(updateData)
      .where(eq(roles.id, roleId))
      .returning();

    // Return the updated role with its permissions
    return getRoleById(roleId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(`Failed to update role ${roleId}`, "ROLES_SERVICE", error as Error);
    throw new AppError(500, "ROLE_UPDATE_ERROR", "Failed to update role");
  }
}

/**
 * Delete a role
 * Note: Cannot delete a role that has users assigned to it
 */
export async function deleteRole(roleId: number) {
  try {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      with: {
        users: {
          columns: { id: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    // Prevent deletion if role has users
    if (role.users && role.users.length > 0) {
      throw new AppError(
        400,
        "ROLE_HAS_USERS",
        `Cannot delete role with ${role.users.length} assigned user(s). Reassign users first.`
      );
    }

    // Prevent deletion of default roles (optional safety check)
    if (["STUDENT", "MENTOR", "ADMIN"].includes(role.name)) {
      throw new AppError(
        400,
        "CANNOT_DELETE_DEFAULT_ROLE",
        "Cannot delete default system roles"
      );
    }

    // Delete role permissions first
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    // Delete the role
    await db.delete(roles).where(eq(roles.id, roleId));

    return roleId;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(`Failed to delete role ${roleId}`, "ROLES_SERVICE", error as Error);
    throw new AppError(500, "ROLE_DELETE_ERROR", "Failed to delete role");
  }
}
