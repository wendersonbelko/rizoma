import type { Role } from "./types";

/**
 * Permissões configuráveis por papel (RN-20 a RN-29).
 * O admin edita a matriz na tela Permissões; OWNER sempre tem tudo.
 * Toda checagem acontece no servidor; a interface só esconde botões.
 */
export const PERMISSION_DEFS = [
  { id: "catalog:read", group: "Catálogo", label: "Ver catálogo, documentação e regras de negócio", required: true },
  { id: "catalog:read_private", group: "Catálogo", label: "Ver serviços restritos de outros times" },
  { id: "graph:read", group: "Catálogo", label: "Ver o mapa de ligações" },
  { id: "envvars:read", group: "Variáveis de ambiente", label: "Ver variáveis (valores de segredos ficam ocultos)" },
  { id: "envvars:reveal", group: "Variáveis de ambiente", label: "Revelar segredos dos serviços do próprio time" },
  { id: "envvars:edit", group: "Variáveis de ambiente", label: "Editar variáveis dos serviços do próprio time" },
  { id: "docs:edit", group: "Serviços", label: "Editar regras de negócio dos serviços do próprio time" },
  { id: "service:create", group: "Serviços", label: "Cadastrar serviços para o próprio time" },
  { id: "service:edit", group: "Serviços", label: "Editar serviços do próprio time (dados, ligações e integrações)" },
  { id: "service:edit_any", group: "Serviços", label: "Editar qualquer serviço, inclusive variáveis, segredos e regras" },
  { id: "service:archive", group: "Serviços", label: "Arquivar e restaurar serviços" },
  { id: "spec:publish", group: "Serviços", label: "Importar spec manualmente e sincronizar (próprio time)" },
  { id: "token:manage", group: "Serviços", label: "Gerar e revogar tokens de CI (próprio time)" },
  { id: "link:edit", group: "Serviços", label: "Cadastrar repositórios e integrações externas compartilhadas" },
  { id: "team:manage", group: "Administração", label: "Criar times e gerenciar membros", sensitive: true },
  { id: "access:decide", group: "Administração", label: "Aprovar e recusar solicitações de acesso", sensitive: true },
  { id: "user:manage", group: "Administração", label: "Convidar pessoas, mudar papéis e suspender", sensitive: true },
  { id: "audit:read", group: "Administração", label: "Ver e exportar a auditoria", sensitive: true },
  { id: "appearance:manage", group: "Administração", label: "Mudar o nome e a cor de destaque do sistema", sensitive: true },
  { id: "settings:manage", group: "Administração", label: "Configurações: login, ambientes, repositórios e regras de acesso", sensitive: true },
  { id: "roles:manage", group: "Administração", label: "Editar esta matriz de permissões", sensitive: true },
] as const;

export type Permission = (typeof PERMISSION_DEFS)[number]["id"];
export const ALL_PERMISSIONS = PERMISSION_DEFS.map((p) => p.id) as Permission[];
const SENSITIVE = new Set<string>(PERMISSION_DEFS.filter((p) => "sensitive" in p && p.sensitive).map((p) => p.id));
const REQUIRED = new Set<string>(PERMISSION_DEFS.filter((p) => "required" in p && p.required).map((p) => p.id));

export const DEFAULT_MATRIX: Record<Role, Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS.filter((p) => p !== "settings:manage" && p !== "roles:manage"),
  MAINTAINER: ["catalog:read", "graph:read", "envvars:read", "envvars:reveal", "envvars:edit", "docs:edit", "service:create", "service:edit", "spec:publish", "token:manage", "link:edit"],
  VIEWER: ["catalog:read", "graph:read", "envvars:read"],
};

export type PermissionSet = ReadonlySet<string>;
export type Matrix = Record<Role, PermissionSet>;

/** Matriz efetiva a partir das linhas do banco (vazio = padrão). OWNER e obrigatórias sempre presentes. */
export function buildMatrix(rows: { role: Role; permission: string }[]): Matrix {
  const source: Record<Role, string[]> = rows.length
    ? { OWNER: [], ADMIN: [], MAINTAINER: [], VIEWER: [] }
    : { ...DEFAULT_MATRIX };
  if (rows.length) for (const r of rows) source[r.role].push(r.permission);
  const known = new Set<string>(ALL_PERMISSIONS);
  const out = {} as Record<Role, Set<string>>;
  for (const role of ["OWNER", "ADMIN", "MAINTAINER", "VIEWER"] as Role[]) {
    out[role] = new Set(role === "OWNER" ? ALL_PERMISSIONS : [...source[role].filter((p) => known.has(p)), ...REQUIRED]);
  }
  return out;
}

export interface Subject { permissions: PermissionSet }

export function can(subject: Subject | null | undefined, permission: Permission): boolean {
  return !!subject && subject.permissions.has(permission);
}

/** Validação de uma alteração na matriz (RN-26 a RN-29). */
export function validateMatrixChange(role: Role, permissions: string[]): string[] {
  const errors: string[] = [];
  if (role === "OWNER") errors.push("O papel OWNER sempre tem todas as permissões.");
  const unknown = permissions.filter((p) => !ALL_PERMISSIONS.includes(p as Permission));
  if (unknown.length) errors.push(`Permissões desconhecidas: ${unknown.join(", ")}.`);
  for (const r of REQUIRED) if (!permissions.includes(r)) errors.push("Ver o catálogo é obrigatório para todos os papéis.");
  if (role !== "ADMIN") {
    const bad = permissions.filter((p) => SENSITIVE.has(p));
    if (bad.length) errors.push(`Permissões administrativas só podem ser dadas a ADMIN: ${bad.join(", ")}.`);
  }
  return errors;
}

/**
 * Serviço do próprio time: exige a permissão pedida + fazer parte do time responsável.
 * `service:edit_any` libera qualquer serviço (RN-22).
 */
export function canManageService(
  actor: Subject & { teamIds: string[] },
  service: { ownerTeamId: string | null },
  scoped: Permission = "service:edit",
): boolean {
  if (actor.permissions.has("service:edit_any")) return true;
  if (!actor.permissions.has(scoped)) return false;
  return service.ownerTeamId !== null && actor.teamIds.includes(service.ownerTeamId);
}

/**
 * Filtro da listagem do catálogo (RN-30). A página monta o `where` do Prisma a partir disto,
 * para a paginação usar o mesmo critério de canSeeService.
 */
export type CatalogVisibility =
  | { scope: "none" }
  | { scope: "all" }
  | { scope: "org-or-teams"; teamIds: string[] };

export function catalogVisibility(actor: Subject & { teamIds: string[] }): CatalogVisibility {
  if (!actor.permissions.has("catalog:read")) return { scope: "none" };
  if (actor.permissions.has("catalog:read_private")) return { scope: "all" };
  return { scope: "org-or-teams", teamIds: actor.teamIds };
}

/** O serviço passaria no filtro de catalogVisibility? Independente de canSeeService, para os dois poderem ser comparados. */
export function matchesCatalogVisibility(
  filter: CatalogVisibility,
  service: { visibility: "ORG" | "TEAM"; ownerTeamId: string | null },
): boolean {
  if (filter.scope === "none") return false;
  if (filter.scope === "all") return true;
  if (service.visibility === "ORG") return true;
  return service.ownerTeamId !== null && filter.teamIds.includes(service.ownerTeamId);
}

/** Visibilidade no catálogo (RN-30). */
export function canSeeService(
  actor: Subject & { teamIds: string[] },
  service: { visibility: "ORG" | "TEAM"; ownerTeamId: string | null },
): boolean {
  if (!actor.permissions.has("catalog:read")) return false;
  if (service.visibility === "ORG") return true;
  if (actor.permissions.has("catalog:read_private")) return true;
  return service.ownerTeamId !== null && actor.teamIds.includes(service.ownerTeamId);
}

const RANK: Record<Role, number> = { OWNER: 4, ADMIN: 3, MAINTAINER: 2, VIEWER: 1 };

/** Troca de papel (RN-24, RN-25). */
export function canChangeRole(input: {
  actor: { id: string; role: Role; permissions: PermissionSet };
  target: { id: string; role: Role };
  newRole: Role;
  ownerCount: number;
}): { ok: true } | { ok: false; reason: string } {
  const { actor, target, newRole, ownerCount } = input;
  if (actor.id === target.id) return { ok: false, reason: "Você não pode alterar o próprio papel." };
  if (!actor.permissions.has("user:manage")) return { ok: false, reason: "Sem permissão para gerenciar pessoas." };
  if ((newRole === "OWNER" || target.role === "OWNER") && actor.role !== "OWNER")
    return { ok: false, reason: "Somente um OWNER pode conceder ou retirar o papel OWNER." };
  if (actor.role !== "OWNER" && RANK[target.role] >= RANK[actor.role])
    return { ok: false, reason: "Você não pode alterar alguém do mesmo nível ou acima." };
  if (actor.role !== "OWNER" && RANK[newRole] >= RANK[actor.role])
    return { ok: false, reason: "Você não pode dar um papel do seu nível ou acima." };
  if (target.role === "OWNER" && newRole !== "OWNER" && ownerCount <= 1)
    return { ok: false, reason: "A instalação precisa ter pelo menos um OWNER." };
  return { ok: true };
}

/** Atalho para testes e scripts: permissões padrão de um papel. */
export function defaultSubject(role: Role, teamIds: string[] = []) {
  return { role, teamIds, permissions: buildMatrix([])[role] };
}
