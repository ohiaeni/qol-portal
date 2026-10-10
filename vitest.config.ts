import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // npm run test:coverage で計測する
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.ts"],
      exclude: ["**/*.d.ts"],
      reporter: ["text", "json-summary", "html"],
    },
  },
});
