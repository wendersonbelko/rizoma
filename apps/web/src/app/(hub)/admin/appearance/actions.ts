"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { HEX, THEMES, THEME_TOKENS, paletteProblems, resolveTheme } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";

export type AppearanceResult = { ok: boolean; message?: string; problems?: string[] };

const schema = z.object({
  appName: z.string().trim().min(2, "Título muito curto.").max(40, "Use até 40 caracteres."),
  themeId: z.enum(THEMES.map((t) => t.id) as [string, ...string[]]),
  palette: z.record(z.string(), z.string().regex(HEX)),
});

/** RN-110 a RN-113: título, tema e cores. Guarda só as cores que diferem do tema escolhido. */
export async function saveAppearance(input: unknown): Promise<AppearanceResult> {
  const actor = await requirePermission("appearance:manage");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { appName, themeId, palette } = parsed.data;
  const base = resolveTheme(themeId).palette;
  const overrides = Object.fromEntries(THEME_TOKENS.filter((t) => palette[t] && palette[t]!.toLowerCase() !== base[t]).map((t) => [t, palette[t]!.toLowerCase()]));
  const effective = resolveTheme(themeId, overrides).palette;
  const problems = paletteProblems(effective);
  if (problems.length) return { ok: false, message: "Algumas combinações ficariam ilegíveis:", problems };

  const before = await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
  await prisma.installation.update({
    where: { id: "singleton" },
    data: { appName, themeId, themeOverrides: Object.keys(overrides).length ? overrides : undefined, ...(Object.keys(overrides).length ? {} : { themeOverrides: { set: null } as never }) },
  });
  await audit({ actorId: actor.id, action: "appearance.updated", metadata: { from: { appName: before.appName, themeId: before.themeId }, to: { appName, themeId }, overrides } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Aparência salva para todo mundo." };
}
