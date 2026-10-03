/**
 * Ambientes por branch (RN-90 a RN-93).
 * Padrões glob: `*` casa um trecho sem barra, `**` casa qualquer coisa (inclusive barras).
 * Ex.: "main", "release/*", "feature/**", "hotfix-*".
 */
export interface EnvLike { id: string; slug: string; branchPatterns: string[]; position: number }

export function globToRegExp(pattern: string): RegExp {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === "*") {
      if (pattern[i + 1] === "*") { re += ".*"; i++; } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

export function branchMatches(patterns: string[], branch: string): boolean {
  return patterns.some((p) => globToRegExp(p.trim()).test(branch));
}

/** Primeiro ambiente (pela ordem) cujo padrão casa com a branch. */
export function resolveEnvironment<T extends EnvLike>(envs: T[], branch: string): T | null {
  const clean = branch.replace(/^refs\/heads\//, "");
  return [...envs].sort((a, b) => a.position - b.position).find((e) => branchMatches(e.branchPatterns, clean)) ?? null;
}

export const envSlugSchemaRegex = /^[a-z0-9][a-z0-9-]{0,19}$/;
export const branchPatternRegex = /^[A-Za-z0-9._\-/*?]{1,100}$/;
