import type { Prisma } from "@api-hub/db";

/** Forma exata do `service` carregado por page.tsx — compartilhada por header e abas, para
 * nenhuma delas duplicar o `include` do Prisma nem correr o risco de divergir dele. */
export type ServiceDetail = Prisma.ServiceGetPayload<{
  include: {
    ownerTeam: { include: { members: { include: { user: { select: { githubLogin: true; email: true; name: true } } } } } };
    repositories: { include: { repository: true } };
    outgoing: { include: { to: { select: { slug: true; name: true } } } };
    incoming: { include: { from: { select: { slug: true; name: true } } } };
  };
}>;

export const TABS = [
  { id: "api", label: "Documentação da API" },
  { id: "rules", label: "Regras de negócio" },
  { id: "integrations", label: "Integrações" },
  { id: "variables", label: "Variáveis de ambiente" },
  { id: "config", label: "Configurações" },
] as const;
export type Tab = (typeof TABS)[number]["id"];

/** page/size: paginação da listagem da aba atual (cada aba com duas listagens usa nomes próprios). */
export type Search = { env?: string; tab?: string; v?: string; doc?: string; edit?: string; var?: string; page?: string; size?: string; compare?: string };

/** Constrói a URL da própria página preservando ambiente e aba atuais, só trocando o que for pedido. */
export type HrefFor = (patch: Partial<Search>) => string;
