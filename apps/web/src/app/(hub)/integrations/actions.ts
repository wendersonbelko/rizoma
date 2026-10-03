"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { resourceSchema } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";

export type Result = { ok: boolean; message?: string };
const fail = (message: string): Result => ({ ok: false, message });

function parse(form: FormData) {
  const raw = Object.fromEntries(form);
  return resourceSchema.safeParse({
    ...raw,
    provider: raw.provider || undefined,
    description: raw.description || undefined,
    docsUrl: raw.docsUrl || undefined,
  });
}

/** Endereços por ambiente vêm como endpoint:<environmentId> (RN-80). */
function endpointsFrom(form: FormData) {
  return [...form.entries()]
    .filter(([k]) => k.startsWith("endpoint:"))
    .map(([k, v]) => ({ environmentId: k.slice(9), value: String(v).trim() }));
}

export async function createResource(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("link:edit");
  const parsed = parse(form);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  if (await prisma.externalResource.findUnique({ where: { slug: parsed.data.slug } })) return fail("Já existe uma integração com esse identificador.");
  const endpoints = endpointsFrom(form).filter((e) => e.value);
  const r = await prisma.externalResource.create({ data: { ...parsed.data, endpoints: { create: endpoints.map((e) => ({ environmentId: e.environmentId, value: e.value.slice(0, 500) })) } } });
  await audit({ actorId: actor.id, action: "integration.created", targetType: "integration", targetId: r.id, metadata: { slug: r.slug, kind: r.kind } });
  redirect(`/integrations/${r.slug}`);
}

export async function updateResource(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("link:edit");
  const id = z.string().parse(form.get("id"));
  const parsed = parse(form);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  const current = await prisma.externalResource.findUniqueOrThrow({ where: { id } });
  if (parsed.data.slug !== current.slug && (await prisma.externalResource.findUnique({ where: { slug: parsed.data.slug } }))) return fail("Identificador em uso.");
  const endpoints = endpointsFrom(form);
  await prisma.$transaction([
    prisma.externalResource.update({ where: { id }, data: { ...parsed.data, provider: parsed.data.provider ?? null, description: parsed.data.description ?? null, docsUrl: parsed.data.docsUrl ?? null } }),
    prisma.resourceEndpoint.deleteMany({ where: { resourceId: id, environmentId: { in: endpoints.filter((e) => !e.value).map((e) => e.environmentId) } } }),
    ...endpoints.filter((e) => e.value).map((e) =>
      prisma.resourceEndpoint.upsert({
        where: { resourceId_environmentId: { resourceId: id, environmentId: e.environmentId } },
        create: { resourceId: id, environmentId: e.environmentId, value: e.value.slice(0, 500) },
        update: { value: e.value.slice(0, 500) },
      })),
  ]);
  await audit({ actorId: actor.id, action: "integration.updated", targetType: "integration", targetId: id });
  revalidatePath("/integrations");
  if (parsed.data.slug !== current.slug) redirect(`/integrations/${parsed.data.slug}`);
  revalidatePath(`/integrations/${parsed.data.slug}`);
  return { ok: true, message: "Integração salva." };
}

export async function deleteResource(form: FormData) {
  const actor = await requirePermission("link:edit");
  const id = z.string().parse(form.get("id"));
  if (form.get("confirm") !== "EXCLUIR") redirect(`?erro=confirmacao`);
  const r = await prisma.externalResource.delete({ where: { id } });
  await audit({ actorId: actor.id, action: "integration.deleted", targetType: "integration", targetId: id, metadata: { slug: r.slug } });
  redirect("/integrations");
}
