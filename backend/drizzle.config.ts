import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://root:root@localhost:5432/plane_and_prop",
  },
  verbose: true,
  strict: true,
} satisfies Config;
