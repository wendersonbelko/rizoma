import { personLabel, relativeTime } from "@api-hub/core";
import { Td, Tr } from "@/components/table";
import { AUDIT_TARGET_LABEL, auditGroupLabel, auditTargetName, describeAuditEvent } from "./events";
import type { queryAudit } from "./query";

type Row = Awaited<ReturnType<typeof queryAudit>>["rows"][number];

const DETAIL_LABEL = "text-xs text-muted";

/**
 * Uma linha da auditoria em frase (achados V1 e V3 da auditoria de UX de 02/10/2026):
 * "**Marina Costa** entrou no sistema" e, abaixo, "Login e saída · há 2 h". O código da ação, o IP,
 * a data completa e o JSON ficam atrás de "Detalhes", a um clique (dado técnico não é a primeira leitura).
 * O <summary> é a linha inteira: o alvo do clique é grande e o teclado abre com Enter ou Espaço.
 */
export function AuditRow({ row, targets }: { row: Row; targets: Record<string, string> }) {
  // Sem autor (CI, instalação, login barrado antes do cadastro) é o próprio sistema.
  const author = row.actor ? personLabel(row.actor, "Alguém") : "Sistema";
  const target = auditTargetName(row, targets);
  const sentence = describeAuditEvent(row, target);
  const when = row.createdAt.toLocaleString("pt-BR");
  const targetLabel = target ? `${AUDIT_TARGET_LABEL[row.targetType ?? ""] ?? "Alvo"}: ${target}` : "—";

  return (
    <Tr>
      <Td>
        <details className="group/audit">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-control [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="block"><strong className="font-semibold text-ink">{author}</strong> {sentence}</span>
              <span className="mt-0.5 block text-sm text-muted">
                {auditGroupLabel(row.action)} · <time dateTime={row.createdAt.toISOString()} title={when}>{relativeTime(row.createdAt)}</time>
              </span>
            </span>
            <span className="mt-0.5 flex shrink-0 items-center gap-1 whitespace-nowrap text-sm text-accent">
              Detalhes
              <span aria-hidden="true" className="inline-block transition-transform group-open/audit:rotate-90">▸</span>
            </span>
          </summary>
          <div className="mt-3 space-y-3 rounded-control border border-line bg-paper p-3">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className={DETAIL_LABEL}>Data e hora</dt><dd className="mt-0.5">{when}</dd></div>
              <div><dt className={DETAIL_LABEL}>IP</dt><dd className="mt-0.5 font-mono text-[13px]">{row.ip ?? "—"}</dd></div>
              <div><dt className={DETAIL_LABEL}>Código da ação</dt><dd className="mt-0.5 font-mono text-[13px]">{row.action}</dd></div>
              <div><dt className={DETAIL_LABEL}>Alvo</dt><dd className="mt-0.5">{targetLabel}</dd></div>
            </dl>
            {row.metadata != null && (
              <div>
                <p className={DETAIL_LABEL}>Dados do evento</p>
                <pre className="mt-1 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-control border border-line bg-field p-3 font-mono text-xs leading-relaxed">{JSON.stringify(row.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        </details>
      </Td>
    </Tr>
  );
}
