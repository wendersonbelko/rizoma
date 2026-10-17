import type { PERMISSION_DEFS } from "@api-hub/core/rbac";

type Def = (typeof PERMISSION_DEFS)[number];

/** Por que a célula não é editável, em palavras (vai no `title`). */
export function lockedReason(def: Def, role: "OWNER" | "ADMIN" | "MAINTAINER" | "VIEWER", checked: boolean): string {
  if (role === "OWNER") return "O Proprietário sempre tem todas as permissões.";
  if (checked) return "Obrigatória: todos os papéis têm essa permissão.";
  if ("sensitive" in def && def.sensitive) return "Não se aplica: permissão administrativa, só o Administrador pode recebê-la.";
  return "Não se aplica a este papel.";
}

/**
 * Célula que não se edita. Sempre ativa: quadradinho cheio com o visto. Não se aplica: contorno a 40% de
 * opacidade com um traço "—" (p. 11 da auditoria de UX de 02/10/2026), para não parecer uma caixa vazia
 * que alguém esqueceu de marcar. O motivo vai no `title` e no nome acessível.
 */
export function LockedCell({ checked, label, reason }: { checked: boolean; label: string; reason: string }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-disabled="true"
      aria-label={`${label}. ${reason}`}
      title={reason}
      className={checked
        ? "inline-grid size-4 place-items-center rounded-[3px] bg-ink text-paper"
        : "inline-grid size-4 place-items-center rounded-[3px] border border-line-strong text-[10px] leading-none text-muted opacity-40"}
    >
      {checked ? (
        <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3">
          <path d="M2.5 6.2 4.8 8.5 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span aria-hidden="true">—</span>
      )}
    </span>
  );
}

/** Caixa editável. Mudou em relação ao que está salvo: ganha um halo para o olho achar a mudança. */
export function EditableCell({ checked, changed, label, onToggle }: { checked: boolean; changed: boolean; label: string; onToggle: () => void }) {
  return (
    <span className={`inline-grid size-6 place-items-center rounded-control ${changed ? "bg-wait/25 ring-1 ring-wait/60" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onToggle} aria-label={label} className="size-4 cursor-pointer accent-accent" />
    </span>
  );
}
