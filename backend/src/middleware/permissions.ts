import { Request, Response, NextFunction } from "express";
import {
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
  getUserPermissions,
} from "../utils/permissions.js";
import { ForbiddenError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

// Note: Express Request interface is extended in src/types/request.ts
// This middleware adds no additional fields beyond what's already defined

/**
 * Middleware to check if user has one of the required roles
 * Usage: router.post("/endpoint", authMiddleware, permissionMiddleware(["ADMIN"]), handler)
 */
export function permissionMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.roleName) {
        throw new ForbiddenError(
          "User role not found",
          "UNAUTHORIZED"
        );
      }

      if (!allowedRoles.includes(req.roleName)) {
        logger.warn(
          `User ${req.userId} with role ${req.roleName} denied access`
        );
        throw new ForbiddenError(
          `Insufficient role. Required: ${allowedRoles.join(", ")}`,
          "INSUFFICIENT_ROLE"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has a specific permission
 * Usage: router.post("/endpoint", authMiddleware, requirePermission("users.create"), handler)
 * Fast path: uses JWT-cached permissions if available, falls back to DB query
 */
export function requirePermission(requiredPermission: string) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ForbiddenError(
          "User not authenticated",
          "UNAUTHORIZED"
        );
      }

      let hasPermission: boolean;

      // Fast path: use JWT-cached permissions if available
      if (req.userPermissions !== undefined) {
        hasPermission = req.userPermissions.includes(requiredPermission);
      } else {
        // Fallback: fetch from DB
        hasPermission = await userHasPermission(
          req.userId,
          requiredPermission
        );
      }

      if (!hasPermission) {
        logger.warn(
          `User ${req.userId} denied access to ${requiredPermission}`
        );
        throw new ForbiddenError(
          `Missing permission: ${requiredPermission}`,
          "INSUFFICIENT_PERMISSION"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has ANY of the given permissions
 * Usage: router.get("/endpoint", authMiddleware, requireAnyPermission(["users.create", "users.admin"]), handler)
 * Fast path: uses JWT-cached permissions if available, falls back to DB query
 */
export function requireAnyPermission(permissions: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ForbiddenError(
          "User not authenticated",
          "UNAUTHORIZED"
        );
      }

      let hasAny: boolean;

      // Fast path: use JWT-cached permissions if available
      if (req.userPermissions !== undefined) {
        hasAny = permissions.some((p) => req.userPermissions!.includes(p));
      } else {
        // Fallback: fetch from DB
        hasAny = await userHasAnyPermission(req.userId, permissions);
      }

      if (!hasAny) {
        logger.warn(
          `User ${req.userId} denied access - missing one of: ${permissions.join(", ")}`
        );
        throw new ForbiddenError(
          `Missing one of required permissions: ${permissions.join(", ")}`,
          "INSUFFICIENT_PERMISSION"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has ALL of the given permissions
 * Usage: router.delete("/endpoint", authMiddleware, requireAllPermissions(["users.delete", "users.ban"]), handler)
 * Fast path: uses JWT-cached permissions if available, falls back to DB query
 */
export function requireAllPermissions(permissions: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ForbiddenError(
          "User not authenticated",
          "UNAUTHORIZED"
        );
      }

      let hasAll: boolean;

      // Fast path: use JWT-cached permissions if available
      if (req.userPermissions !== undefined) {
        hasAll = permissions.every((p) => req.userPermissions!.includes(p));
      } else {
        // Fallback: fetch from DB
        hasAll = await userHasAllPermissions(req.userId, permissions);
      }

      if (!hasAll) {
        logger.warn(
          `User ${req.userId} denied access - missing all of: ${permissions.join(", ")}`
        );
        throw new ForbiddenError(
          `Missing all required permissions: ${permissions.join(", ")}`,
          "INSUFFICIENT_PERMISSION"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to attach user's permissions to request for later use
 * Usage: router.get("/endpoint", authMiddleware, attachUserPermissions, handler)
 * Then in handler: req.userPermissions will be available
 */
export async function attachUserPermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.userId) {
      req.userPermissions = [];
      return next();
    }

    const perms = await getUserPermissions(req.userId);
    req.userPermissions = perms;
    next();
  } catch (error) {
    logger.error("Error attaching user permissions:", undefined, error as Error);
    req.userPermissions = [];
    next();
  }
}
