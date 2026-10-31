import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".next"],
    setupFiles: ["tests/setup/env.setup.ts"],
  },
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "src/$1") }],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
});
