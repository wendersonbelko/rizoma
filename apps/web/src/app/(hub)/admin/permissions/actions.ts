"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, type Role } from "@api-hub/db";
import { ROLE_LABEL, buildMatrix, validateMatrixChange } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { plainRoles } from "../people/labels";

export type PermResult = { ok: boolean; message?: string };
const EDITABLE: Role[] = ["ADMIN", "MAINTAINER", "VIEWER"];

/** RN-26 a RN-29: a matriz inteira é gravada de uma vez e cada mudança fica na auditoria. */
export async function savePermissions(input: unknown): Promise<PermResult> {
  const actor = await requirePermission("roles:manage");
  const parsed = z.record(z.enum(["ADMIN", "MAINTAINER", "VIEWER"]), z.array(z.string())).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Os dados enviados não são válidos. Recarregue a página e tente de novo." };
  const next = parsed.data as Record<Role, string[]>;
  // Os códigos de papel (ADMIN…) não aparecem para a pessoa (achado V2 da auditoria de UX de 02/10/2026).
  const errors = EDITABLE.flatMap((r) => validateMatrixChange(r, next[r] ?? []).map((e) => `${ROLE_LABEL[r]}: ${plainRoles(e)}`));
  if (errors.length) return { ok: false, message: errors.join(" ") };
  // O Administrador não pode tirar de si mesmo a permissão de editar a matriz (evita trancar a tela).
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

/** Aceita (e ignora) o FormData para servir de `action` da DangerAction "Restaurar padrão". */
export async function resetPermissions(_form?: FormData): Promise<PermResult> {
  const actor = await requirePermission("roles:manage");
  // Guarda a matriz que está sendo substituída: sem isto o registro não permitiria reconstruir o que se perdeu.
  const replaced = buildMatrix(await prisma.rolePermission.findMany());
  await prisma.rolePermission.deleteMany({});
  await audit({ actorId: actor.id, action: "roles.reset", metadata: { replaced: Object.fromEntries(EDITABLE.map((r) => [r, [...replaced[r]]])) } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Permissões voltaram ao padrão." };
}
