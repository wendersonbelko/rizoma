"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { HEX, accentProblems, resolveAccent } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";

export type AppearanceResult = { ok: boolean; message?: string; problems?: string[] };

const schema = z.object({
  appName: z.string().trim().min(2, "O nome do sistema precisa de pelo menos 2 letras.").max(40, "Use até 40 caracteres no nome do sistema."),
  accent: z.string().trim().toLowerCase().regex(HEX, "Use uma cor no formato #rrggbb, por exemplo #0f7a68."),
});

/**
 * RN-110 a RN-113: o admin define só a marca, o nome do sistema e a cor de destaque (achado F5 da
 * auditoria de UX de 02/10/2026). O tema Claro/Escuro é escolha de cada pessoa. O destaque fica em
 * `Installation.themeOverrides` como `{ accent }`; `themeId` não é mais lido.
 */
export async function saveAppearance(input: unknown): Promise<AppearanceResult> {
  const actor = await requirePermission("appearance:manage");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { appName, accent } = parsed.data;
  const problems = accentProblems(accent);
  if (problems.length) return { ok: false, message: "Essa cor ficaria ilegível:", problems };

  const before = await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
  await prisma.installation.update({ where: { id: "singleton" }, data: { appName, themeOverrides: { accent } } });
  await audit({
    actorId: actor.id,
    action: "appearance.updated",
    metadata: { from: { appName: before.appName, accent: resolveAccent(before.themeOverrides) }, to: { appName, accent } },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Marca salva para todas as pessoas." };
}
