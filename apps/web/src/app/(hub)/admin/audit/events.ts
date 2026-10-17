import type { Prisma } from "@api-hub/db";
import { LINK_KIND_LABEL, ROLE_LABEL, SERVICE_REPO_ROLE_LABEL, SPEC_SOURCE_LABEL, plural } from "@api-hub/core";
import { STATUS_LABEL } from "../people/labels";

/**
 * Tipos de evento do filtro da Auditoria. A chave é o valor de `?group=` (não muda: links antigos
 * continuam valendo); `prefixes` diz quais ações entram. Vários prefixos viram um tipo só para o
 * filtro não ter doze opções quase iguais.
 */
export type AuditGroup = { key: string; label: string; prefixes: string[] };

export const AUDIT_GROUP_LIST: AuditGroup[] = [
  { key: "auth.", label: "Login e saída", prefixes: ["auth."] },
  { key: "access.", label: "Acesso", prefixes: ["access."] },
  { key: "user.", label: "Pessoas", prefixes: ["user."] },
  { key: "team.", label: "Times", prefixes: ["team."] },
  { key: "service.", label: "Serviços", prefixes: ["service.", "envvar.", "doc."] },
  { key: "link.", label: "Vínculos", prefixes: ["link."] },
  { key: "repository.", label: "Repositórios", prefixes: ["repository.", "repo.", "hub."] },
  { key: "integration.", label: "Integrações externas", prefixes: ["integration."] },
  { key: "token.", label: "Tokens", prefixes: ["token."] },
  { key: "spec.", label: "Publicação de specs", prefixes: ["spec."] },
  { key: "roles.", label: "Permissões", prefixes: ["roles."] },
  { key: "settings.", label: "Configurações", prefixes: ["settings.", "appearance."] },
  { key: "owner.", label: "Recuperação de proprietário", prefixes: ["owner."] },
  { key: "setup.", label: "Instalação", prefixes: ["setup."] },
  { key: "graph.", label: "Mapa de ligações", prefixes: ["graph."] },
  { key: "audit.", label: "Auditoria", prefixes: ["audit."] },
];

export const AUDIT_GROUPS: Record<string, string> = Object.fromEntries(AUDIT_GROUP_LIST.map((g) => [g.key, g.label]));

/** Tipo de evento de uma ação, para a linha ("Login e saída · há 2 h"). */
export function auditGroupLabel(action: string): string {
  return AUDIT_GROUP_LIST.find((g) => g.prefixes.some((p) => action.startsWith(p)))?.label ?? "Sistema";
}

/** Como o tipo do alvo aparece nos detalhes. */
export const AUDIT_TARGET_LABEL: Record<string, string> = {
  service: "Serviço",
  user: "Pessoa",
  team: "Time",
  integration: "Integração externa",
};

/**
 * Nome do alvo para a frase. Some quando o alvo é o próprio autor ("entrou no sistema" não precisa
 * repetir quem entrou) e quando o registro já não existe: nunca vira id nem "@null" (achado V1).
 */
export function auditTargetName(
  row: { actorId: string | null; targetType: string | null; targetId: string | null },
  names: Record<string, string>,
): string | undefined {
  if (!row.targetId) return undefined;
  if (row.targetType === "user" && row.targetId === row.actorId) return undefined;
  return names[row.targetId];
}

const meta = (v: Prisma.JsonValue | null, key: string): string | undefined => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const val = (v as Record<string, unknown>)[key];
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return typeof val === "string" && val.trim() ? val : undefined;
};
const num = (v: Prisma.JsonValue | null, key: string): number | undefined => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const val = (v as Record<string, unknown>)[key];
  return typeof val === "number" ? val : undefined;
};

/** Papel do metadata em português; valor desconhecido não aparece cru. */
const roleOf = (v: string | undefined) => (v ? (ROLE_LABEL[v as keyof typeof ROLE_LABEL] ?? undefined) : undefined);
const statusOf = (v: string | undefined) => (v ? (STATUS_LABEL[v as keyof typeof STATUS_LABEL] ?? undefined) : undefined);

/** Quem foi adicionado ao time: o nome gravado pela ação, senão o que foi digitado (`fulano` vira `@fulano`). */
const typedPerson = (m: Prisma.JsonValue | null) => {
  const name = meta(m, "name");
  if (name) return name;
  const login = meta(m, "login");
  return login ? (login.includes("@") ? login : `@${login}`) : undefined;
};

/** Soma de permissões ganhas e perdidas de um `roles.updated`. */
function matrixChanges(m: Prisma.JsonValue | null): number | undefined {
  if (!m || typeof m !== "object" || Array.isArray(m)) return undefined;
  let total = 0;
  for (const role of Object.values(m as Record<string, unknown>)) {
    if (!role || typeof role !== "object") continue;
    const { added, removed } = role as { added?: unknown; removed?: unknown };
    total += (Array.isArray(added) ? added.length : 0) + (Array.isArray(removed) ? removed.length : 0);
  }
  return total;
}

/**
 * Frase do evento, com verbo e SEM o autor (achados V1 e V3 da auditoria de UX de 02/10/2026): a linha
 * monta "**Ana** criou o serviço Pedidos API". O alvo só entra quando existe e não é o próprio autor;
 * o código técnico, o IP e o JSON ficam em "Detalhes". Toda ação nova precisa de uma frase aqui.
 */
export function describeAuditEvent(row: { action: string; metadata: Prisma.JsonValue | null }, targetName: string | undefined): string {
  const m = row.metadata;
  const t = targetName;
  const kindLabel = (k?: string) => (k ? LINK_KIND_LABEL[k as keyof typeof LINK_KIND_LABEL] : undefined);
  const version = meta(m, "version") ? ` (v${meta(m, "version")})` : "";
  const env = meta(m, "env");
  const variable = meta(m, "key") ? `a variável ${meta(m, "key")}` : "uma variável";
  switch (row.action) {
    case "service.created": return t ? `criou o serviço ${t}` : "criou um serviço";
    case "service.updated": return t ? `atualizou os dados do serviço ${t}` : "atualizou os dados de um serviço";
    case "service.archived": return t ? `arquivou o serviço ${t}` : "arquivou um serviço";
    case "service.restored": return t ? `restaurou o serviço ${t}` : "restaurou um serviço";
    case "service.source_changed": {
      const source = meta(m, "specSource");
      return `definiu a origem da spec${source ? ` como "${SPEC_SOURCE_LABEL[source] ?? "outra origem"}"` : ""}${t ? ` no serviço ${t}` : ""}`;
    }
    case "repository.added": {
      const name = meta(m, "fullName") ?? t;
      return name ? `cadastrou o repositório ${name}` : "cadastrou um repositório";
    }
    case "link.created": {
      const from = meta(m, "fromName"), to = meta(m, "toName");
      if (!from || !to) return "criou um vínculo";
      const kind = kindLabel(meta(m, "kind"));
      if (kind) return `criou o vínculo ${from} ${kind} ${to}`;
      const role = SERVICE_REPO_ROLE_LABEL[meta(m, "role") as keyof typeof SERVICE_REPO_ROLE_LABEL];
      return `criou o vínculo ${from} → ${to}${role ? ` (${role})` : ""}`;
    }
    case "link.deleted": {
      const from = meta(m, "fromName"), to = meta(m, "toName");
      return from && to ? `removeu o vínculo ${from} → ${to}` : "removeu um vínculo";
    }
    case "token.created": return `criou um token de CI${t ? ` para o serviço ${t}` : ""}${meta(m, "prefix") ? ` (${meta(m, "prefix")}…)` : ""}`;
    case "token.revoked": return `revogou um token de CI${meta(m, "prefix") ? ` (${meta(m, "prefix")}…)` : ""}`;
    case "spec.uploaded": return `importou uma spec${t ? ` do serviço ${t}` : ""} em ${env ?? "um ambiente"}${version}`;
    case "spec.published": return `enviou uma spec${t ? ` do serviço ${t}` : ""} pelo CI em ${env ?? "um ambiente"}${version}`;
    case "spec.synced": return `sincronizou a spec${t ? ` do serviço ${t}` : ""}`;
    case "spec.breaking_notice": return `avisou ${meta(m, "sent") ?? 0} de ${meta(m, "recipients") ?? 0} ${plural(num(m, "recipients") ?? 0, "pessoa", "pessoas")} sobre uma mudança incompatível${t ? ` em ${t}` : ""}`;
    case "doc.created": return `criou a página de regras de negócio${meta(m, "title") ? ` "${meta(m, "title")}"` : ""}${t ? ` do serviço ${t}` : ""}`;
    case "doc.updated": return `atualizou a página de regras de negócio${meta(m, "title") ? ` "${meta(m, "title")}"` : ""}${t ? ` do serviço ${t}` : ""}`;
    case "doc.deleted": return `excluiu uma página de regras de negócio${t ? ` do serviço ${t}` : ""}`;
    case "doc.written": return meta(m, "removed") === "true"
      ? `removeu uma página de regras de negócio do repositório${meta(m, "path") ? ` (${meta(m, "path")})` : ""}`
      : `gravou uma página de regras de negócio no repositório${meta(m, "path") ? ` (${meta(m, "path")})` : ""}`;
    case "envvar.created": return `criou ${variable}${env ? ` em ${env}` : ""}${t ? ` no serviço ${t}` : ""}`;
    case "envvar.updated": return `atualizou ${variable}${env ? ` em ${env}` : ""}${t ? ` no serviço ${t}` : ""}`;
    case "envvar.deleted": return `excluiu ${variable}${env ? ` de ${env}` : ""}${t ? ` no serviço ${t}` : ""}`;
    case "envvar.revealed": return `revelou o valor de um segredo${meta(m, "key") ? ` (${meta(m, "key")})` : ""}${t ? ` no serviço ${t}` : ""}`;
    case "envvar.copied": return `copiou variáveis entre ambientes${t ? ` no serviço ${t}` : ""}`;
    case "envvar.exported": return `exportou as variáveis (.env)${env ? ` de ${env}` : ""}${t ? ` do serviço ${t}` : ""}`;
    case "integration.linked": return `vinculou uma integração externa${t ? ` ao serviço ${t}` : " a um serviço"}`;
    case "integration.unlinked": return `desvinculou uma integração externa${t ? ` do serviço ${t}` : " de um serviço"}`;
    case "integration.created": {
      const name = t ?? meta(m, "slug");
      return name ? `cadastrou a integração externa ${name}` : "cadastrou uma integração externa";
    }
    case "integration.updated": return t ? `atualizou a integração externa ${t}` : "atualizou uma integração externa";
    case "integration.deleted": {
      const name = t ?? meta(m, "slug");
      return name ? `excluiu a integração externa ${name}` : "excluiu uma integração externa";
    }
    case "team.created": return t ? `criou o time ${t}` : "criou um time";
    case "team.member_added": return `adicionou ${typedPerson(m) ?? "uma pessoa"} ao time${t ? ` ${t}` : ""}`;
    case "team.member_removed": return `removeu ${meta(m, "name") ?? "uma pessoa"} do time${t ? ` ${t}` : ""}`;
    case "team.github_synced": return `sincronizou o time${t ? ` ${t}` : ""} com o GitHub (${meta(m, "linked") ?? 0} de ${meta(m, "github") ?? 0} ${plural(num(m, "github") ?? 0, "pessoa vinculada", "pessoas vinculadas")})`;
    case "hub.applied": return `aplicou o hub.json${meta(m, "repository") ? ` de ${meta(m, "repository")}` : ""}`;
    case "hub.written": return `gravou o hub.json${meta(m, "repository") ? ` em ${meta(m, "repository")}` : ""}`;
    case "repo.synced": return `sincronizou o repositório${meta(m, "repository") ? ` ${meta(m, "repository")}` : ""}${num(m, "conflicts") ? ` (${num(m, "conflicts")} ${plural(num(m, "conflicts")!, "conflito", "conflitos")})` : ""}`;
    case "repo.conflict_resolved": return `resolveu um conflito com o repositório (${meta(m, "field") ?? "campo"}, ficou o valor ${meta(m, "side") === "git" ? "do Git" : "do hub"})`;
    case "graph.printed": return "gerou um print do mapa de ligações";
    case "user.role_changed": {
      const from = roleOf(meta(m, "from")), to = roleOf(meta(m, "to"));
      return `mudou o papel${t ? ` de ${t}` : ""}${from && to ? ` de ${from} para ${to}` : to ? ` para ${to}` : ""}`;
    }
    case "user.suspended": return `suspendeu o acesso${t ? ` de ${t}` : ""}`;
    case "user.reactivated": return `reativou o acesso${t ? ` de ${t}` : ""}`;
    case "user.tour_completed": return "concluiu o tour guiado";
    case "user.invited": {
      const role = roleOf(meta(m, "role"));
      return `convidou ${meta(m, "email") ?? "uma pessoa"}${role ? ` como ${role}` : ""}`;
    }
    case "user.password_reset_link": return `gerou um link de nova senha${meta(m, "email") ? ` para ${meta(m, "email")}` : ""}`;
    case "user.invite_accepted": return "aceitou o convite e criou a senha";
    case "user.password_reset": return "criou uma nova senha";
    case "access.requested": return t ? `pediu acesso para ${t}` : "pediu acesso";
    case "access.approved": {
      const role = roleOf(meta(m, "role"));
      return `aprovou o acesso${t ? ` de ${t}` : ""}${role ? ` como ${role}` : ""}`;
    }
    case "access.rejected": return `recusou a solicitação de acesso${t ? ` de ${t}` : ""}`;
    case "access.denied": return `teve o login recusado${meta(m, "reason") === "not_member" ? " (não faz parte da empresa)" : ""}${t ? `: ${t}` : ""}`;
    case "access.status_changed": {
      const from = statusOf(meta(m, "from")), to = statusOf(meta(m, "to"));
      return `teve o status mudado${from && to ? ` de ${from} para ${to}` : ""} automaticamente${t ? ` (${t})` : ""}`;
    }
    case "access.reason_updated": return `atualizou a justificativa da solicitação de acesso${t ? ` de ${t}` : ""}`;
    case "auth.sign_in": return "entrou no sistema";
    case "auth.sign_out": return "saiu do sistema";
    case "auth.locked": return `teve a conta bloqueada por tentativas de senha erradas${t ? ` (${t})` : ""}`;
    case "roles.updated": {
      const n = matrixChanges(m);
      return `alterou a matriz de permissões${n ? ` (${n} ${plural(n, "mudança", "mudanças")})` : ""}`;
    }
    case "roles.reset": return "restaurou a matriz de permissões ao padrão";
    case "appearance.updated": return "atualizou a marca (nome e cor de destaque)";
    case "settings.organization": return "atualizou os dados da organização";
    case "settings.login": return "atualizou as formas de login";
    case "settings.repositories": return "atualizou as integrações de repositório";
    case "settings.environments": return meta(m, "removed") ? `removeu o ambiente ${meta(m, "removed")}` : "atualizou os ambientes";
    case "settings.policies": return "atualizou as regras de acesso";
    case "settings.sessions_revoked": {
      const n = num(m, "users") ?? num(m, "count");
      return `encerrou as sessões${n !== undefined ? ` de ${n} ${plural(n, "pessoa", "pessoas")}` : " de todas as pessoas"}`;
    }
    case "settings.membership_recheck": return "forçou a verificação de vínculo com a empresa";
    case "settings.email": return meta(m, "configured") === "false" ? "desligou o envio de e-mail" : "atualizou o servidor de e-mail";
    case "settings.email_tested": return "testou a conexão do servidor de e-mail";
    case "settings.webhook_secret": return `gerou um segredo de webhook${meta(m, "type") ? ` (${meta(m, "type")})` : ""}`;
    case "settings.sync_token": return "gerou o token da sincronização agendada";
    case "owner.recovery_opened": return `abriu uma janela de recuperação de proprietário${meta(m, "login") ? ` para ${meta(m, "login")}` : ""}`;
    case "owner.recovered": return "recuperou o acesso de proprietário";
    case "owner.recovery_cancelled": return "cancelou a recuperação de proprietário";
    case "audit.exported": return "exportou a auditoria em CSV";
    case "setup.owner_created": return "criou o primeiro proprietário na instalação";
    case "setup.login_saved": return "configurou as formas de login na instalação";
    case "setup.email_saved": return "configurou o servidor de e-mail na instalação";
    case "setup.email_skipped": return "pulou a configuração de e-mail na instalação";
    case "setup.completed": return "concluiu a instalação";
    // Ação sem frase própria: o código vai entre aspas para não parecer texto do sistema.
    default: return `registrou a ação "${row.action}"${t ? ` em ${t}` : ""}`;
  }
}
