import { describeAuditEvent, type queryAudit } from "./query";

type Row = Awaited<ReturnType<typeof queryAudit>>["rows"][number];

/** Um registro de auditoria, no lugar da tabela. */
export function AuditDetail({ row, targetName }: { row: Row; targetName?: string }) {
  const who = row.actor ? (row.actor.githubLogin ? `@${row.actor.githubLogin}` : row.actor.email) : "sistema";
  return (
    <article className="rounded-panel border border-line bg-sheet p-5">
      <p className="text-sm text-muted">{row.createdAt.toLocaleString("pt-BR")}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">{describeAuditEvent(row, targetName)}</h2>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted">Quem</dt><dd className="mt-0.5">{who}</dd></div>
        <div><dt className="text-xs text-muted">Alvo</dt><dd className="mt-0.5">{row.targetId ? (targetName ?? row.targetType ?? "—") : "—"}</dd></div>
        <div><dt className="text-xs text-muted">IP</dt><dd className="mt-0.5">{row.ip ?? "—"}</dd></div>
        <div><dt className="text-xs text-muted">Ação</dt><dd className="mt-0.5 font-mono text-[13px]">{row.action}</dd></div>
      </dl>
      {row.metadata != null && (
        <pre className="mt-5 overflow-x-auto rounded-control border border-line bg-field p-3 font-mono text-xs leading-relaxed">{JSON.stringify(row.metadata, null, 2)}</pre>
      )}
    </article>
  );
}
