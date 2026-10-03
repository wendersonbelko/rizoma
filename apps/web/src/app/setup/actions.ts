"use server";
import { prisma } from "@api-hub/db";
import { AUTHJS_ID, nextStep, type AuthProviderType } from "@api-hub/core";
import { signIn } from "@/auth";
import { getInstallation } from "@/lib/install";

export async function signInAsOwner(type: AuthProviderType) {
  const provider = await prisma.authProvider.findUnique({ where: { type } });
  if (!provider || type === "CREDENTIALS") throw new Error("Forma de login indisponível.");
  await signIn(AUTHJS_ID[type], { redirectTo: "/setup" });
}

/** Chamado pelo assistente quando o OWNER já existe: libera a etapa de revisão. */
export async function confirmOwner() {
  const inst = await getInstallation();
  if (inst.installed) return;
  const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (owner) await prisma.installation.update({ where: { id: "singleton" }, data: { currentStep: nextStep("owner") } });
}
