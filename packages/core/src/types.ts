// Espelham os enums do Prisma. O core não depende do banco para ser testável.
export type Role = "OWNER" | "ADMIN" | "MAINTAINER" | "VIEWER";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
export type AccessGrant = "OWNER_SETUP" | "ORG_MEMBERSHIP" | "MANUAL_APPROVAL";
export type OutsiderPolicy = "REQUEST_APPROVAL" | "BLOCK";

export const USER_STATUSES: UserStatus[] = ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"];
export const ACCESS_GRANTS: AccessGrant[] = ["OWNER_SETUP", "ORG_MEMBERSHIP", "MANUAL_APPROVAL"];
export const OUTSIDER_POLICIES: OutsiderPolicy[] = ["REQUEST_APPROVAL", "BLOCK"];
export type LinkKind = "CONSUMES" | "PUBLISHES_TO" | "SUBSCRIBES_TO" | "SHARES_LIBRARY" | "DEPENDS_ON";
export type ServiceRepoRole = "SOURCE" | "CLIENT_SDK" | "INFRA" | "CONTRACT";

export const ROLES: Role[] = ["OWNER", "ADMIN", "MAINTAINER", "VIEWER"];
export const LINK_KINDS: LinkKind[] = ["CONSUMES", "PUBLISHES_TO", "SUBSCRIBES_TO", "SHARES_LIBRARY", "DEPENDS_ON"];
export const SERVICE_REPO_ROLES: ServiceRepoRole[] = ["SOURCE", "CLIENT_SDK", "INFRA", "CONTRACT"];

export const LINK_KIND_LABEL: Record<LinkKind, string> = {
  CONSUMES: "consome a API de",
  PUBLISHES_TO: "publica eventos em",
  SUBSCRIBES_TO: "assina eventos de",
  SHARES_LIBRARY: "compartilha biblioteca com",
  DEPENDS_ON: "depende de",
};

/**
 * Nome de cada papel na interface (achado V2 da auditoria de UX de 02/10/2026): tabelas, menus,
 * convite e matriz usam este dicionário. O código do papel (OWNER, VIEWER…) não aparece na tela.
 */
export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MAINTAINER: "Mantenedor",
  VIEWER: "Leitor",
};

export const TEAM_ROLE_LABEL: Record<"LEAD" | "MEMBER", string> = { LEAD: "Líder", MEMBER: "Membro" };

/**
 * Tema da interface por pessoa (achado F5 da auditoria de UX de 02/10/2026). SYSTEM segue o
 * sistema operacional. O admin não escolhe tema: ele só define a marca (nome e cor de destaque).
 */
export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";
export const THEME_PREFERENCES: ThemePreference[] = ["LIGHT", "DARK", "SYSTEM"];
export const THEME_PREFERENCE_LABEL: Record<ThemePreference, string> = { LIGHT: "Claro", DARK: "Escuro", SYSTEM: "Sistema" };

export const SERVICE_REPO_ROLE_LABEL: Record<ServiceRepoRole, string> = {
  SOURCE: "Código-fonte",
  CLIENT_SDK: "SDK cliente",
  INFRA: "Infraestrutura",
  CONTRACT: "Contrato",
};

export type ServiceKind = "API" | "FRONTEND" | "WORKER";
export type ChannelProtocol = "HTTP" | "GRPC" | "WEBSOCKET";

export const SERVICE_KINDS: ServiceKind[] = ["API", "FRONTEND", "WORKER"];
export const CHANNEL_PROTOCOLS: ChannelProtocol[] = ["HTTP", "GRPC", "WEBSOCKET"];

export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
  API: "API",
  FRONTEND: "Frontend",
  WORKER: "Worker",
};

export const CHANNEL_PROTOCOL_LABEL: Record<ChannelProtocol, string> = {
  HTTP: "HTTP",
  GRPC: "gRPC",
  WEBSOCKET: "WebSocket",
};

export type ResourceKind = "HTTP_API" | "QUEUE" | "TOPIC" | "WEBHOOK" | "DATABASE" | "CACHE" | "STORAGE" | "EMAIL_SMS" | "OTHER";
export type ResourceRelation = "CONSUMES" | "PROVIDES" | "PUBLISHES" | "SUBSCRIBES" | "SENDS_WEBHOOK" | "RECEIVES_WEBHOOK" | "READS" | "WRITES";

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  HTTP_API: "API externa",
  QUEUE: "Fila",
  TOPIC: "Tópico / evento",
  WEBHOOK: "Webhook",
  DATABASE: "Banco de dados",
  CACHE: "Cache",
  STORAGE: "Armazenamento",
  EMAIL_SMS: "E-mail / SMS",
  OTHER: "Outro",
};

export const RESOURCE_RELATION_LABEL: Record<ResourceRelation, string> = {
  CONSUMES: "consome",
  PROVIDES: "fornece",
  PUBLISHES: "publica em",
  SUBSCRIBES: "assina",
  SENDS_WEBHOOK: "envia webhook para",
  RECEIVES_WEBHOOK: "recebe webhook de",
  READS: "lê de",
  WRITES: "grava em",
};

/** Relações que fazem sentido para cada tipo (RN-81). */
export const RELATIONS_BY_KIND: Record<ResourceKind, ResourceRelation[]> = {
  HTTP_API: ["CONSUMES", "PROVIDES"],
  QUEUE: ["PUBLISHES", "SUBSCRIBES"],
  TOPIC: ["PUBLISHES", "SUBSCRIBES"],
  WEBHOOK: ["SENDS_WEBHOOK", "RECEIVES_WEBHOOK"],
  DATABASE: ["READS", "WRITES"],
  CACHE: ["READS", "WRITES"],
  STORAGE: ["READS", "WRITES"],
  EMAIL_SMS: ["CONSUMES"],
  OTHER: ["CONSUMES", "PROVIDES", "PUBLISHES", "SUBSCRIBES", "SENDS_WEBHOOK", "RECEIVES_WEBHOOK", "READS", "WRITES"],
};
