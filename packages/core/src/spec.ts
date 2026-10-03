import { parse as parseYaml } from "yaml";
import { sha256 } from "./crypto";

export const MAX_SPEC_BYTES = 5 * 1024 * 1024;

export interface ParsedSpec {
  format: "openapi-3.1" | "openapi-3.0" | "swagger-2.0";
  title: string | null;
  version: string;
  checksum: string;
  sizeBytes: number;
  normalized: string;
  declaredDependencies: string[];
}

export class SpecError extends Error {}

/**
 * Valida e normaliza uma spec recebida (RN-40 a RN-42).
 * A extensão `x-api-hub.dependsOn` na raiz permite declarar dependências no próprio contrato.
 */
export function parseSpec(raw: string): ParsedSpec {
  const sizeBytes = Buffer.byteLength(raw, "utf8");
  if (sizeBytes === 0) throw new SpecError("A spec está vazia.");
  if (sizeBytes > MAX_SPEC_BYTES) throw new SpecError("A spec passa de 5 MB.");

  let doc: unknown;
  try {
    doc = raw.trimStart().startsWith("{") ? JSON.parse(raw) : parseYaml(raw, { maxAliasCount: 100 });
  } catch (e) {
    throw new SpecError(`Não foi possível ler a spec: ${(e as Error).message}`);
  }
  if (!doc || typeof doc !== "object") throw new SpecError("A spec precisa ser um objeto JSON/YAML.");
  const d = doc as {
    openapi?: unknown;
    swagger?: unknown;
    info?: { title?: unknown; version?: unknown };
    paths?: unknown;
    webhooks?: unknown;
    components?: unknown;
    "x-api-hub"?: { dependsOn?: unknown };
  };

  let format: ParsedSpec["format"];
  if (typeof d.openapi === "string" && d.openapi.startsWith("3.1")) format = "openapi-3.1";
  else if (typeof d.openapi === "string" && d.openapi.startsWith("3.0")) format = "openapi-3.0";
  else if (d.swagger === "2.0") format = "swagger-2.0";
  else throw new SpecError("Campo `openapi` (3.x) ou `swagger` (2.0) não encontrado.");

  if (!d.info || typeof d.info !== "object") throw new SpecError("Campo `info` ausente.");
  if (!d.paths && !d.webhooks && !d.components) throw new SpecError("A spec não tem `paths`, `webhooks` nem `components`.");

  const normalized = JSON.stringify(d);
  const deps = d["x-api-hub"]?.dependsOn;
  return {
    format,
    title: typeof d.info.title === "string" ? d.info.title : null,
    version: typeof d.info.version === "string" ? d.info.version : "0.0.0",
    checksum: sha256(normalized),
    sizeBytes,
    normalized,
    declaredDependencies: Array.isArray(deps) ? deps.filter((x: unknown): x is string => typeof x === "string") : [],
  };
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options", "trace"] as const;

export type SpecOperation = { method: string; path: string; signature: string; deprecated: boolean };

export type OperationOutline = { method: string; path: string; tag: string; summary: string; deprecated: boolean };

/** Índice legível da spec: grupo (tag), resumo e se está descontinuada. */
export function outlineOperations(normalized: string): OperationOutline[] {
  let doc: unknown;
  try { doc = JSON.parse(normalized); } catch { return []; }
  if (!doc || typeof doc !== "object") return [];
  const paths = (doc as { paths?: unknown }).paths;
  if (!paths || typeof paths !== "object") return [];
  const out: OperationOutline[] = [];
  for (const [path, item] of Object.entries(paths)) {
    if (!item || typeof item !== "object") continue;
    for (const method of HTTP_METHODS) {
      const op = (item as Record<string, unknown>)[method];
      if (!op || typeof op !== "object") continue;
      const body = op as { tags?: unknown; summary?: unknown; deprecated?: unknown };
      const tag = Array.isArray(body.tags) ? body.tags.find((t): t is string => typeof t === "string" && t.trim().length > 0)?.trim() : undefined;
      out.push({
        method: method.toUpperCase(),
        path,
        tag: tag ?? "Geral",
        summary: typeof body.summary === "string" ? body.summary.trim() : "",
        deprecated: body.deprecated === true,
      });
    }
  }
  return out;
}

/** Path + método da spec já normalizada (JSON). Usado pelo índice de busca e pelo diff. */
export function listOperations(normalized: string): SpecOperation[] {
  let doc: unknown;
  try { doc = JSON.parse(normalized); } catch { return []; }
  if (!doc || typeof doc !== "object") return [];
  const paths = (doc as { paths?: unknown }).paths;
  if (!paths || typeof paths !== "object") return [];
  const out: SpecOperation[] = [];
  for (const [path, item] of Object.entries(paths)) {
    if (!item || typeof item !== "object") continue;
    for (const method of HTTP_METHODS) {
      const op = (item as Record<string, unknown>)[method];
      if (op && typeof op === "object") out.push({ method: method.toUpperCase(), path, signature: sha256(JSON.stringify(op)), deprecated: (op as { deprecated?: unknown }).deprecated === true });
    }
  }
  return out;
}

export type SpecChange = { kind: "added" | "removed" | "changed" | "deprecated"; method: string; path: string };

export type ChangeSummary = {
  added: number;
  removed: number;
  changed: number;
  deprecated: number;
  breaking: boolean;
  sample: SpecChange[];
};

/** Compara duas specs normalizadas. Incompatível, nesta versão, é remoção de path ou de método. */
export function diffSpecs(before: string, after: string): { changes: SpecChange[]; breaking: boolean } {
  const prev = new Map(listOperations(before).map((o) => [`${o.method} ${o.path}`, o]));
  const next = new Map(listOperations(after).map((o) => [`${o.method} ${o.path}`, o]));
  const changes: SpecChange[] = [];
  for (const [key, op] of next) {
    const old = prev.get(key);
    if (!old) changes.push({ kind: "added", method: op.method, path: op.path });
    else if (old.signature !== op.signature) changes.push({ kind: "changed", method: op.method, path: op.path });
    if (op.deprecated && !old?.deprecated) changes.push({ kind: "deprecated", method: op.method, path: op.path });
  }
  for (const [key, op] of prev) {
    if (!next.has(key)) changes.push({ kind: "removed", method: op.method, path: op.path });
  }
  return { changes, breaking: changes.some((c) => c.kind === "removed") };
}

export function summarizeDiff(diff: { changes: SpecChange[]; breaking: boolean }): ChangeSummary {
  return {
    added: diff.changes.filter((c) => c.kind === "added").length,
    removed: diff.changes.filter((c) => c.kind === "removed").length,
    changed: diff.changes.filter((c) => c.kind === "changed").length,
    deprecated: diff.changes.filter((c) => c.kind === "deprecated").length,
    breaking: diff.breaking,
    sample: diff.changes.slice(0, 20),
  };
}

export function readChangeSummary(value: unknown): ChangeSummary | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<ChangeSummary>;
  if (typeof v.added !== "number" || typeof v.removed !== "number" || typeof v.changed !== "number" || typeof v.breaking !== "boolean" || !Array.isArray(v.sample)) return null;
  const kindOk = (k: unknown) => k === "added" || k === "removed" || k === "changed" || k === "deprecated";
  return {
    added: v.added, removed: v.removed, changed: v.changed,
    deprecated: typeof v.deprecated === "number" ? v.deprecated : 0,
    breaking: v.breaking,
    sample: v.sample.filter((s) => s && kindOk(s.kind) && typeof s.method === "string" && typeof s.path === "string"),
  };
}
