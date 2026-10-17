"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { resourceSchema } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";

/** Erros que o formulário mostra junto do campo (nome, endereço e tipo estão no 1º passo, os outros nos detalhes). */
export type FieldErrors = { name?: string; slug?: string; kind?: string; provider?: string; description?: string; docsUrl?: string };
export type Result = { ok: boolean; message?: string; fieldErrors?: FieldErrors };
const fail = (message: string, fieldErrors?: FieldErrors): Result => ({ ok: false, message, ...(fieldErrors ? { fieldErrors } : {}) });

const FIELDS = ["name", "slug", "kind", "provider", "description", "docsUrl"] as const;
// Mensagens em pt-BR que dizem como corrigir, no lugar do que o Zod diria em inglês. Nome e endereço já vêm em pt-BR de resourceSchema.
const FIELD_MESSAGE: Partial<Record<(typeof FIELDS)[number], string>> = {
  kind: "Escolha o tipo da integração.",
  provider: "O provedor aceita até 60 caracteres.",
  description: "A descrição aceita até 5.000 caracteres.",
  docsUrl: "Informe uma URL válida, começando por https://.",
};

function parse(form: FormData): { ok: true; data: z.infer<typeof resourceSchema> } | { ok: false; result: Result } {
  const raw = Object.fromEntries(form);
  // O tipo começa vazio no cadastro (achado M3 da auditoria): sem escolha o campo nem chega no FormData.
  const parsed = resourceSchema.safeParse({
    ...raw,
    provider: raw.provider || undefined,
    description: raw.description || undefined,
    docsUrl: raw.docsUrl || undefined,
  });
  if (parsed.success) return { ok: true, data: parsed.data };

  const fieldErrors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = FIELDS.find((f) => f === issue.path[0]);
    if (key) fieldErrors[key] ??= FIELD_MESSAGE[key] ?? issue.message;
  }
  if (Object.keys(fieldErrors).length === 0) return { ok: false, result: fail(parsed.error.issues[0]?.message ?? "Dados inválidos.") };
  return { ok: false, result: fail("Corrija os campos marcados.", fieldErrors) };
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
  if (!parsed.ok) return parsed.result;
  if (await prisma.externalResource.findUnique({ where: { slug: parsed.data.slug } })) {
    return fail("Já existe uma integração com este endereço.", { slug: "Já existe uma integração com este endereço. Escolha outro em “editar endereço”." });
  }
  const endpoints = endpointsFrom(form).filter((e) => e.value);
  const r = await prisma.externalResource.create({ data: { ...parsed.data, endpoints: { create: endpoints.map((e) => ({ environmentId: e.environmentId, value: e.value.slice(0, 500) })) } } });
  await audit({ actorId: actor.id, action: "integration.created", targetType: "integration", targetId: r.id, metadata: { slug: r.slug, kind: r.kind } });
  revalidatePath("/integrations");
  redirect(`/integrations/${r.slug}`);
}

export async function updateResource(_: Result, form: FormData): Promise<Result> {
  const actor = await requirePermission("link:edit");
  const id = z.string().parse(form.get("id"));
  const parsed = parse(form);
  if (!parsed.ok) return parsed.result;
  const current = await prisma.externalResource.findUniqueOrThrow({ where: { id } });
  if (parsed.data.slug !== current.slug && (await prisma.externalResource.findUnique({ where: { slug: parsed.data.slug } }))) {
    return fail("Já existe uma integração com este endereço.", { slug: "Já existe uma integração com este endereço. Escolha outro." });
  }
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

/**
 * Excluir é irreversível, então o servidor confere a frase digitada (achado F3): ela precisa ser o
 * nome da integração lido do banco, não um valor mandado pelo formulário. O DangerAction do modal
 * já impede o clique sem a frase; isto vale para quem chamar a ação por fora.
 */
export async function deleteResource(form: FormData): Promise<{ ok?: boolean; message?: string } | void> {
  const actor = await requirePermission("link:edit");
  const id = z.string().parse(form.get("id"));
  const current = await prisma.externalResource.findUnique({ where: { id }, select: { id: true, name: true, slug: true } });
  if (!current) return { ok: false, message: "Esta integração não existe mais." };
  if (String(form.get("confirm") ?? "") !== current.name) return { ok: false, message: "O nome digitado não confere com o da integração." };
  await prisma.externalResource.delete({ where: { id } });
  await audit({ actorId: actor.id, action: "integration.deleted", targetType: "integration", targetId: id, metadata: { slug: current.slug } });
  revalidatePath("/integrations");
  redirect("/integrations");
}
