"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, type Role } from "@api-hub/db";
import { DEFAULT_MATRIX, buildMatrix, validateMatrixChange } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";

export type PermResult = { ok: boolean; message?: string };
const EDITABLE: Role[] = ["ADMIN", "MAINTAINER", "VIEWER"];

/** RN-26 a RN-29: a matriz inteira é gravada de uma vez e cada mudança fica na auditoria. */
export async function savePermissions(input: unknown): Promise<PermResult> {
  const actor = await requirePermission("roles:manage");
  const parsed = z.record(z.enum(["ADMIN", "MAINTAINER", "VIEWER"]), z.array(z.string())).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const next = parsed.data as Record<Role, string[]>;
  const errors = EDITABLE.flatMap((r) => validateMatrixChange(r, next[r] ?? []).map((e) => `${r}: ${e}`));
  if (errors.length) return { ok: false, message: errors.join(" ") };
  // Um ADMIN não pode tirar de si mesmo a permissão de editar a matriz (evita trancar a tela).
  if (actor.role === "ADMIN" && !next.ADMIN?.includes("roles:manage")) return { ok: false, message: "Você não pode remover do seu próprio papel a permissão de editar a matriz." };

  const before = buildMatrix(await prisma.rolePermission.findMany());
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({}),
    prisma.rolePermission.createMany({ data: EDITABLE.flatMap((role) => [...new Set(next[role] ?? [])].map((permission) => ({ role, permission }))) }),
  ]);
  const diff = Object.fromEntries(EDITABLE.map((r) => {
    const b = before[r], a = new Set(next[r]);
    return [r, { added: [...a].filter((p) => !b.has(p)), removed: [...b].filter((p) => !a.has(p)) }];
  }));
  await audit({ actorId: actor.id, action: "roles.updated", metadata: diff });
  revalidatePath("/", "layout");
  return { ok: true, message: "Permissões salvas. Valem a partir da próxima página que cada pessoa abrir." };
}

export async function resetPermissions(): Promise<PermResult> {
  const actor = await requirePermission("roles:manage");
  await prisma.rolePermission.deleteMany({});
  await audit({ actorId: actor.id, action: "roles.reset", metadata: DEFAULT_MATRIX });
  revalidatePath("/", "layout");
  return { ok: true, message: "Permissões voltaram ao padrão." };
}
