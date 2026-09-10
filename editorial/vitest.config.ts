import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["editorial/src/**/*.test.ts"] },
});
