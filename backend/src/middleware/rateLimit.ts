import { Request, Response, NextFunction } from "express";
import { createRateLimitStore, type RateLimitStore } from "./rateLimitStore.js";

const rateLimitStore = createRateLimitStore();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Default: 100 requests per minute

/**
 * Rate limiting middleware (production-ready)
 * Supports both in-memory (single server) and Redis (distributed)
 * Prevents abuse and DDoS attacks
 * For 5k users/day, this is sufficient
 */
export function rateLimit(
  options: {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (req: Request) => string;
  } = {}
) {
  const windowMs = options.windowMs || WINDOW_MS;
  const maxRequests = options.maxRequests || MAX_REQUESTS;
  const keyGenerator = options.keyGenerator || ((req: Request) => req.ip || "unknown");

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const count = await rateLimitStore.increment(key, windowMs);

      // Add headers
      const remaining = Math.max(0, maxRequests - count);
      const resetTime = Math.ceil((Date.now() + windowMs) / 1000);

      res.setHeader("RateLimit-Limit", maxRequests.toString());
      res.setHeader("RateLimit-Remaining", remaining.toString());
      res.setHeader("RateLimit-Reset", resetTime.toString());

      // Check if limit exceeded
      if (count > maxRequests) {
        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
            details: {
              retryAfter: Math.ceil(windowMs / 1000),
            },
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Rate limit error:", error);
      // On error, allow request (fail open to avoid blocking all traffic)
      next();
    }
  };
}

/**
 * Strict rate limiting for authentication endpoints
 * Prevents brute force attacks
 * 5 attempts per 15 minutes per email+IP combination
 */
export function authRateLimit(
  options: {
    windowMs?: number;
    maxRequests?: number;
  } = {}
) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    maxRequests: options.maxRequests || 5, // 5 attempts per 15 minutes
    keyGenerator: (req: Request) => {
      // Rate limit by IP + email (if provided) for better security
      const email = (req.body?.email || "unknown").toLowerCase();
      return `auth:${req.ip}:${email}`;
    },
  });
}

/**
 * Get rate limit stats (for monitoring/health checks)
 */
export async function getRateLimitStats() {
  try {
    const status = await rateLimitStore.getStatus();
    return {
      ...status,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting rate limit stats:", error);
    return {
      type: "unknown" as const,
      error: "Failed to get stats",
    };
  }
}
