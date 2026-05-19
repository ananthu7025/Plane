/**
 * Rate Limit Store Interface
 * Supports both in-memory and Redis backends
 * Allows seamless migration from single-server to distributed setup
 */

export interface RateLimitStore {
  /**
   * Increment counter for a key
   * Returns new count after increment
   */
  increment(key: string, windowMs: number): Promise<number>;

  /**
   * Get current count for a key
   */
  get(key: string): Promise<number>;

  /**
   * Reset counter for a key
   */
  reset(key: string): Promise<void>;

  /**
   * Get store status for monitoring
   */
  getStatus(): Promise<{
    type: "memory" | "redis";
    size?: number;
    connected?: boolean;
  }>;
}

/**
 * In-Memory Rate Limit Store
 * Single-server use only. Use Redis for distributed systems.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return 1;
    }

    entry.count++;
    return entry.count;
  }

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    if (entry.resetTime < Date.now()) {
      this.store.delete(key);
      return 0;
    }
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getStatus() {
    const now = Date.now();
    let activeEntries = 0;

    for (const [, value] of this.store) {
      if (value.resetTime > now) {
        activeEntries++;
      }
    }

    // Cleanup expired entries periodically
    if (Math.random() < 0.1) {
      const expiredKeys: string[] = [];
      for (const [key, value] of this.store) {
        if (value.resetTime < now) {
          expiredKeys.push(key);
        }
      }
      expiredKeys.forEach((key) => this.store.delete(key));
      if (expiredKeys.length > 0) {
        console.log(`🧹 Rate limit: Cleaned ${expiredKeys.length} expired entries`);
      }
    }

    return {
      type: "memory" as const,
      size: this.store.size,
    };
  }
}

/**
 * Redis Rate Limit Store
 * For distributed systems with multiple servers
 * Requires Redis to be running and accessible via REDIS_URL
 */
export class RedisRateLimitStore implements RateLimitStore {
  private client: any;
  private connected: boolean = false;

  constructor(redisClient: any) {
    this.client = redisClient;
    this.client.on("connect", () => {
      this.connected = true;
      console.log("✅ Redis rate limit store connected");
    });
    this.client.on("error", (err: Error) => {
      this.connected = false;
      console.error("❌ Redis connection error:", err.message);
    });
  }

  async increment(key: string, windowMs: number): Promise<number> {
    try {
      // Use Redis INCR with TTL
      const pipeline = this.client.pipeline();
      pipeline.incr(`rl:${key}`);
      pipeline.pexpire(`rl:${key}`, windowMs);
      const results = await pipeline.exec();
      return results[0][1]; // Return the incremented value
    } catch (error) {
      console.error("Redis increment error:", error);
      throw error;
    }
  }

  async get(key: string): Promise<number> {
    try {
      const value = await this.client.get(`rl:${key}`);
      return value ? parseInt(value) : 0;
    } catch (error) {
      console.error("Redis get error:", error);
      return 0;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.client.del(`rl:${key}`);
    } catch (error) {
      console.error("Redis reset error:", error);
    }
  }

  async getStatus() {
    try {
      const info = await this.client.dbsize();
      return {
        type: "redis" as const,
        connected: this.connected,
        size: info,
      };
    } catch (error) {
      console.error("Redis status error:", error);
      return {
        type: "redis" as const,
        connected: false,
      };
    }
  }
}

/**
 * Factory function to create appropriate rate limit store
 */
export function createRateLimitStore(): RateLimitStore {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      // Try to use Redis if available
      const redis = require("redis");
      const client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              console.error("Redis reconnection failed after 10 attempts");
              return new Error("Redis reconnection failed");
            }
            return retries * 100;
          },
        },
      });

      client.connect();
      console.log("🔴 Using Redis for rate limiting (distributed)");
      return new RedisRateLimitStore(client);
    } catch (error) {
      console.warn("⚠️ Redis not available, falling back to in-memory rate limiting");
      console.warn("⚠️ WARNING: In-memory rate limiting will not work with multiple servers!");
    }
  }

  console.log("📌 Using in-memory rate limiting (single server only)");
  console.log("💡 For production, set REDIS_URL environment variable");
  return new MemoryRateLimitStore();
}
