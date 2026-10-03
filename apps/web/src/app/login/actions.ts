"use server";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { AUTHJS_ID, type AuthProviderType } from "@api-hub/core";
import { prisma } from "@api-hub/db";
import { rateLimit } from "@/lib/rate-limit";
import { createInvite } from "@/lib/local-auth";
import { z } from "zod";
import { signIn } from "@/auth";

export async function signInWith(type: AuthProviderType) {
  const p = await prisma.authProvider.findUnique({ where: { type } });
  if (!p?.enabled || type === "CREDENTIALS") redirect("/login?error=provider");
  await signIn(AUTHJS_ID[type], { redirectTo: "/" });
}

export async function signInWithPassword(_: { error?: string }, form: FormData): Promise<{ error?: string }> {
  try {
    await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirectTo: "/" });
    return {};
  } catch (e) {
    if (e instanceof AuthError) {
      const code = (e as AuthError & { code?: string }).code;
      const messages: Record<string, string> = {
        locked: "Muitas tentativas erradas. A conta fica bloqueada por 15 minutos.",
        suspended: "Seu acesso está suspenso. Fale com um administrador.",
        too_many: "Muitas tentativas. Aguarde alguns minutos.",
      };
      return { error: messages[code ?? ""] ?? "E-mail ou senha incorretos." };
    }
    throw e; // redirect do Next
  }
}

/** Não revela se o e-mail existe. Só envia quando o SMTP está salvo e a conta tem senha. */
export async function requestPasswordReset(_: { message: string }, form: FormData): Promise<{ message: string }> {
  const parsed = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  const generic = "Se este e-mail tiver senha no hub, enviamos um link. Ele vale 1 hora e só pode ser usado uma vez.";
  if (!parsed.success) return { message: generic };
  const mail = await prisma.mailSettings.findUnique({ where: { id: "singleton" } });
  if (!mail) return { message: generic };
  if (!rateLimit(`reset:${parsed.data}`, 5, 60 * 60_000)) return { message: generic };
  const user = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (user?.passwordHash && user.email) {
    await createInvite({ email: user.email, name: user.name ?? undefined, role: user.role, kind: "PASSWORD_RESET", createdById: null });
  }
  return { message: generic };
}
