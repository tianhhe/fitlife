import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["lib/**/*.ts"],
      exclude: [
        "node_modules/",
        "**/*.test.ts",
        "**/*.d.ts",
        "vitest.setup.ts",
        ".github/",
        "scripts/",
        "drizzle/",
        "app/",
        "components/",
      ],
      thresholds: {
        lines: 20,
        functions: 15,
        branches: 20,
        statements: 20,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "~": path.resolve(__dirname, "./"),
    },
  },
});
