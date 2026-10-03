/**
 * Aponta o SMTP desta instalação para o Mailpit local, só se ainda não houver envio.
 *
 *   pnpm mail:dev
 *
 * O Mailpit sobe com `pnpm db:up` (SMTP em 127.0.0.1:1025, caixa em http://localhost:8025).
 * Recusa NODE_ENV=production e não sobrescreve um SMTP já gravado.
 */
import { prisma } from "../src/index";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Não grave o Mailpit de desenvolvimento em produção.");
  const current = await prisma.mailSettings.findUnique({ where: { id: "singleton" } });
  if (current) {
    console.log(`SMTP já configurado (${current.host}:${current.port}). Nada foi alterado.`);
    return;
  }
  await prisma.mailSettings.create({
    data: {
      id: "singleton",
      host: "127.0.0.1",
      port: 1025,
      secure: false,
      user: null,
      passwordEnc: null,
      fromAddress: "noreply@example.com",
      publicBaseUrl: "http://localhost:3000",
    },
  });
  console.log("SMTP de desenvolvimento gravado: 127.0.0.1:1025. A caixa fica em http://localhost:8025.");
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); }).finally(() => prisma.$disconnect());
