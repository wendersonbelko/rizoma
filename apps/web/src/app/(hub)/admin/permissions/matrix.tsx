"use client";

import { Fragment, useMemo, useState, type MouseEvent } from "react";
import { useLeaveWarning } from "@/components/save-bar";
import { PERMISSION_DEFS, validateMatrixChange } from "@api-hub/core/rbac";
import { ROLE_LABEL } from "@api-hub/core/types";
import { countLabel, plural } from "@api-hub/core/text";
import { Button } from "@/components/ui";
import { DataTable, TBody, THead, TableGroupRow, Td, Th, Tr } from "@/components/table";
import { plainRoles } from "../people/labels";
import { savePermissions, type PermResult } from "./actions";
import { ChangeBar } from "./change-bar";
import { EDITABLE_ROLES, diffMatrix, toMatrixState, type Editable, type MatrixState } from "./diff";
import { EditableCell, LockedCell, lockedReason } from "./matrix-cell";

const COLUMNS = ["OWNER", ...EDITABLE_ROLES] as const;

// Realce da coluna sob o mouse (achado F2 da auditoria de UX de 02/10/2026). As classes precisam estar
// escritas por extenso para o Tailwind gerá-las, por isso um mapa por posição da coluna (1 = a permissão).
// O cabeçalho usa uma mistura opaca: com o cabeçalho fixo, um fundo translúcido deixaria as linhas aparecerem por baixo.
const COLUMN_HIGHLIGHT: Record<number, string> = {
  2: "[&_thead_th:nth-child(2)]:bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-sheet))] [&_tbody_td:nth-child(2)]:bg-accent/10",
  3: "[&_thead_th:nth-child(3)]:bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-sheet))] [&_tbody_td:nth-child(3)]:bg-accent/10",
  4: "[&_thead_th:nth-child(4)]:bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-sheet))] [&_tbody_td:nth-child(4)]:bg-accent/10",
  5: "[&_thead_th:nth-child(5)]:bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-sheet))] [&_tbody_td:nth-child(5)]:bg-accent/10",
};
// Linha sob o mouse: realce mais forte que o hover padrão da tabela. A linha de grupo (td com colspan) fica de fora.
const ROW_HIGHLIGHT = "[&_tbody_tr:hover>td:not([colspan])]:bg-accent/10";

/** Chave estável da matriz vinda do servidor, para perceber que ela mudou (salvou, restaurou o padrão). */
const keyOf = (initial: Record<Editable, string[]>) => JSON.stringify(EDITABLE_ROLES.map((r) => [...initial[r]].sort()));

export function PermissionMatrix({ initial, counts }: { initial: Record<Editable, string[]>; counts: Record<string, number> }) {
  const [seenKey, setSeenKey] = useState(() => keyOf(initial));
  const [saved, setSaved] = useState<MatrixState>(() => toMatrixState(initial));
  const [m, setM] = useState<MatrixState>(() => toMatrixState(initial));
  const [status, setStatus] = useState<PermResult | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [hoverColumn, setHoverColumn] = useState<number | null>(null);
  const groups = [...new Set(PERMISSION_DEFS.map((p) => p.group))];

  // Quando o servidor devolve outra matriz (salvou, restaurou o padrão), o que está na tela passa a ser ela.
  const serverKey = keyOf(initial);
  if (serverKey !== seenKey) {
    setSeenKey(serverKey);
    setSaved(toMatrixState(initial));
    setM(toMatrixState(initial));
  }

  const changes = useMemo(() => diffMatrix(saved, m), [saved, m]);
  // Sair da página com a matriz editada perderia as mudanças em silêncio.
  useLeaveWarning(changes.length > 0);
  const isChanged = (role: Editable, id: string) => saved[role].has(id) !== m[role].has(id);

  const toggle = (role: Editable, perm: string) => {
    const next = new Set(m[role]);
    if (next.has(perm)) next.delete(perm); else next.add(perm);
    setM({ ...m, [role]: next });
    setStatus(null);
  };
  const isLocked = (role: Editable, p: (typeof PERMISSION_DEFS)[number]) =>
    ("required" in p && p.required) || (role !== "ADMIN" && "sensitive" in p && p.sensitive);

  const toggleGroup = (g: string) => {
    const next = new Set(collapsed);
    if (next.has(g)) next.delete(g); else next.add(g);
    setCollapsed(next);
  };
  const allCollapsed = collapsed.size === groups.length;

  async function save(): Promise<PermResult> {
    const payload = Object.fromEntries(EDITABLE_ROLES.map((r) => [r, [...m[r]]])) as Record<Editable, string[]>;
    const local = EDITABLE_ROLES.flatMap((r) => validateMatrixChange(r, payload[r]));
    if (local.length) return { ok: false, message: plainRoles(local.join(" ")) };
    return savePermissions(payload);
  }

  function hoverCell(e: MouseEvent<HTMLElement>) {
    const cell = (e.target as Element).closest("td, th");
    // cellIndex 0 é a coluna da permissão (e a linha de grupo): sem realce de coluna.
    setHoverColumn(cell instanceof HTMLTableCellElement && cell.cellIndex > 0 ? cell.cellIndex + 1 : null);
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Permissões</h1>
          <p data-tour="permissions-rules" className="text-sm text-muted">
            O Proprietário sempre tem tudo. Ver o catálogo é obrigatório. Administração só no Administrador.
          </p>
        </div>
        <div data-tour="permissions-actions" className="flex shrink-0 flex-wrap items-center gap-3">
          {status?.message && <p role="status" className={`max-w-xs text-sm ${status.ok ? "text-accent" : "text-danger"}`}>{status.message}</p>}
          <Button type="button" tone="quiet" onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(groups))}>
            {allCollapsed ? "Expandir grupos" : "Recolher grupos"}
          </Button>
        </div>
      </header>

      <div
        onMouseOver={hoverCell}
        onMouseLeave={() => setHoverColumn(null)}
        className={`${ROW_HIGHLIGHT} ${hoverColumn ? COLUMN_HIGHLIGHT[hoverColumn] ?? "" : ""}`}
      >
        <DataTable
          tour="permissions-matrix"
          caption="Matriz de permissões por papel"
          stickyHeader
          className="[&_table]:text-[13px] [&_td]:px-3! [&_td]:py-1! [&_td]:leading-4 [&_th]:px-3! [&_th]:py-1.5! [&_th]:text-xs"
        >
          <THead sticky>
            <Th>Permissão</Th>
            {COLUMNS.map((r) => (
              <Th key={r} align="center" width={124}>
                <span className="text-ink" title={countLabel(counts[r] ?? 0, "pessoa", "pessoas")}>{ROLE_LABEL[r]}</span>
                <span className="ml-1 font-normal text-muted">{counts[r] ?? 0}</span>
              </Th>
            ))}
          </THead>
          <TBody>
            {groups.map((g) => {
              const defs = PERMISSION_DEFS.filter((p) => p.group === g);
              const open = !collapsed.has(g);
              const changedHere = defs.reduce((n, p) => n + EDITABLE_ROLES.filter((r) => isChanged(r, p.id)).length, 0);
              return (
                <Fragment key={g}>
                  <TableGroupRow colSpan={5}>
                    <button type="button" aria-expanded={open} onClick={() => toggleGroup(g)} className="flex w-full items-center gap-2 text-left uppercase tracking-wide">
                      <span aria-hidden="true" className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
                      {g}
                      <span className="font-normal normal-case tracking-normal">({defs.length})</span>
                      {!open && changedHere > 0 && (
                        <span className="rounded-full bg-wait/20 px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-ink">
                          {changedHere} {plural(changedHere, "mudança", "mudanças")}
                        </span>
                      )}
                    </button>
                  </TableGroupRow>
                  {open && defs.map((p) => (
                    <Tr key={p.id}>
                      <Td><span className="text-ink">{p.label}</span></Td>
                      <Td align="center"><LockedCell checked label={`${ROLE_LABEL.OWNER}: ${p.label}`} reason={lockedReason(p, "OWNER", true)} /></Td>
                      {EDITABLE_ROLES.map((r) => {
                        const checked = m[r].has(p.id);
                        const label = `${ROLE_LABEL[r]}: ${p.label}`;
                        return (
                          <Td key={r} align="center">
                            {isLocked(r, p)
                              ? <LockedCell checked={checked} label={label} reason={lockedReason(p, r, checked)} />
                              : <EditableCell checked={checked} changed={isChanged(r, p.id)} label={label} onToggle={() => toggle(r, p.id)} />}
                          </Td>
                        );
                      })}
                    </Tr>
                  ))}
                </Fragment>
              );
            })}
          </TBody>
        </DataTable>
      </div>

      {changes.length > 0 && (
        <ChangeBar
          changes={changes}
          onDiscard={() => { setM(saved); setStatus(null); }}
          onSave={save}
          onSaved={(result) => { setSaved(m); setStatus(result); }}
        />
      )}
    </div>
  );
}
