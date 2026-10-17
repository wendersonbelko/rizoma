import Link from "next/link";
import { prisma } from "@api-hub/db";
import { SPEC_SOURCE_LABEL, can, canManageService, outlineOperations, parseSpec } from "@api-hub/core";
import type { CurrentUser } from "@/lib/guards";
import { docUrl } from "@/lib/links";
import { LinkButton, Notice } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { SpecOriginNotice } from "../spec-origin-notice";
import { ApiReference } from "../api-reference";
import { ApiBrowser } from "../api-browser";
import type { HrefFor, ServiceDetail } from "../types";

type Env = { id: string; slug: string; name: string; isProduction: boolean; syncBranch: string | null; branchPatterns: string[] };

/**
 * Aba "Documentação da API": versão publicada no ambiente atual, ou orientação de como
 * publicar quando ainda não há nenhuma. Consulta as próprias versões — nenhuma outra aba
 * depende desses dados.
 */
export async function ApiTab({ user, service, env, selectedVersionId, dark, hrefFor }: {
  user: CurrentUser; service: ServiceDetail; env: Env; selectedVersionId?: string; dark: boolean; hrefFor: HrefFor;
}) {
  const versions = await prisma.apiSpec.findMany({
    where: { serviceId: service.id, environmentId: env.id },
    select: { id: true, version: true, createdAt: true, isLatest: true, commitSha: true, branch: true, source: true },
    orderBy: { createdAt: "desc" }, take: 20,
  });
  const selected = versions.find((v) => v.id === selectedVersionId) ?? versions.find((v) => v.isLatest);
  const spec = selected ? await prisma.apiSpec.findUnique({ where: { id: selected.id } }) : null;
  const canPublish = canManageService(user, service, "spec:publish");
  const pulls = service.specSource === "URL_PULL" || service.specSource === "REPO_FILE";
  const latest = versions.find((v) => v.isLatest);
  const sourceMismatch = latest && latest.source !== service.specSource;
  const [operations, calls] = await Promise.all([
    prisma.specOperation.findMany({ where: { serviceId: service.id, environmentId: env.id }, orderBy: [{ path: "asc" }, { method: "asc" }] }),
    prisma.operationCall.findMany({
      where: { OR: [{ toServiceId: service.id }, { fromServiceId: service.id }] },
      include: { from: { select: { slug: true, name: true } }, to: { select: { slug: true, name: true } } },
    }),
  ]);
  const called = operations.flatMap((o) => {
    const callers = calls.filter((c) => c.toServiceId === service.id && c.method === o.method && c.path === o.path);
    return callers.length ? [{ ...o, callers }] : [];
  });
  const outgoing = calls.filter((c) => c.fromServiceId === service.id);
  const deprecated = operations.filter((o) => o.deprecated);
  let normalized = "";
  if (spec) {
    try { normalized = parseSpec(spec.content).normalized; } catch { normalized = ""; }
  }
  const outline = normalized ? outlineOperations(normalized) : [];
  const versionLinks = versions.map((v) => ({
    id: v.id,
    version: v.version,
    isLatest: v.isLatest,
    href: hrefFor({ v: v.id }),
    title: `${v.createdAt.toLocaleString("pt-BR")} · ${SPEC_SOURCE_LABEL[v.source]}${v.branch ? ` · ${v.branch}` : ""}`,
  }));

  return (
    <div className="space-y-4">
      {service.kind !== "API" && (
        <Notice title={service.kind === "FRONTEND" ? "Frontend" : "Worker"}>
          Este sistema não precisa de spec OpenAPI. Os vínculos abaixo dizem com quem ele fala.
        </Notice>
      )}
      {(outgoing.length > 0 || called.length > 0 || deprecated.length > 0) && (
        <div className="flex flex-wrap gap-2 text-sm">
          {outgoing.map((c) => (
            <span key={c.id} className="rounded-full border border-line bg-sheet px-3 py-1">
              Chama <code className="font-mono">{c.method} {c.path}</code> em <Link href={`/services/${c.to.slug}`} className="text-accent">{c.to.name}</Link>
            </span>
          ))}
          {called.map((o) => (
            <span key={`${o.method}-${o.path}`} className="rounded-full border border-line bg-sheet px-3 py-1">
              <code className="font-mono">{o.method} {o.path}</code> <span className="text-muted">chamado por {o.callers.map((c) => c.from.name).join(", ")}</span>
            </span>
          ))}
          {deprecated.length > 0 && (
            <span className="rounded-full bg-wait/12 px-3 py-1 text-wait">{deprecated.length === 1 ? "1 operação descontinuada" : `${deprecated.length} operações descontinuadas`}</span>
          )}
        </div>
      )}
      {sourceMismatch && (
        <SpecOriginNotice envName={env.name} actualSource={latest.source} configuredSource={service.specSource} href={hrefFor({ tab: "config" })} />
      )}
      {spec && outline.length > 0 ? (
        <ApiBrowser outline={outline} spec={normalized} dark={dark} versions={versionLinks} selectedVersionId={selected?.id} envName={env.name} />
      ) : spec ? (
        <div className="hub-api overflow-hidden rounded-panel border border-line bg-sheet">
          <ApiReference content={spec.content} dark={dark} />
        </div>
      ) : (
        <EmptyState
          title={`Sem spec em ${env.name}`}
          description={
            <>
              {service.specSource === "CI_PUSH" && <>O CI publica a spec quando uma branch de {env.name} ({env.branchPatterns.join(", ")}) passa pelo pipeline.</>}
              {pulls && <>A spec é lida {service.specSource === "REPO_FILE" ? `do repositório na branch ${env.syncBranch ?? "(não configurada)"}` : "da URL configurada"}. <Link href={hrefFor({ tab: "config" })} className="text-accent">Sincronizar em Configurações</Link>.</>}
              {service.specSource === "MANUAL_UPLOAD" && <>Este serviço recebe a spec por importação manual. <Link href={hrefFor({ tab: "config" })} className="text-accent">Publicar em Configurações</Link>.</>}
            </>
          }
          action={
            service.specSource === "CI_PUSH" ? (
              <div className="flex flex-wrap justify-center gap-3">
                <LinkButton href={docUrl("receitas/publicar-pelo-github-actions")} tone="quiet" external>Como configurar o CI</LinkButton>
                {/* Contrato com a tela de Tokens de CI: abre o modal "Gerar token" com este serviço já escolhido. */}
                {canPublish && can(user, "token:manage") && <LinkButton href={`/admin/tokens?service=${service.id}#new-token`}>Gerar token de CI</LinkButton>}
              </div>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
