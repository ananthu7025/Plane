import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import config from "../config/index.js";

// Production-ready connection pool configuration
// Tuned for 5k users/day (~200 req/min sustained)
// All settings centralized from config
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  // Connection pool sizing (centralized from config)
  max: config.DB_POOL_MAX, // Max connections: tuned for 5k users
  min: config.DB_POOL_MIN, // Min idle connections
  idleTimeoutMillis: config.DB_IDLE_TIMEOUT, // Close idle connections after 30s
  connectionTimeoutMillis: config.DB_CONNECTION_TIMEOUT, // Fail fast if no connection available
  // Application name for better PostgreSQL monitoring
  application_name: "plane_prop_api",
});

// Log pool status on startup
pool.on("connect", () => {
  console.log("✅ New database connection established");
});

pool.on("error", (error: any) => {
  try {
    const message = error?.message || String(error) || "Unknown database error";
    console.error("❌ Database pool error:", message);
  } catch (e) {
    console.error("❌ Database pool error (unable to parse):", error);
  }
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;

// Export pool for health checks
export { pool };
