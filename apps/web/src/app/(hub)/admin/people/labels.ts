/** Rótulos compartilhados pelas listas de Pessoas e acesso. */
export const ACTION_LABEL: Record<string, string> = {
  "access.requested": "pediu acesso",
  "access.approved": "aprovou um acesso",
  "access.rejected": "recusou um acesso",
  "access.denied": "teve o login barrado",
  "access.status_changed": "status alterado automaticamente",
  "access.reason_updated": "enviou justificativa",
};

export const STATUS_LABEL = { ACTIVE: "ativo", PENDING: "aguardando", SUSPENDED: "suspenso", REJECTED: "recusado" } as const;

/** Como nomear uma pessoa: login do GitHub, senão e-mail, senão nome. */
export const who = (u: { githubLogin: string | null; email: string | null; name?: string | null }) =>
  u.githubLogin ? `@${u.githubLogin}` : (u.email ?? u.name ?? "—");
