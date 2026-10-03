const GH = "https://api.github.com";
const headers = (token: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "api-hub",
});

export type MembershipResult = "member" | "not_member" | "token_invalid";

/** RN-03: vínculo ativo em pelo menos uma das organizações permitidas. */
export async function checkMembership(userToken: string, orgs: string[]): Promise<MembershipResult> {
  for (const org of orgs) {
    const res = await fetch(`${GH}/user/memberships/orgs/${encodeURIComponent(org)}`, { headers: headers(userToken), cache: "no-store" });
    if (res.status === 401) return "token_invalid";
    if (res.ok) {
      const body = (await res.json()) as { state?: string };
      if (body.state === "active") return "member";
    }
  }
  return "not_member";
}

/**
 * Testa client id/secret sem precisar de um login completo:
 * a API "check a token" responde 404 para token inexistente com credenciais válidas
 * e 401 quando as credenciais estão erradas.
 */
export async function verifyOAuthAppCredentials(clientId: string, clientSecret: string): Promise<"valid" | "invalid" | "unknown"> {
  try {
    const res = await fetch(`${GH}/applications/${encodeURIComponent(clientId)}/token`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "User-Agent": "api-hub",
      },
      body: JSON.stringify({ access_token: "gho_api_hub_probe_000000000000000000000" }),
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 422) return "valid";
    if (res.status === 401) return "invalid";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export interface GithubRepo {
  id: number;
  full_name: string;
  html_url: string;
  default_branch: string;
  description: string | null;
}

export async function fetchRepository(userToken: string, fullName: string): Promise<GithubRepo | null> {
  const res = await fetch(`${GH}/repos/${fullName}`, { headers: headers(userToken), cache: "no-store" });
  return res.ok ? ((await res.json()) as GithubRepo) : null;
}

/** Membros de um time do GitHub (slug). 404 se a org ou o time não existem para este token. */
export async function listGithubTeamMembers(token: string, org: string, teamSlug: string): Promise<{ ok: true; logins: string[] } | { ok: false; status: number }> {
  const logins: string[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`${GH}/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}/members?per_page=100&page=${page}`, { headers: headers(token), cache: "no-store" });
    if (!res.ok) return { ok: false, status: res.status };
    const body = (await res.json()) as { login?: string }[];
    for (const m of body) if (m.login) logins.push(m.login.toLowerCase());
    if (body.length < 100) break;
  }
  return { ok: true, logins };
}
