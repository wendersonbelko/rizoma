"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { THEME_COOKIE, THEME_PREFERENCES, themeChoiceFromPreference, type ThemePreference } from "@api-hub/core";
import { requireUser } from "@/lib/guards";

export type ThemePreferenceResult = { ok: boolean; message?: string };

const schema = z.enum(THEME_PREFERENCES as [ThemePreference, ...ThemePreference[]], { error: "Escolha Claro, Escuro ou Sistema." });

/**
 * Achado F5 da auditoria de UX de 02/10/2026: o tema é preferência da própria pessoa, não do
 * admin. Grava em `User.themePreference` (vale em qualquer aparelho) e no cookie `rizoma-theme`
 * (o servidor pinta o `<html>` no tema certo, sem piscar).
 *
 * Sem `audit()`: é uma escolha pessoal que não muda nada para mais ninguém, e registrá-la
 * poluiria a auditoria. A pessoa só mexe na própria linha, então não há escopo a checar.
 */
export async function setThemePreference(input: unknown): Promise<ThemePreferenceResult> {
  const user = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Tema inválido." };

  await prisma.user.update({ where: { id: user.id }, data: { themePreference: parsed.data } });
  (await cookies()).set(THEME_COOKIE, themeChoiceFromPreference(parsed.data), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
