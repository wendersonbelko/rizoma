import { prisma } from "@api-hub/db";
import { decryptSecret, verifyHmacSha256, verifySharedToken, type SourceProvider } from "@api-hub/core";
import { syncService } from "@/lib/sources";

export const dynamic = "force-dynamic";

/**
 * Push do GitHub, GitLab ou Bitbucket. O segredo é o que foi gerado em Configurações → Conexões.
 * Serviços cuja spec vem do arquivo desse repositório são sincronizados.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const provider = detectProvider(req);
  if (!provider) return Response.json({ error: "Evento não reconhecido." }, { status: 400 });
  if (isPing(req, provider)) return Response.json({ ok: true, ignored: "ping" });

  const integration = await prisma.sourceIntegration.findUnique({ where: { type: provider } });
  if (!integration?.webhookSecretEnc) return Response.json({ error: "Webhook não configurado." }, { status: 401 });
  const secret = decryptSecret(integration.webhookSecretEnc);
  if (!signatureOk(req, provider, secret, body)) return Response.json({ error: "Assinatura inválida." }, { status: 401 });

  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return Response.json({ error: "Corpo inválido." }, { status: 400 }); }
  if (!isPush(req, provider, payload)) return Response.json({ ok: true, ignored: "not-push" });

  const fullName = repositoryName(provider, payload);
  if (!fullName) return Response.json({ ok: true, ignored: "no-repo" });

  const repo = await prisma.repository.findUnique({ where: { fullName }, select: { id: true } });
  if (!repo) return Response.json({ ok: true, ignored: "unknown-repo", repository: fullName });

  const services = await prisma.service.findMany({
    where: { archivedAt: null, specSource: "REPO_FILE", specRepositoryId: repo.id },
    select: { id: true, slug: true },
  });
  const report: Record<string, unknown> = {};
  for (const s of services) report[s.slug] = await syncService(s.id, null);
  return Response.json({ ok: true, repository: fullName, services: services.length, report });
}

function detectProvider(req: Request): SourceProvider | null {
  if (req.headers.get("x-github-event")) return "GITHUB";
  if (req.headers.get("x-gitlab-event") || req.headers.get("x-gitlab-token")) return "GITLAB";
  if (req.headers.get("x-event-key")?.startsWith("repo:")) return "BITBUCKET";
  return null;
}

function isPing(req: Request, provider: SourceProvider): boolean {
  return provider === "GITHUB" && req.headers.get("x-github-event") === "ping";
}

function signatureOk(req: Request, provider: SourceProvider, secret: string, body: string): boolean {
  if (provider === "GITLAB") return verifySharedToken(secret, req.headers.get("x-gitlab-token"));
  return verifyHmacSha256(secret, body, req.headers.get("x-hub-signature-256"));
}

function isPush(req: Request, provider: SourceProvider, payload: unknown): boolean {
  if (provider === "GITHUB") return req.headers.get("x-github-event") === "push";
  if (provider === "GITLAB") return !!payload && typeof payload === "object" && (payload as { object_kind?: string }).object_kind === "push";
  return req.headers.get("x-event-key") === "repo:push";
}

function repositoryName(provider: SourceProvider, payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as { repository?: { full_name?: string }; project?: { path_with_namespace?: string } };
  if (provider === "GITLAB") return p.project?.path_with_namespace ?? null;
  return p.repository?.full_name ?? null;
}
