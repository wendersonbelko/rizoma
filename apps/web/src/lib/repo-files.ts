import { repoFileApiUrl, type SourceProvider } from "@api-hub/core";

const TIMEOUT_MS = 15_000;

function authHeader(provider: SourceProvider, token: string): Record<string, string> {
  if (provider === "GITLAB") return { "PRIVATE-TOKEN": token };
  return { Authorization: `Bearer ${token}` };
}

function cleanPath(path: string): string {
  return path.replace(/^\/+/, "");
}

/** Lê um arquivo da branch. 404 vira texto nulo; outro status volta sem corpo. */
export async function readRepoText(provider: SourceProvider, baseUrl: string | null | undefined, fullName: string, branch: string, token: string, path: string): Promise<{ status: number; text: string | null }> {
  const target = repoFileApiUrl(provider, baseUrl, fullName, path, branch);
  if (!target) return { status: 0, text: null };
  const res = await fetch(target.url, {
    headers: { Accept: target.accept, ...authHeader(provider, token), "User-Agent": "api-hub" },
    redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store",
  });
  if (res.status === 404) return { status: 404, text: null };
  if (!res.ok) return { status: res.status, text: null };
  return { status: res.status, text: await res.text() };
}

/** Nomes na raiz, para achar um .csproj sem baixar a árvore inteira. */
export async function listRepoRoot(provider: SourceProvider, baseUrl: string | null | undefined, fullName: string, branch: string, token: string): Promise<string[]> {
  const headers = { ...authHeader(provider, token), "User-Agent": "api-hub" };
  try {
    if (provider === "GITHUB") {
      const base = (baseUrl || "https://api.github.com").replace(/\/+$/, "");
      const res = await fetch(`${base}/repos/${fullName}/contents?ref=${encodeURIComponent(branch)}`, {
        headers: { ...headers, Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store",
      });
      if (!res.ok) return [];
      const body = (await res.json()) as { name?: string }[] | { name?: string };
      return Array.isArray(body) ? body.flatMap((f) => f.name ? [f.name] : []) : [];
    }
    if (provider === "GITLAB") {
      const base = (baseUrl || "https://gitlab.com").replace(/\/+$/, "");
      const res = await fetch(`${base}/api/v4/projects/${encodeURIComponent(fullName)}/repository/tree?ref=${encodeURIComponent(branch)}&per_page=100`, {
        headers, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store",
      });
      if (!res.ok) return [];
      const body = (await res.json()) as { name?: string }[];
      return body.flatMap((f) => f.name ? [f.name] : []);
    }
    if (provider === "BITBUCKET") {
      const base = (baseUrl || "https://api.bitbucket.org").replace(/\/+$/, "");
      const res = await fetch(`${base}/2.0/repositories/${fullName}/src/${encodeURIComponent(branch)}/`, {
        headers, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store",
      });
      if (!res.ok) return [];
      const body = (await res.json()) as { values?: { path?: string }[] };
      return (body.values ?? []).flatMap((f) => f.path?.split("/").pop() ? [f.path.split("/").pop()!] : []);
    }
  } catch {
    return [];
  }
  return [];
}

async function githubSha(base: string, fullName: string, path: string, branch: string, headers: Record<string, string>): Promise<{ sha?: string; status: number }> {
  const url = `${base}/repos/${fullName}/contents/${cleanPath(path).split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`;
  const current = await fetch(url, { headers: { ...headers, Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (current.status === 404) return { status: 404 };
  if (!current.ok) return { status: current.status };
  return { sha: ((await current.json()) as { sha?: string }).sha, status: current.status };
}

/** Grava o arquivo na branch padrão (ou na branch informada). Cria se ainda não existe. */
export async function writeRepoText(provider: SourceProvider, baseUrl: string | null | undefined, fullName: string, branch: string, token: string, path: string, content: string, message: string): Promise<{ ok: true } | { ok: false; status: number }> {
  const headers = authHeader(provider, token);
  const file = cleanPath(path);
  if (provider === "GITHUB") {
    const base = (baseUrl || "https://api.github.com").replace(/\/+$/, "");
    const meta = await githubSha(base, fullName, file, branch, headers);
    if (meta.status !== 404 && !meta.sha && meta.status >= 400) return { ok: false, status: meta.status };
    const put = await fetch(`${base}/repos/${fullName}/contents/${file.split("/").map(encodeURIComponent).join("/")}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json", Accept: "application/vnd.github+json" },
      body: JSON.stringify({ message, content: Buffer.from(content).toString("base64"), branch, sha: meta.sha }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return put.ok ? { ok: true } : { ok: false, status: put.status };
  }
  if (provider === "GITLAB") {
    const base = (baseUrl || "https://gitlab.com").replace(/\/+$/, "");
    const url = `${base}/api/v4/projects/${encodeURIComponent(fullName)}/repository/files/${encodeURIComponent(file)}`;
    const body = JSON.stringify({ branch, content, commit_message: message });
    const put = await fetch(url, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (put.ok) return { ok: true };
    if (put.status !== 400) return { ok: false, status: put.status };
    const post = await fetch(url, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return post.ok ? { ok: true } : { ok: false, status: post.status };
  }
  if (provider === "BITBUCKET") {
    const base = (baseUrl || "https://api.bitbucket.org").replace(/\/+$/, "");
    const form = new FormData();
    form.append("message", message);
    form.append("branch", branch);
    form.append(file, new Blob([content]), file.split("/").pop() ?? file);
    const post = await fetch(`${base}/2.0/repositories/${fullName}/src`, { method: "POST", headers, body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return post.ok ? { ok: true } : { ok: false, status: post.status };
  }
  return { ok: false, status: 0 };
}

/** Apaga o arquivo quando o conteúdo do Git ainda é o que o hub gravou. */
export async function deleteRepoText(provider: SourceProvider, baseUrl: string | null | undefined, fullName: string, branch: string, token: string, path: string, message: string): Promise<{ ok: true } | { ok: false; status: number }> {
  const headers = authHeader(provider, token);
  const file = cleanPath(path);
  if (provider === "GITHUB") {
    const base = (baseUrl || "https://api.github.com").replace(/\/+$/, "");
    const meta = await githubSha(base, fullName, file, branch, headers);
    if (meta.status === 404) return { ok: true };
    if (!meta.sha) return { ok: false, status: meta.status };
    const del = await fetch(`${base}/repos/${fullName}/contents/${file.split("/").map(encodeURIComponent).join("/")}`, {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json", Accept: "application/vnd.github+json" },
      body: JSON.stringify({ message, sha: meta.sha, branch }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return del.ok ? { ok: true } : { ok: false, status: del.status };
  }
  if (provider === "GITLAB") {
    const base = (baseUrl || "https://gitlab.com").replace(/\/+$/, "");
    const url = `${base}/api/v4/projects/${encodeURIComponent(fullName)}/repository/files/${encodeURIComponent(file)}`;
    const del = await fetch(url, {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ branch, commit_message: message }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return del.ok || del.status === 404 ? { ok: true } : { ok: false, status: del.status };
  }
  if (provider === "BITBUCKET") {
    const base = (baseUrl || "https://api.bitbucket.org").replace(/\/+$/, "");
    const form = new FormData();
    form.append("message", message);
    form.append("branch", branch);
    form.append("files", file);
    const post = await fetch(`${base}/2.0/repositories/${fullName}/src`, { method: "POST", headers, body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return post.ok ? { ok: true } : { ok: false, status: post.status };
  }
  return { ok: false, status: 0 };
}
