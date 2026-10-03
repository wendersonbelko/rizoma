/**
 * Recuperação de OWNER (RN-70 a RN-73).
 *
 *   pnpm admin:recover --login fulano                   (usuário do GitHub)
 *   pnpm admin:recover --login fulano@empresa.com       (e-mail)
 *   pnpm admin:recover --login fulano@empresa.com --reset-password
 *
 * - Só roda com acesso de linha de comando ao servidor (é essa a prova de autorização:
 *   sem token central, já que o projeto é de código aberto). Pede confirmação "sim/não".
 * - Se a pessoa já existe, vira OWNER ativo na hora. Com --reset-password, também sai
 *   um link de nova senha (1 hora, uso único).
 * - Se nunca entrou, abre uma janela de 60 minutos: o primeiro login dela vira OWNER,
 *   mesmo sem vínculo com a empresa ou com a política de bloqueio.
 * - Tudo fica na auditoria.
 */
import { createInterface } from "node:readline/promises";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../src/index";

const WINDOW_MINUTES = 60;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const id = arg("login")?.trim().toLowerCase().replace(/^@/, "");
  const reset = process.argv.includes("--reset-password");
  const isEmail = !!id && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(id);
  if (!id || (!isEmail && !/^[a-z0-9](?:[a-z0-9-]{0,38})$/.test(id))) {
    console.error("Uso: pnpm admin:recover --login <usuario-do-github | email> [--reset-password]");
    process.exit(2);
  }
  if (reset && !isEmail) {
    console.error("--reset-password só funciona com e-mail.");
    process.exit(2);
  }

  const inst = await prisma.installation.findUnique({ where: { id: "singleton" } });
  if (!inst?.installed) {
    console.error("O hub ainda não foi instalado. Use o assistente em /setup.");
    process.exit(2);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = (await rl.question(`Tornar ${id} OWNER da instalação "${inst.orgName}"? (sim/não) `)).trim().toLowerCase();
  rl.close();
  if (confirm !== "sim") {
    console.log("Cancelado.");
    return;
  }

  const user = await prisma.user.findFirst({ where: isEmail ? { email: id } : { githubLogin: id } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "OWNER", status: "ACTIVE", accessGrant: "OWNER_SETUP", statusReason: null, accessExpiresAt: null, failedLogins: 0, lockedUntil: null },
    });
    await prisma.auditLog.create({
      data: { action: "owner.recovered", targetType: "user", targetId: user.id, metadata: { login: id, via: "cli", previousRole: user.role, previousStatus: user.status } },
    });
    console.log(`${id} agora é OWNER e está ativo.`);
    if (reset) {
      const token = randomBytes(32).toString("base64url");
      await prisma.userInvite.updateMany({ where: { email: id, kind: "PASSWORD_RESET", usedAt: null }, data: { expiresAt: new Date() } });
      await prisma.userInvite.create({
        data: { email: id, role: "OWNER", kind: "PASSWORD_RESET", createdById: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) },
      });
      await prisma.auditLog.create({ data: { action: "user.password_reset_link", targetType: "user", targetId: user.id, metadata: { via: "cli" } } });
      console.log(`Link de nova senha (1 hora, uso único): ${(process.env.AUTH_URL ?? "").replace(/\/+$/, "")}/reset-password/${token}`);
    }
    return;
  }

  if (reset) {
    console.error(`${id} não tem conta. Sem --reset-password, o comando abre a janela de primeiro login.`);
    process.exit(1);
  }
  const expiresAt = new Date(Date.now() + WINDOW_MINUTES * 60_000);
  await prisma.installation.update({ where: { id: "singleton" }, data: { recoveryIdentifier: id, recoveryExpiresAt: expiresAt } });
  await prisma.auditLog.create({ data: { action: "owner.recovery_opened", metadata: { login: id, expiresAt: expiresAt.toISOString() } } });
  console.log(`${id} nunca entrou no hub. O primeiro login até ${expiresAt.toLocaleTimeString("pt-BR")} vira OWNER.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
