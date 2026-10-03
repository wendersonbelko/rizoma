"use server";

import { headers } from "next/headers";
import { prisma } from "@api-hub/db";
import { requirePermission } from "@/lib/guards";

export type GraphPrintLog = {
  filters: { kinds: string[]; serviceKinds: string[]; focusLabel?: string; depth?: number };
  nodes: { id: string; kind: string; label: string; sub?: string }[];
  edges: { id: string; from: string; to: string; relation: string }[];
};

/** Grava quem gerou o print, quando, os filtros e as ligações desenhadas. A imagem não vai para o banco. */
export async function recordGraphPrint(input: GraphPrintLog) {
  const actor = await requirePermission("graph:read");
  const who = actor.githubLogin ? `@${actor.githubLogin}` : actor.name ?? actor.email ?? "usuário";
  let ip: string | undefined;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined;
  } catch { /* fora de request */ }
  const inst = await prisma.installation.findUnique({ where: { id: "singleton" }, select: { orgName: true, appName: true } });
  const orgName = inst?.orgName ?? "";
  const appName = inst?.appName ?? "Rizoma";
  const row = await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "graph.printed",
      metadata: { who, orgName, appName, filters: input.filters, nodes: input.nodes, edges: input.edges },
      ip,
    },
  });
  return { id: row.id, who, at: row.createdAt.toLocaleString("pt-BR"), orgName, appName };
}
