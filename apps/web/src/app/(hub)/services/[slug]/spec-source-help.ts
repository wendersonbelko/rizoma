/**
 * Uma frase por origem de spec, sem jargão de protocolo (princípio "dado técnico a um clique", p. 17 da
 * auditoria de UX de 02/10/2026). Usada no cartão de escolha da edição e na aba Configurações.
 */
export const SPEC_SOURCE_HELP: Record<string, string> = {
  CI_PUSH: "O pipeline publica a spec a cada deploy, com um token de CI. O ambiente vem da branch.",
  REPO_FILE: "O hub lê o arquivo (ex.: openapi.yaml) na branch de leitura de cada ambiente.",
  URL_PULL: "O hub busca a spec numa URL; use {env} para o ambiente.",
  MANUAL_UPLOAD: "Alguém do time envia o JSON ou YAML pela tela.",
};

/** A ordem em que as origens aparecem para escolher. */
export const SPEC_SOURCE_ORDER = ["CI_PUSH", "REPO_FILE", "URL_PULL", "MANUAL_UPLOAD"] as const;
