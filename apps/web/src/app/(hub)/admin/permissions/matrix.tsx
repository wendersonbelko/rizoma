"use client";

import { Fragment, useState, useTransition } from "react";
import { PERMISSION_DEFS, validateMatrixChange } from "@api-hub/core/rbac";
import { countLabel } from "@api-hub/core/text";
import { Button } from "@/components/ui";
import { DataTable, TBody, THead, TableGroupRow, Td, Th, Tr } from "@/components/table";
import { resetPermissions, savePermissions, type PermResult } from "./actions";

type Editable = "ADMIN" | "MAINTAINER" | "VIEWER";
const ROLES: Editable[] = ["ADMIN", "MAINTAINER", "VIEWER"];
const ROLE_LABEL = { OWNER: "Owner", ADMIN: "Admin", MAINTAINER: "Mantenedor", VIEWER: "Leitor" };
const COLUMNS = ["OWNER", ...ROLES] as const;

export function PermissionMatrix({ initial, counts }: { initial: Record<Editable, string[]>; counts: Record<string, number> }) {
  const [m, setM] = useState<Record<Editable, Set<string>>>({ ADMIN: new Set(initial.ADMIN), MAINTAINER: new Set(initial.MAINTAINER), VIEWER: new Set(initial.VIEWER) });
  const [result, setResult] = useState<PermResult | null>(null);
  const [pending, start] = useTransition();
  const groups = [...new Set(PERMISSION_DEFS.map((p) => p.group))];

  const toggle = (role: Editable, perm: string) => {
    const next = new Set(m[role]);
    if (next.has(perm)) next.delete(perm); else next.add(perm);
    setM({ ...m, [role]: next });
    setResult(null);
  };
  const disabledFor = (role: Editable, p: (typeof PERMISSION_DEFS)[number]) =>
    ("required" in p && p.required) || (role !== "ADMIN" && "sensitive" in p && p.sensitive);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">Permissões</h1>
          <p data-tour="permissions-rules" className="text-sm text-muted">
            Owner sempre tem tudo. Ver o catálogo é obrigatório. Administração só no Admin.
          </p>
        </div>
        <div data-tour="permissions-actions" className="flex shrink-0 flex-wrap items-center gap-3">
          {result?.message && <p role="status" className={`max-w-xs text-sm ${result.ok ? "text-accent" : "text-danger"}`}>{result.message}</p>}
          <Button disabled={pending} onClick={() => start(async () => {
            const payload = Object.fromEntries(ROLES.map((r) => [r, [...m[r]]]));
            const local = ROLES.flatMap((r) => validateMatrixChange(r, payload[r]!));
            setResult(local.length ? { ok: false, message: local.join(" ") } : await savePermissions(payload));
          })}>{pending ? "Salvando…" : "Salvar"}</Button>
          <Button tone="quiet" disabled={pending} onClick={() => start(async () => { const r = await resetPermissions(); setResult(r); if (r.ok) window.location.reload(); })}>Restaurar padrão</Button>
        </div>
      </header>

      <DataTable
        tour="permissions-matrix"
        caption="Matriz de permissões por papel"
        className="[&_table]:text-[13px] [&_td]:px-3! [&_td]:py-0.5! [&_td]:leading-4 [&_th]:px-3! [&_th]:py-1.5! [&_th]:text-xs"
      >
        <THead>
          <Th>Permissão</Th>
          {COLUMNS.map((r) => (
            <Th key={r} align="center" width={108}>
              <span className="text-ink" title={countLabel(counts[r] ?? 0, "pessoa", "pessoas")}>{ROLE_LABEL[r]}</span>
              <span className="ml-1 font-normal text-muted">{counts[r] ?? 0}</span>
            </Th>
          ))}
        </THead>
        <TBody>
          {groups.map((g) => (
            <Fragment key={g}>
              <TableGroupRow colSpan={5}>{g}</TableGroupRow>
              {PERMISSION_DEFS.filter((p) => p.group === g).map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <span className="text-ink" title={p.id}>{p.label}</span>
                  </Td>
                  <Td align="center"><LockedCell checked label={`Owner: ${p.label}`} /></Td>
                  {ROLES.map((r) => {
                    const locked = disabledFor(r, p);
                    const checked = m[r].has(p.id);
                    return (
                      <Td key={r} align="center">
                        {locked ? (
                          <LockedCell checked={checked} label={`${ROLE_LABEL[r]}: ${p.label}`} />
                        ) : (
                          <input type="checkbox" checked={checked} onChange={() => toggle(r, p.id)} aria-label={`${ROLE_LABEL[r]}: ${p.label}`} className="size-3.5 accent-accent" />
                        )}
                      </Td>
                    );
                  })}
                </Tr>
              ))}
            </Fragment>
          ))}
        </TBody>
      </DataTable>
    </div>
  );
}

/** Marcação travada: preenchida quando está sempre ativa, vazia quando o papel não pode receber. */
function LockedCell({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-disabled="true"
      aria-label={label}
      title={checked ? "Sempre ativo" : "Não disponível para este papel"}
      className={checked
        ? "inline-grid size-3.5 place-items-center rounded-[3px] bg-ink text-paper"
        : "inline-block size-3.5 rounded-[3px] border border-line"}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden="true">
          <path d="M2.5 6.2 4.8 8.5 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
