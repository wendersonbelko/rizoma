import { prisma, type Prisma } from "@api-hub/db";
import { LINK_KIND_LABEL, SPEC_SOURCE_LABEL, pageInfo, type PageRequest } from "@api-hub/core";

export const AUDIT_GROUPS: Record<string, string> = {
  "auth.": "Login e saída",
  "access.": "Acesso",
  "user.": "Pessoas",
  "team.": "Times",
  "service.": "Serviços",
  "link.": "Vínculos",
  "repository.": "Repositórios",
  "token.": "Tokens",
  "spec.": "Publicação de specs",
  "settings.": "Configurações",
  "owner.": "Recuperação de OWNER",
  "setup.": "Instalação",
};

export type AuditFilters = { actor?: string; group?: string; from?: string; to?: string; target?: string; page?: string; size?: string; id?: string };

function auditWhere(f: AuditFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (f.group && f.group in AUDIT_GROUPS) where.action = { startsWith: f.group };
  if (f.actor) {
    const who = f.actor.trim().toLowerCase().replace(/^@/, "");
    where.actor = who.includes("@") ? { email: who } : { githubLogin: who };
  }
  if (f.target) where.targetId = f.target.trim();
  const from = f.from ? new Date(`${f.from}T00:00:00`) : null;
  const to = f.to ? new Date(`${f.to}T23:59:59.999`) : null;
  if ((from && !isNaN(+from)) || (to && !isNaN(+to))) {
    where.createdAt = { ...(from && !isNaN(+from) ? { gte: from } : {}), ...(to && !isNaN(+to) ? { lte: to } : {}) };
  }
  return where;
}

export async function queryAudit(f: AuditFilters, request: PageRequest) {
  const where = auditWhere(f);
  const info = pageInfo(await prisma.auditLog.count({ where }), request);
  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: info.skip,
    take: info.take,
    include: { actor: { select: { githubLogin: true, email: true } } },
  });
  return { rows, info, targets: await targetNames(rows) };
}

/** Nomes legíveis para os alvos (serviço, pessoa, time) em vez do id interno. */
async function targetNames(rows: { targetType: string | null; targetId: string | null }[]) {
  const ids = (type: string) => [...new Set(rows.filter((r) => r.targetType === type && r.targetId).map((r) => r.targetId!))];
  const [services, users, teams] = await Promise.all([
    prisma.service.findMany({ where: { id: { in: ids("service") } }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { id: { in: ids("user") } }, select: { id: true, githubLogin: true, email: true } }),
    prisma.team.findMany({ where: { id: { in: ids("team") } }, select: { id: true, name: true } }),
  ]);
  const names = new Map<string, string>();
  services.forEach((x) => names.set(x.id, x.name));
  users.forEach((x) => names.set(x.id, `@${x.githubLogin}`));
  teams.forEach((x) => names.set(x.id, `time ${x.name}`));
  return Object.fromEntries(names);
}

/** Nome legível de um único alvo. */
export async function targetNameFor(type: string | null, id: string | null) {
  if (!id) return undefined;
  const names = await targetNames([{ targetType: type, targetId: id }]);
  return names[id];
}

const meta = (v: Prisma.JsonValue | null, key: string): string | undefined => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const val = (v as Record<string, unknown>)[key];
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return typeof val === "string" ? val : undefined;
};
const num = (v: Prisma.JsonValue | null, key: string): number | undefined => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const val = (v as Record<string, unknown>)[key];
  return typeof val === "number" ? val : undefined;
};

const ROLE_LABEL: Record<string, string> = { OWNER: "Owner", ADMIN: "Admin", MAINTAINER: "Mantenedor", VIEWER: "Leitor" };
const humanizeFallback = (action: string) => action.replace(/[._]/g, " ");

/**
 * Achado da revisão de UX de 28/09/2026: "Ação" mostrava códigos técnicos (spec.uploaded,
 * link.created…) e "Alvo" ficava em branco justamente nos eventos de vínculo — os mais difíceis
 * de entender sem contexto. Aqui viram frases; o código técnico continua disponível em "ver".
 */
export function describeAuditEvent(row: { action: string; metadata: Prisma.JsonValue | null }, targetName: string | undefined): string {
  const m = row.metadata;
  const kindLabel = (k?: string) => (k ? (LINK_KIND_LABEL[k as keyof typeof LINK_KIND_LABEL] ?? k) : undefined);
  switch (row.action) {
    case "service.created": return `Serviço criado${targetName ? `: ${targetName}` : ""}`;
    case "service.updated": return `Dados do serviço atualizados${targetName ? `: ${targetName}` : ""}`;
    case "service.archived": return `Serviço arquivado${targetName ? `: ${targetName}` : ""}`;
    case "service.restored": return `Serviço restaurado${targetName ? `: ${targetName}` : ""}`;
    case "service.source_changed": return `Origem da spec definida como "${SPEC_SOURCE_LABEL[meta(m, "specSource") as keyof typeof SPEC_SOURCE_LABEL] ?? meta(m, "specSource")}"${targetName ? ` em ${targetName}` : ""}`;
    case "repository.added": return `Repositório cadastrado: ${meta(m, "fullName") ?? targetName ?? ""}`;
    case "link.created": {
      const from = meta(m, "fromName"), to = meta(m, "toName"), role = meta(m, "role");
      if (from && to) return `Vínculo criado: ${from} ${role ? `(${role})` : kindLabel(meta(m, "kind")) ?? "→"} ${to}`;
      return "Vínculo criado";
    }
    case "link.deleted": {
      const from = meta(m, "fromName"), to = meta(m, "toName");
      return from && to ? `Vínculo removido: ${from} → ${to}` : "Vínculo removido";
    }
    case "token.created": return `Token de publicação criado${targetName ? ` para ${targetName}` : ""}${meta(m, "prefix") ? ` (${meta(m, "prefix")}…)` : ""}`;
    case "token.revoked": return `Token de publicação revogado${meta(m, "prefix") ? ` (${meta(m, "prefix")}…)` : ""}`;
    case "spec.uploaded": return `Spec publicada manualmente em ${meta(m, "env") ?? "um ambiente"} (v${meta(m, "version") ?? "?"})${targetName ? ` — ${targetName}` : ""}`;
    case "spec.published": return `Spec publicada pelo CI em ${meta(m, "env") ?? "um ambiente"} (v${meta(m, "version") ?? "?"})${targetName ? ` — ${targetName}` : ""}`;
    case "spec.synced": return `Sincronização de spec executada${targetName ? ` — ${targetName}` : ""}`;
    case "doc.deleted": return `Página de regras de negócio excluída${targetName ? ` — ${targetName}` : ""}`;
    case "envvar.deleted": return `Variável de ambiente excluída${targetName ? ` — ${targetName}` : ""}`;
    case "envvar.revealed": return `Segredo revelado${targetName ? ` — ${targetName}` : ""}`;
    case "envvar.copied": return `Variáveis copiadas entre ambientes${targetName ? ` — ${targetName}` : ""}`;
    case "envvar.exported": return `Variáveis exportadas (.env)${targetName ? ` — ${targetName}` : ""}`;
    case "integration.linked": return `Integração vinculada ao serviço${targetName ? ` — ${targetName}` : ""}`;
    case "integration.unlinked": return `Integração desvinculada do serviço${targetName ? ` — ${targetName}` : ""}`;
    case "integration.created": return `Integração cadastrada: ${meta(m, "slug") ?? targetName ?? ""}`;
    case "integration.updated": return `Integração atualizada${targetName ? `: ${targetName}` : ""}`;
    case "integration.deleted": return `Integração excluída: ${meta(m, "slug") ?? targetName ?? ""}`;
    case "team.created": return `Time criado${targetName ? `: ${targetName}` : ""}`;
    case "team.member_added": return `${meta(m, "login") ?? "Alguém"} adicionado ao time${targetName ? ` ${targetName}` : ""}`;
    case "team.member_removed": return `Pessoa removida do time${targetName ? ` ${targetName}` : ""}`;
    case "team.github_synced": return `Time sincronizado com o GitHub (${meta(m, "linked") ?? 0} de ${meta(m, "github") ?? 0})`;
    case "hub.applied": return `hub.json aplicado${meta(m, "repository") ? ` de ${meta(m, "repository")}` : ""}`;
    case "graph.printed": return `Print do mapa gerado por ${meta(m, "who") ?? "alguém"}`;
    case "hub.written": return `hub.json gravado${meta(m, "repository") ? ` em ${meta(m, "repository")}` : ""}`;
    case "repo.synced": return `Repositório sincronizado${meta(m, "repository") ? `: ${meta(m, "repository")}` : ""}${num(m, "conflicts") ? ` (${num(m, "conflicts")} conflitos)` : ""}`;
    case "repo.conflict_resolved": return `Conflito com o repositório resolvido (${meta(m, "field") ?? "campo"}, ${meta(m, "side") === "git" ? "Git" : "hub"})`;
    case "doc.written": return meta(m, "removed") === "true" ? `Página removida do repositório (${meta(m, "path") ?? "arquivo"})` : `Página gravada no repositório (${meta(m, "path") ?? "arquivo"})`;
    case "spec.breaking_notice": return `Aviso de mudança incompatível (${meta(m, "sent") ?? 0} de ${meta(m, "recipients") ?? 0})`;
    case "settings.email": return meta(m, "configured") === "false" ? "Envio de e-mail desligado" : "SMTP atualizado";
    case "settings.email_tested": return "Conexão SMTP testada";
    case "settings.webhook_secret": return `Segredo de webhook gerado (${meta(m, "type") ?? "provedor"})`;
    case "settings.sync_token": return "Token de sincronização agendada gerado";
    case "setup.email_saved": return "SMTP configurado na instalação";
    case "setup.email_skipped": return "SMTP pulado na instalação";
    case "user.role_changed": return `Papel alterado de ${ROLE_LABEL[meta(m, "from") ?? ""] ?? meta(m, "from")} para ${ROLE_LABEL[meta(m, "to") ?? ""] ?? meta(m, "to")}${targetName ? ` — ${targetName}` : ""}`;
    case "user.suspended": return `Acesso suspenso${targetName ? `: ${targetName}` : ""}`;
    case "user.reactivated": return `Acesso reativado${targetName ? `: ${targetName}` : ""}`;
    case "user.tour_completed": return `Concluiu o tour guiado${targetName ? `: ${targetName}` : ""}`;
    case "access.requested": return `Pediu acesso${targetName ? `: ${targetName}` : ""}`;
    case "access.approved": return `Acesso aprovado como ${ROLE_LABEL[meta(m, "role") ?? ""] ?? meta(m, "role") ?? "?"}${targetName ? ` — ${targetName}` : ""}`;
    case "access.rejected": return `Pedido de acesso recusado${targetName ? `: ${targetName}` : ""}`;
    case "access.denied": return `Login recusado (${meta(m, "reason") ?? "sem vínculo"})${targetName ? `: ${targetName}` : ""}`;
    case "access.status_changed": return `Status mudou de ${meta(m, "from")} para ${meta(m, "to")} automaticamente${targetName ? ` — ${targetName}` : ""}`;
    case "access.reason_updated": return `Justificativa do pedido de acesso atualizada${targetName ? `: ${targetName}` : ""}`;
    case "auth.sign_in": return `Entrou no sistema${targetName ? `: ${targetName}` : ""}`;
    case "auth.sign_out": return `Saiu do sistema${targetName ? `: ${targetName}` : ""}`;
    case "auth.locked": return `Conta bloqueada por tentativas de senha erradas${targetName ? `: ${targetName}` : ""}`;
    case "roles.updated": return "Matriz de permissões alterada";
    case "roles.reset": return "Matriz de permissões restaurada ao padrão";
    case "appearance.updated": return "Aparência (tema/paleta) atualizada";
    case "settings.organization": return "Organização atualizada";
    case "settings.login": return "Formas de login atualizadas";
    case "settings.repositories": return "Integrações de repositório atualizadas";
    case "settings.environments": return "Ambientes atualizados";
    case "settings.policies": return "Regras de acesso atualizadas";
    case "settings.sessions_revoked": return `Sessões encerradas${num(m, "count") !== undefined ? ` (${num(m, "count")} pessoas)` : ""}`;
    case "settings.membership_recheck": return "Verificação de vínculo com a empresa forçada";
    case "owner.recovered": return "Acesso de OWNER recuperado";
    case "owner.recovery_cancelled": return "Recuperação de OWNER cancelada";
    case "audit.exported": return "Exportou a auditoria em CSV";
    case "setup.owner_created": return "Instalação: primeiro OWNER criado";
    case "setup.login_saved": return "Instalação: forma de login configurada";
    case "setup.completed": return "Instalação concluída";
    default: return `${humanizeFallback(row.action)}${targetName ? `: ${targetName}` : ""}`;
  }
}
