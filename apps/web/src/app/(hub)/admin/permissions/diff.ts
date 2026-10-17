import { PERMISSION_DEFS } from "@api-hub/core/rbac";

/** Papéis cuja coluna se edita na matriz. O Proprietário sempre tem tudo e não entra. */
export type Editable = "ADMIN" | "MAINTAINER" | "VIEWER";
export const EDITABLE_ROLES: Editable[] = ["ADMIN", "MAINTAINER", "VIEWER"];

export type MatrixState = Record<Editable, ReadonlySet<string>>;
export type RoleChange = { role: Editable; gained: string[]; lost: string[] };

export function toMatrixState(lists: Record<Editable, string[]>): MatrixState {
  return { ADMIN: new Set(lists.ADMIN), MAINTAINER: new Set(lists.MAINTAINER), VIEWER: new Set(lists.VIEWER) };
}

/**
 * O que mudou entre a matriz salva e a editada, por papel (achado F2 da auditoria de UX de 02/10/2026:
 * "quem ganha o quê?"). Só entram papéis com mudança; as permissões saem na ordem da tela.
 */
export function diffMatrix(before: MatrixState, after: MatrixState): RoleChange[] {
  const changes: RoleChange[] = [];
  for (const role of EDITABLE_ROLES) {
    const gained = PERMISSION_DEFS.filter((p) => after[role].has(p.id) && !before[role].has(p.id)).map((p) => p.id);
    const lost = PERMISSION_DEFS.filter((p) => before[role].has(p.id) && !after[role].has(p.id)).map((p) => p.id);
    if (gained.length || lost.length) changes.push({ role, gained, lost });
  }
  return changes;
}

/** Total de células mudadas: é o "N mudanças" da barra e do botão de salvar. */
export function countChanges(changes: RoleChange[]): number {
  return changes.reduce((total, c) => total + c.gained.length + c.lost.length, 0);
}

/** Texto da permissão para a tela. */
export function permissionLabel(id: string): string {
  return PERMISSION_DEFS.find((p) => p.id === id)?.label ?? id;
}
