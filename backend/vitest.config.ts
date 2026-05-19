import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Use Node environment
    environment: "node",

    // Global test settings
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/tests/**",
        "node_modules/**",
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },

    // Test file patterns
    include: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/tests/**/*.test.ts"],
    exclude: ["node_modules", "dist"],

    // Setup files
    setupFiles: [],

    // Timeout
    testTimeout: 10000,

    // Disable isolation per test
    isolate: true,

    // Reporter
    reporters: ["default"],

    // Watch mode
    watch: false,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
