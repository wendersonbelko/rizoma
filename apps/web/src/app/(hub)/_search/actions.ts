"use server";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { normalizeSearchText, sortByRelevance } from "@api-hub/core";
import { requireUser } from "@/lib/guards";
import { catalogVisibilityWhere, operationMatchWhere, serviceSearchWhere } from "@/lib/catalog-search";

/** Serviço achado pela busca global ⌘K. Só o que a paleta desenha: nada de registro cru do banco. */
export type ServiceHit = {
  slug: string;
  name: string;
  teamName: string | null;
  /** "GET /pedidos" quando o serviço entrou pelo endpoint e não pelo nome; senão null. */
  endpoint: string | null;
};

const MAX_RESULTS = 8;
// Busca com 1 letra devolve quase o catálogo inteiro: a paleta só consulta a partir de 2.
const querySchema = z.string().trim().min(2).max(80);

/**
 * Busca global (p. 13 da auditoria de UX de 02/10/2026): serviços por nome, slug, descrição ou
 * endpoint, com a MESMA visibilidade do catálogo (RN-30: serviço de time só aparece para o time ou
 * para quem tem catalog:read_private; arquivado nunca). A regra vem de lib/catalog-search.ts.
 *
 * Não escreve nada e não chama revalidatePath, então a rota atual não é renderizada de novo.
 * Texto inválido (curto demais, longo demais, não-texto) devolve lista vazia, sem erro.
 */
export async function searchServices(query: string): Promise<ServiceHit[]> {
  const user = await requireUser();
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) return [];
  const q = parsed.data;

  // Mais do que se mostra: a ordem do banco é alfabética, e quem começa pelo texto digitado deve vir antes.
  const rows = await prisma.service.findMany({
    where: { AND: [{ archivedAt: null }, catalogVisibilityWhere(user), serviceSearchWhere(q)] },
    select: {
      slug: true,
      name: true,
      ownerTeam: { select: { name: true } },
      operations: { where: operationMatchWhere(q), select: { method: true, path: true }, orderBy: { path: "asc" }, take: 1 },
    },
    orderBy: { name: "asc" },
    take: MAX_RESULTS * 3,
  });

  const needle = normalizeSearchText(q);
  const hits = rows.map((r) => {
    const byName = normalizeSearchText(r.name).includes(needle) || r.slug.includes(needle);
    const op = r.operations[0];
    return {
      label: r.name,
      keywords: [r.slug],
      hit: {
        slug: r.slug,
        name: r.name,
        teamName: r.ownerTeam?.name ?? null,
        // O endpoint só ajuda quando explica por que o serviço apareceu.
        endpoint: !byName && op ? `${op.method} ${op.path}` : null,
      } satisfies ServiceHit,
    };
  });
  return sortByRelevance(hits, q).slice(0, MAX_RESULTS).map((h) => h.hit);
}
