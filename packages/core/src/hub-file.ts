import { z } from "zod";
import { slugify } from "./text";
import { RELATIONS_BY_KIND, type ChannelProtocol, type ResourceKind, type ResourceRelation, type ServiceKind } from "./types";

export const HUB_FILE = "hub.json";

const upper = (value: unknown) => typeof value === "string" ? value.trim().toUpperCase() : value;
const address = z.string().trim().min(1).max(500).refine((v) => !/:\/\/[^/\s]*:[^@\s]+@/.test(v), "Endereço não pode carregar senha.");

export const hubManifestSchema = z.object({
  slug: z.string().trim().toLowerCase().optional(),
  kind: z.preprocess(upper, z.enum(["API", "FRONTEND", "WORKER"])).optional(),
  channels: z.array(z.object({
    protocol: z.preprocess(upper, z.enum(["HTTP", "GRPC", "WEBSOCKET"])),
    name: z.string().trim().min(1).max(80),
    addresses: z.record(z.string(), address).optional(),
  })).max(20).default([]),
  consumes: z.array(z.object({
    service: z.string().trim().toLowerCase().min(2).max(63),
    protocol: z.preprocess(upper, z.enum(["HTTP", "GRPC", "WEBSOCKET"])).optional(),
    calls: z.array(z.object({
      method: z.string().trim().toUpperCase().min(1).max(10),
      path: z.string().trim().min(1).max(500),
    })).max(100).default([]),
  })).max(50).default([]),
  resources: z.array(z.object({
    name: z.string().trim().min(2).max(80),
    kind: z.preprocess(upper, z.enum(["HTTP_API", "QUEUE", "TOPIC", "WEBHOOK", "DATABASE", "CACHE", "STORAGE", "EMAIL_SMS", "OTHER"])),
    provider: z.string().trim().max(80).optional(),
    relation: z.preprocess(upper, z.enum(["CONSUMES", "PROVIDES", "PUBLISHES", "SUBSCRIBES", "SENDS_WEBHOOK", "RECEIVES_WEBHOOK", "READS", "WRITES"])),
  })).max(50).default([]),
});

export type HubManifest = z.infer<typeof hubManifestSchema>;

export type HubState = {
  slug: string;
  kind: ServiceKind;
  channels: { protocol: ChannelProtocol; name: string; addresses: Record<string, string> }[];
  consumes: { service: string; protocol?: ChannelProtocol | null; calls: { method: string; path: string }[] }[];
  resources: { name: string; kind: ResourceKind; provider?: string | null; relation: ResourceRelation }[];
};

export type HubPlan = {
  kind?: ServiceKind;
  channels: HubState["channels"];
  consumes: { service: string; protocol?: ChannelProtocol; calls: { method: string; path: string }[] }[];
  resources: { name: string; slug: string; kind: ResourceKind; provider?: string; relation: ResourceRelation }[];
  unknownServices: string[];
  rejected: string[];
};

export function parseHubManifest(text: string): { ok: true; manifest: HubManifest } | { ok: false; error: string } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: "hub.json não é um JSON válido." }; }
  const parsed = hubManifestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "hub.json inválido." };
  return { ok: true, manifest: parsed.data };
}

/** Separa o que aplica do que o catálogo ainda não conhece. Recurso novo entra no plano; serviço desconhecido, não. */
export function planHubManifest(manifest: HubManifest, knownServiceSlugs: Set<string>): HubPlan {
  const unknownServices: string[] = [];
  const consumes = manifest.consumes.flatMap((c) => {
    if (!knownServiceSlugs.has(c.service)) { unknownServices.push(c.service); return []; }
    return [{ service: c.service, protocol: c.protocol, calls: c.calls }];
  });
  const rejected: string[] = [];
  const resources = manifest.resources.flatMap((r) => {
    if (!RELATIONS_BY_KIND[r.kind].includes(r.relation)) {
      rejected.push(`${r.name}: relação incompatível com ${r.kind}.`);
      return [];
    }
    const slug = slugify(r.name) || "recurso";
    return [{ name: r.name, slug, kind: r.kind, provider: r.provider, relation: r.relation }];
  });
  return {
    kind: manifest.kind,
    channels: manifest.channels.map((c) => ({ protocol: c.protocol, name: c.name, addresses: c.addresses ?? {} })),
    consumes, resources, unknownServices, rejected,
  };
}

/** Documento estável para copiar ou gravar na raiz do repositório. */
export function renderHubManifest(state: HubState): string {
  const doc = {
    slug: state.slug,
    kind: state.kind.toLowerCase(),
    channels: state.channels.map((c) => ({
      protocol: c.protocol.toLowerCase(),
      name: c.name,
      ...(Object.keys(c.addresses).length ? { addresses: c.addresses } : {}),
    })),
    consumes: state.consumes.map((c) => ({
      service: c.service,
      ...(c.protocol ? { protocol: c.protocol.toLowerCase() } : {}),
      ...(c.calls.length ? { calls: c.calls } : {}),
    })),
    resources: state.resources.map((r) => ({
      name: r.name,
      kind: r.kind.toLowerCase(),
      ...(r.provider ? { provider: r.provider } : {}),
      relation: r.relation.toLowerCase(),
    })),
  };
  return `${JSON.stringify(doc, null, 2)}\n`;
}
