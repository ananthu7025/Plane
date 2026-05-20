import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

// Production-ready connection pool configuration
// Tuned for 5k users/day (~200 req/min sustained)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://root:root@localhost:5432/plane_and_prop",
  // Connection pool sizing
  max: parseInt(process.env.DB_POOL_MAX || "20"), // Max connections: tuned for 5k users
  min: parseInt(process.env.DB_POOL_MIN || "5"), // Min idle connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"), // Close idle connections after 30s
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || "2000"), // Fail fast if no connection available
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
