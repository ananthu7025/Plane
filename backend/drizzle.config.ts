import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:root@localhost:5432/planeandprop",
  },
  verbose: true,
  strict: true,
} satisfies Config;
