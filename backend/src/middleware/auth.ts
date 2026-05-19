import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth.js";
import { UnauthorizedError } from "../utils/errors.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      token?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== "ACCESS") {
      throw new UnauthorizedError("Invalid or expired token");
    }

    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(error.statusCode).json({
        success: false,
        data: null,
        error: {
          code: error.code,
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(401).json({
        success: false,
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded && decoded.type === "ACCESS") {
        req.userId = decoded.userId;
        req.token = token;
      }
    }
    next();
  } catch {
    next();
  }
}
