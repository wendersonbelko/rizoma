/** Origem das specs (RN-120 a RN-126). */
export const SOURCE_PROVIDERS = ["GITHUB", "GITLAB", "BITBUCKET", "GENERIC"] as const;
export type SourceProvider = (typeof SOURCE_PROVIDERS)[number];

export const SOURCE_META: Record<SourceProvider, { label: string; needsBaseUrl: boolean; defaultBaseUrl?: string; tokenHelp: string }> = {
  GITHUB: { label: "GitHub", needsBaseUrl: false, defaultBaseUrl: "https://api.github.com", tokenHelp: "Token fine-grained só de leitura em Contents e Metadata." },
  GITLAB: { label: "GitLab", needsBaseUrl: false, defaultBaseUrl: "https://gitlab.com", tokenHelp: "Project/Group access token com escopo read_repository e read_api. Para GitLab próprio, informe a URL." },
  BITBUCKET: { label: "Bitbucket", needsBaseUrl: false, defaultBaseUrl: "https://api.bitbucket.org", tokenHelp: "Access token de repositório/workspace com leitura." },
  GENERIC: { label: "Outro (URL direta)", needsBaseUrl: false, tokenHelp: "Sem integração: as specs vêm por URL, CI ou importação manual." },
};

export const SPEC_SOURCE_LABEL: Record<string, string> = {
  CI_PUSH: "Enviada pelo CI",
  REPO_FILE: "Arquivo no repositório",
  URL_PULL: "Lida de uma URL",
  MANUAL_UPLOAD: "Importação manual",
};

/** RN-122: "{env}" na URL vira o slug do ambiente. */
export function expandEnvTemplate(template: string, envSlug: string): string {
  return template.replaceAll("{env}", encodeURIComponent(envSlug));
}

/** URL da API para ler um arquivo cru num commit/branch. */
export function repoFileApiUrl(provider: SourceProvider, baseUrl: string | null | undefined, fullName: string, path: string, ref: string) {
  const clean = path.replace(/^\/+/, "");
  switch (provider) {
    case "GITHUB": {
      const base = (baseUrl || "https://api.github.com").replace(/\/+$/, "");
      return { url: `${base}/repos/${fullName}/contents/${clean.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`, accept: "application/vnd.github.raw+json" };
    }
    case "GITLAB": {
      const base = (baseUrl || "https://gitlab.com").replace(/\/+$/, "");
      return { url: `${base}/api/v4/projects/${encodeURIComponent(fullName)}/repository/files/${encodeURIComponent(clean)}/raw?ref=${encodeURIComponent(ref)}`, accept: "*/*" };
    }
    case "BITBUCKET": {
      const base = (baseUrl || "https://api.bitbucket.org").replace(/\/+$/, "");
      return { url: `${base}/2.0/repositories/${fullName}/src/${encodeURIComponent(ref)}/${clean.split("/").map(encodeURIComponent).join("/")}`, accept: "*/*" };
    }
    default:
      return null;
  }
}

export function repoWebUrl(provider: SourceProvider, baseUrl: string | null | undefined, fullName: string): string {
  if (provider === "GITLAB") return `${(baseUrl || "https://gitlab.com").replace(/\/+$/, "")}/${fullName}`;
  if (provider === "BITBUCKET") return `https://bitbucket.org/${fullName}`;
  return `https://github.com/${fullName}`;
}

/**
 * RN-S17: proteção contra SSRF na leitura por URL. Recusa metadados de nuvem, loopback e
 * esquemas que não sejam http(s). Redes privadas são permitidas (serviços internos são o caso de uso).
 */
export function unsafeHostReason(hostname: string): string | null {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost")) return "localhost não é permitido.";
  if (/^127\./.test(h) || h === "::1" || h === "0.0.0.0") return "Endereço de loopback não é permitido.";
  if (/^169\.254\./.test(h) || h.startsWith("fe80:")) return "Endereço link-local (metadados de nuvem) não é permitido.";
  if (h === "metadata.google.internal" || h === "metadata") return "Serviço de metadados não é permitido.";
  return null;
}
