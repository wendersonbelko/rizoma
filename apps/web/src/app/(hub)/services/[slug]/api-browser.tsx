"use client";

import { useMemo, useState } from "react";
import { ApiReference } from "./api-reference";

type OutlineItem = { method: string; path: string; tag: string; summary: string; deprecated: boolean };

const METHOD: Record<string, string> = {
  GET: "bg-accent/15 text-accent",
  POST: "bg-wait/15 text-wait",
  PUT: "bg-ink/10 text-ink",
  PATCH: "bg-ink/10 text-ink",
  DELETE: "bg-danger/15 text-danger",
};

type VersionLink = { id: string; version: string; isLatest: boolean; href: string; title: string };

/** Recorta a spec para um único endpoint, mantendo schemas para os exemplos resolverem. */
function sliceOperation(normalized: string, method: string, path: string): string {
  let doc: unknown;
  try { doc = JSON.parse(normalized); } catch { return normalized; }
  if (!doc || typeof doc !== "object") return normalized;
  const d = doc as {
    paths?: Record<string, Record<string, unknown>>;
    info?: { title?: unknown; version?: unknown };
    openapi?: unknown;
    swagger?: unknown;
    servers?: unknown;
    components?: unknown;
    security?: unknown;
    tags?: unknown;
    definitions?: unknown;
    securityDefinitions?: unknown;
  };
  const item = d.paths?.[path];
  if (!item || typeof item !== "object") return normalized;
  const key = method.toLowerCase();
  if (!item[key] || typeof item[key] !== "object") return normalized;
  const pathItem: Record<string, unknown> = { [key]: item[key] };
  if (item.parameters) pathItem.parameters = item.parameters;
  if (item.servers) pathItem.servers = item.servers;
  const next: Record<string, unknown> = {
    info: {
      title: typeof d.info?.title === "string" ? d.info.title : "API",
      version: typeof d.info?.version === "string" ? d.info.version : "0",
    },
    paths: { [path]: pathItem },
  };
  if (typeof d.openapi === "string") next.openapi = d.openapi;
  else next.swagger = d.swagger ?? "2.0";
  for (const field of ["servers", "components", "security", "tags", "definitions", "securityDefinitions"] as const) {
    if (d[field]) next[field] = d[field];
  }
  return JSON.stringify(next);
}

/**
 * A documentação deixa de ser uma página inteira do Scalar: a lista escolhe o endpoint
 * e o painel da direita mostra só esse contrato.
 */
export function ApiBrowser({ outline, spec, dark, versions, selectedVersionId, envName }: {
  outline: OutlineItem[];
  spec: string;
  dark: boolean;
  versions: VersionLink[];
  selectedVersionId?: string;
  envName: string;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const groups = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("pt-BR");
    const visible = outline.filter((o) => !query || `${o.method} ${o.path} ${o.summary} ${o.tag}`.toLocaleLowerCase("pt-BR").includes(query));
    const order: string[] = [];
    for (const item of visible) if (!order.includes(item.tag)) order.push(item.tag);
    return order.map((tag) => ({ tag, items: visible.filter((o) => o.tag === tag) }));
  }, [outline, q]);
  const visible = groups.flatMap((g) => g.items);
  const current = visible.find((o) => `${o.method} ${o.path}` === picked) ?? visible[0];
  const content = current ? sliceOperation(spec, current.method, current.path) : spec;

  return (
    <div className="flex flex-col overflow-hidden rounded-panel border border-line bg-sheet lg:min-h-[36rem] lg:flex-row">
      <aside className="flex max-h-80 shrink-0 flex-col border-b border-line lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r">
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Endpoints</h2>
            <span className="text-xs text-muted">{outline.length}</span>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar path ou resumo"
            aria-label="Buscar endpoint"
            className="mt-3 h-10 w-full rounded-control border border-line bg-paper px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {groups.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted">Nenhum endpoint com esse texto.</p>}
          {groups.map((g) => (
            <section key={g.tag} className="mb-3">
              <h3 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">{g.tag}</h3>
              <ul>
                {g.items.map((o) => {
                  const key = `${o.method} ${o.path}`;
                  const active = current && key === `${current.method} ${current.path}`;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => setPicked(key)}
                        aria-current={active ? "true" : undefined}
                        className={`flex w-full items-start gap-2 rounded-control px-2 py-2 text-left ${active ? "bg-accent/12" : "hover:bg-paper"}`}
                      >
                        <span className={`mt-0.5 w-14 shrink-0 rounded-full px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold ${METHOD[o.method] ?? "bg-paper text-muted"}`}>{o.method}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[13px]">{o.path}</span>
                          {o.summary && <span className="block truncate text-xs text-muted">{o.summary}</span>}
                          {o.deprecated && <span className="text-xs text-wait">Descontinuado</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p className="text-sm text-muted">Contrato em {envName}</p>
          {versions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {versions.map((v) => (
                <a key={v.id} href={v.href} title={v.title} className={`rounded-full px-2.5 py-1 font-mono text-xs ${v.id === selectedVersionId ? "bg-accent/15 font-semibold text-accent" : "text-muted hover:bg-paper hover:text-ink"}`}>
                  {v.version}{v.isLatest ? " atual" : ""}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="hub-api">
          {current ? (
            <ApiReference key={`${current.method} ${current.path}`} content={content} dark={dark} />
          ) : (
            <p className="px-5 py-10 text-sm text-muted">Nenhum endpoint com esse texto.</p>
          )}
        </div>
      </div>
    </div>
  );
}
