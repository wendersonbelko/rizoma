import { buildMatrix, can } from "@api-hub/core";
import { prisma } from "@api-hub/db";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";
import { queryAudit, type AuditFilters } from "@/app/(hub)/admin/audit/query";

export const dynamic = "force-dynamic";
const MAX_ROWS = 10_000;

function csvCell(v: unknown): string {
  const s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  // Evita injeção de fórmula ao abrir no Excel/Sheets.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
  if (!user || user.status !== "ACTIVE" || session!.user.tv !== user.tokenVersion) return new Response("Não encontrado", { status: 404 });
  const permissions = buildMatrix(await prisma.rolePermission.findMany())[user.role];
  if (!can({ permissions }, "audit:read")) return new Response("Não encontrado", { status: 404 });

  const f = Object.fromEntries(new URL(req.url).searchParams) as AuditFilters;
  const { rows, info: { total } } = await queryAudit(f, { page: 1, pageSize: MAX_ROWS });
  const lines = [
    ["quando", "quem", "acao", "alvo_tipo", "alvo_id", "ip", "detalhes"].join(","),
    ...rows.map((r) => [r.createdAt.toISOString(), r.actor?.githubLogin ?? r.actor?.email ?? r.actor?.name ?? "sistema", r.action, r.targetType, r.targetId, r.ip, r.metadata].map(csvCell).join(",")),
  ];
  await audit({ actorId: user.id, action: "audit.exported", metadata: { filters: f, rows: rows.length, total } });

  return new Response("\uFEFF" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
