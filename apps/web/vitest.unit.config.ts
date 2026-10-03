import path from "node:path";
import { defineConfig } from "vitest/config";

// Testes unitários rápidos, sem banco de dados (ver vitest.integration.config.ts para os que precisam de Postgres).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["test/unit/**/*.test.ts"],
  },
});
