import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // ExifTool spawns a real binary and file I/O round-trips can be slow on CI.
    testTimeout: 30000,
    hookTimeout: 30000
  }
});
