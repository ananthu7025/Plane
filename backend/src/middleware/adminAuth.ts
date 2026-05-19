import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

/**
 * Admin role middleware
 * Must be used after authMiddleware
 * Checks that the authenticated user has ADMIN role
 */
export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      throw new UnauthorizedError("Missing authentication");
    }

    // Fetch user with role information
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { role: true },
    });

    if (!user) {
      logger.warn(`Admin middleware: User not found (${userId})`);
      throw new UnauthorizedError("User not found");
    }

    if (user.role?.name !== "ADMIN") {
      logger.warn(`Admin access denied for user ${userId} with role ${user.role?.name}`);
      throw new ForbiddenError("Admin access required");
    }

    // Attach user data to request for downstream use
    (req as any).user = user;
    next();
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
}
