import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import config from "../config/index.js";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per time window
  message?: string;
}

interface UserRateLimit {
  count: number;
  resetTime: number;
}

// Community rate limit time windows (centralized)
const RATE_LIMIT_WINDOWS = {
  HOUR: 60 * 60 * 1000, // 1 hour (for posts, replies, likes)
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes (for cleanup routine)
};

// Store for tracking rate limits (in production, use Redis)
const rateLimitStore = new Map<string, Map<string, UserRateLimit>>();

/**
 * Create a community-specific rate limiter
 * Tracks requests per user per endpoint type
 */
export function communityRateLimit(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;

      // Skip rate limiting for non-authenticated endpoints
      if (!userId) {
        return next();
      }

      // Determine endpoint type
      let endpointType = "general";
      const path = req.path;
      const method = req.method;

      if (method === "POST" && path.includes("/posts") && !path.includes("/like")) {
        endpointType = "create-post";
      } else if (method === "POST" && path.includes("/replies")) {
        endpointType = "create-reply";
      } else if ((method === "PUT" || method === "POST") && path.includes("/like")) {
        endpointType = "like";
      }

      // Get or create store for this endpoint type
      if (!rateLimitStore.has(endpointType)) {
        rateLimitStore.set(endpointType, new Map());
      }

      const endpointStore = rateLimitStore.get(endpointType)!;
      const key = `${userId}-${endpointType}`;
      const now = Date.now();

      // Get or create rate limit entry
      let userLimit = endpointStore.get(key);

      // Reset if window expired
      if (!userLimit || now > userLimit.resetTime) {
        userLimit = {
          count: 0,
          resetTime: now + config.windowMs,
        };
        endpointStore.set(key, userLimit);
      }

      // Check if limit exceeded
      if (userLimit.count >= config.maxRequests) {
        const resetIn = Math.ceil((userLimit.resetTime - now) / 1000);
        const errorMessage =
          config.message ||
          `Too many ${endpointType} requests. Please try again in ${resetIn} seconds.`;

        logger.warn(
          `Rate limit exceeded for user ${userId} on ${endpointType}`,
          "RATE_LIMIT"
        );

        return res.status(429).json({
          success: false,
          data: null,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: errorMessage,
            retryAfter: resetIn,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Increment counter
      userLimit.count++;

      // Add retry-after header
      res.set("Retry-After", String(Math.ceil((userLimit.resetTime - now) / 1000)));

      next();
    } catch (error) {
      logger.error(
        "Error in community rate limit middleware",
        "RATE_LIMIT",
        error as Error
      );
      // Don't block requests if rate limiter fails
      next();
    }
  };
}

/**
 * Rate limit config presets for different endpoints
 * Time windows centralized from RATE_LIMIT_WINDOWS
 */
export const rateLimitPresets = {
  // 10 posts per hour
  createPost: {
    windowMs: RATE_LIMIT_WINDOWS.HOUR,
    maxRequests: 10,
    message: "You can only create 10 posts per hour",
  },
  // 30 replies per hour
  createReply: {
    windowMs: RATE_LIMIT_WINDOWS.HOUR,
    maxRequests: 30,
    message: "You can only create 30 replies per hour",
  },
  // 100 likes per hour
  likeContent: {
    windowMs: RATE_LIMIT_WINDOWS.HOUR,
    maxRequests: 100,
    message: "You can only like 100 items per hour",
  },
};

/**
 * Cleanup old entries periodically (from RATE_LIMIT_WINDOWS.CLEANUP_INTERVAL)
 */
export function startRateLimitCleanup() {
  setInterval(() => {
    const now = Date.now();

    for (const [endpointType, store] of rateLimitStore.entries()) {
      for (const [key, userLimit] of store.entries()) {
        // Remove expired entries
        if (now > userLimit.resetTime + 60000) {
          store.delete(key);
        }
      }

      // Remove empty stores
      if (store.size === 0) {
        rateLimitStore.delete(endpointType);
      }
    }
  }, RATE_LIMIT_WINDOWS.CLEANUP_INTERVAL);
}

/**
 * Get rate limit stats for monitoring
 */
export function getRateLimitStats() {
  const stats: Record<string, number> = {};

  for (const [endpointType, store] of rateLimitStore.entries()) {
    stats[endpointType] = store.size;
  }

  return {
    endpoints: Object.keys(stats),
    activeUsers: Object.values(stats).reduce((a, b) => a + b, 0),
    stores: stats,
  };
}
