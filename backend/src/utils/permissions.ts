import { db } from "../db/index.js";
import { users, roles, rolePermissions, permissions } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger.js";

/**
 * Get all permissions for a user by userId
 * Fetches user's role and all permissions assigned to that role
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        role: {
          with: {
            rolePermissions: {
              with: {
                permission: {
                  columns: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.role || !user.role.rolePermissions) {
      logger.debug(`No permissions found for user ${userId}`);
      return [];
    }

    // Extract permission names from the nested structure
    const permissionNames = user.role.rolePermissions
      .map((rp) => rp.permission?.name)
      .filter((name): name is string => name !== undefined);

    return permissionNames;
  } catch (error) {
    logger.error(`Error fetching permissions for user ${userId}:`, undefined, error as Error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 * @param userId - User ID to check
 * @param requiredPermission - Permission name (e.g., "users.create")
 * @returns boolean
 */
export async function userHasPermission(
  userId: string,
  requiredPermission: string
): Promise<boolean> {
  try {
    const userPerms = await getUserPermissions(userId);
    return userPerms.includes(requiredPermission);
  } catch (error) {
    logger.error(
      `Error checking permission "${requiredPermission}" for user ${userId}:`,
      undefined,
      error as Error
    );
    return false;
  }
}

/**
 * Check if user has ANY of the given permissions
 * @param userId - User ID
 * @param permissions - Array of permission names
 * @returns boolean
 */
export async function userHasAnyPermission(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  try {
    if (permissions.length === 0) return false;
    const userPerms = await getUserPermissions(userId);
    return permissions.some((perm) => userPerms.includes(perm));
  } catch (error) {
    logger.error(
      `Error checking any permissions for user ${userId}:`,
      undefined,
      error as Error
    );
    return false;
  }
}

/**
 * Check if user has ALL of the given permissions
 * @param userId - User ID
 * @param permissions - Array of permission names
 * @returns boolean
 */
export async function userHasAllPermissions(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  try {
    if (permissions.length === 0) return true;
    const userPerms = await getUserPermissions(userId);
    return permissions.every((perm) => userPerms.includes(perm));
  } catch (error) {
    logger.error(
      `Error checking all permissions for user ${userId}:`,
      undefined,
      error as Error
    );
    return false;
  }
}

/**
 * Get all roles with their permissions (for admin purposes)
 */
export async function getAllRolesWithPermissions() {
  try {
    const allRoles = await db.query.roles.findMany({
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
        users: {
          columns: { id: true },
        },
      },
    });

    return allRoles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        module: rp.permission.module,
        description: rp.permission.description,
      })),
      userCount: role.users.length,
      createdAt: role.createdAt,
    }));
  } catch (error) {
    logger.error("Error fetching all roles with permissions:", undefined, error as Error);
    return [];
  }
}

/**
 * Get single role with permissions by role ID
 */
export async function getRoleWithPermissions(roleId: number) {
  try {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
        users: {
          columns: { id: true },
        },
      },
    });

    if (!role) {
      return null;
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        module: rp.permission.module,
        description: rp.permission.description,
      })),
      userCount: role.users.length,
      createdAt: role.createdAt,
    };
  } catch (error) {
    logger.error(`Error fetching role ${roleId} with permissions:`, undefined, error as Error);
    return null;
  }
}

/**
 * Get all permissions, optionally filtered by module
 */
export async function getAllPermissions(module?: string) {
  try {
    const query =
      module && module !== "all"
        ? db.query.permissions.findMany({
            where: eq(permissions.module, module),
          })
        : db.query.permissions.findMany();

    return query;
  } catch (error) {
    logger.error("Error fetching permissions:", undefined, error as Error);
    return [];
  }
}

/**
 * Check if role exists
 */
export async function roleExists(roleId: number): Promise<boolean> {
  try {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      columns: { id: true },
    });
    return !!role;
  } catch (error) {
    logger.error(`Error checking if role ${roleId} exists:`, undefined, error as Error);
    return false;
  }
}

/**
 * Check if permission exists
 */
export async function permissionExists(permissionId: number): Promise<boolean> {
  try {
    const perm = await db.query.permissions.findFirst({
      where: eq(permissions.id, permissionId),
      columns: { id: true },
    });
    return !!perm;
  } catch (error) {
    logger.error(`Error checking if permission ${permissionId} exists:`, undefined, error as Error);
    return false;
  }
}

/**
 * Check if role has permission
 */
export async function roleHasPermission(
  roleId: number,
  permissionId: number
): Promise<boolean> {
  try {
    const result = await db.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ),
      columns: { id: true },
    });
    return !!result;
  } catch (error) {
    logger.error(
      `Error checking if role ${roleId} has permission ${permissionId}:`,
      undefined,
      error as Error
    );
    return false;
  }
}
