import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
      "@features": path.resolve(process.cwd(), "./src/features"),
      "@components": path.resolve(process.cwd(), "./src/components"),
      "@lib": path.resolve(process.cwd(), "./src/lib"),
    },
  },
});
