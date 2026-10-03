import path from "node:path";
import { defineConfig } from "vitest/config";

// Testes de integração: rodam contra um PostgreSQL real com as migrações aplicadas.
// Variável: TEST_DATABASE_URL (nunca aponte para produção — as tabelas são truncadas).
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["test/integration/**/*.test.ts"],
    setupFiles: ["test/integration/setup.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    // next-auth importa "next/server" sem extensão; processar pelo Vite resolve o caminho.
    server: { deps: { inline: ["next-auth", "@auth/core"] } },
  },
});
