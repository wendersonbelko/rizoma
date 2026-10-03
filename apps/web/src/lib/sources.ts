import { lookup } from "node:dns/promises";
import { prisma } from "@api-hub/db";
import { MAX_SPEC_BYTES, decryptSecret, expandEnvTemplate, repoFileApiUrl, unsafeHostReason, type SourceProvider } from "@api-hub/core";
import { storeSpec } from "./specs-store";
import { audit } from "./audit";
import { syncRepository } from "./repo-sync";

const TIMEOUT_MS = 15_000;

/** RN-S17: leitura segura de URL (http/https, sem loopback/metadados, tempo e tamanho limitados). */
export async function safeFetchText(url: string, headers: Record<string, string> = {}): Promise<string> {
  let u: URL;
  try { u = new URL(url); } catch { throw new Error("URL inválida."); }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Só http e https são aceitos.");
  const direct = unsafeHostReason(u.hostname);
  if (direct) throw new Error(direct);
  try {
    const { address } = await lookup(u.hostname);
    const resolved = unsafeHostReason(address);
    if (resolved) throw new Error(`${u.hostname} aponta para um endereço bloqueado. ${resolved}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("bloqueado")) throw e;
    throw new Error(`Não foi possível resolver ${u.hostname}.`, { cause: e });
  }
  const res = await fetch(u, { headers: { "User-Agent": "api-hub", ...headers }, redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`A origem respondeu ${res.status}.`);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_SPEC_BYTES) throw new Error("Spec maior que 5 MB.");
  const text = await res.text();
  if (Buffer.byteLength(text) > MAX_SPEC_BYTES) throw new Error("Spec maior que 5 MB.");
  return text;
}

function authHeader(provider: SourceProvider, token: string): Record<string, string> {
  if (provider === "GITLAB") return { "PRIVATE-TOKEN": token };
  return { Authorization: `Bearer ${token}` };
}

/** Busca a spec de um serviço num ambiente, conforme a origem configurada (RN-120 a RN-125). */
export async function fetchServiceSpec(serviceId: string, environmentId: string): Promise<{ raw: string; branch?: string }> {
  const svc = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } });
  const env = await prisma.environment.findUniqueOrThrow({ where: { id: environmentId } });

  if (svc.specSource === "URL_PULL") {
    if (!svc.pullUrl) throw new Error("Informe a URL da spec.");
    const headers = svc.pullHeadersEnc ? (JSON.parse(decryptSecret(svc.pullHeadersEnc)) as Record<string, string>) : {};
    return { raw: await safeFetchText(expandEnvTemplate(svc.pullUrl, env.slug), headers) };
  }
  if (svc.specSource === "REPO_FILE") {
    if (!svc.specRepositoryId || !svc.specPath) throw new Error("Escolha o repositório e o caminho do arquivo.");
    if (!env.syncBranch) throw new Error(`O ambiente ${env.name} não tem branch de leitura configurada.`);
    const repo = await prisma.repository.findUniqueOrThrow({ where: { id: svc.specRepositoryId } });
    const integration = await prisma.sourceIntegration.findUnique({ where: { type: repo.provider } });
    const target = repoFileApiUrl(repo.provider, integration?.baseUrl, repo.fullName, svc.specPath, env.syncBranch);
    if (!target) throw new Error("Esse tipo de repositório não permite leitura direta; use URL, CI ou importação.");
    const token = integration?.tokenEnc ? decryptSecret(integration.tokenEnc) : null;
    const raw = await safeFetchText(target.url, { Accept: target.accept, ...(token ? authHeader(repo.provider, token) : {}) });
    return { raw, branch: env.syncBranch };
  }
  throw new Error("Este serviço recebe a spec pelo CI ou por importação manual.");
}

/** Sincroniza um serviço em todos os ambientes. Erros ficam registrados no serviço. */
export async function syncService(serviceId: string, actorId: string | null) {
  const envs = await prisma.environment.findMany({ orderBy: { position: "asc" } });
  const results: { env: string; status: string; version?: string; error?: string }[] = [];
  for (const env of envs) {
    try {
      const { raw, branch } = await fetchServiceSpec(serviceId, env.id);
      const svc = await prisma.service.findUniqueOrThrow({ where: { id: serviceId }, select: { specSource: true } });
      const r = await storeSpec({ serviceId, environmentId: env.id, raw, branch, source: svc.specSource === "REPO_FILE" ? "REPO_FILE" : "URL_PULL" });
      results.push({ env: env.slug, status: r.status, version: r.version });
    } catch (e) {
      results.push({ env: env.slug, status: "error", error: (e as Error).message });
    }
  }
  const errors = results.filter((r) => r.status === "error");
  await prisma.service.update({
    where: { id: serviceId },
    data: { lastSyncAt: new Date(), lastSyncError: errors.length ? errors.map((e) => `${e.env}: ${e.error}`).join(" · ") : null },
  });
  await audit({ actorId, action: "spec.synced", targetType: "service", targetId: serviceId, metadata: { results } });
  const hub = await syncRepository(serviceId, actorId).catch((e: Error) => ({ message: e.message, conflicts: 0 }));
  if (hub.conflicts) {
    await prisma.service.update({ where: { id: serviceId }, data: { lastSyncError: [errors.length ? errors.map((e) => `${e.env}: ${e.error}`).join(" · ") : null, hub.message].filter(Boolean).join(" · ") } });
  }
  return results;
}
