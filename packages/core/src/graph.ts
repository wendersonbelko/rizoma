import type { ChannelProtocol, LinkKind, ResourceKind, ResourceRelation, ServiceKind } from "./types";
import { CHANNEL_PROTOCOL_LABEL, SERVICE_KIND_LABEL } from "./types";

export type NodeKind = "service" | "repository" | "team" | "person" | "resource";
export interface GraphNode { id: string; kind: NodeKind; label: string; sub?: string; href?: string }
export interface GraphEdge { id: string; source: string; target: string; label: string; kind: LinkKind | ResourceRelation | "OWNS" | "MEMBER" | "SOURCE"; protocol?: ChannelProtocol | null }

export interface GraphInput {
  services: { id: string; slug: string; name: string; ownerTeamId: string | null; lifecycle: string; systemKind?: ServiceKind }[];
  repositories: { id: string; fullName: string; url?: string }[];
  teams: { id: string; name: string }[];
  people: { id: string; name: string; teamIds: string[] }[];
  resources?: { id: string; slug: string; name: string; kind: ResourceKind }[];
  serviceDeps: { id: string; fromServiceId: string; toServiceId: string; kind: LinkKind; protocol?: ChannelProtocol | null }[];
  repoLinks: { id: string; fromRepoId: string; toRepoId: string; kind: LinkKind }[];
  serviceRepos: { serviceId: string; repositoryId: string; role: string }[];
  serviceResources?: { id: string; serviceId: string; resourceId: string; relation: ResourceRelation }[];
}

export interface GraphFilters { kinds: NodeKind[]; serviceKinds?: ServiceKind[]; focusId?: string; focusIds?: string[]; depth?: number }

const PREFIX_KIND: Record<string, NodeKind> = { s: "service", r: "repository", t: "team", p: "person", x: "resource" };

/** Inverso dos ids montados em buildGraph ("s:<id>", "r:<id>"…). */
export function parseNodeId(nodeId: string): { kind: NodeKind; realId: string } | null {
  const sep = nodeId.indexOf(":");
  if (sep < 1) return null;
  const kind = PREFIX_KIND[nodeId.slice(0, sep)];
  const realId = nodeId.slice(sep + 1);
  return kind && realId ? { kind, realId } : null;
}

/** Relações em que o dado sai do recurso para o serviço: a seta aponta para o serviço. */
const INBOUND: ResourceRelation[] = ["SUBSCRIBES", "RECEIVES_WEBHOOK", "READS", "CONSUMES"];

/** Monta o grafo e, se houver foco, mantém só a vizinhança até `depth` saltos (RN-55). */
export function buildGraph(input: GraphInput, filters: GraphFilters): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const want = new Set(filters.kinds);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (want.has("service")) {
    const allow = filters.serviceKinds?.length ? new Set(filters.serviceKinds) : null;
    for (const s of input.services) {
      const systemKind = s.systemKind ?? "API";
      if (allow && !allow.has(systemKind)) continue;
      nodes.push({ id: `s:${s.id}`, kind: "service", label: s.name, sub: SERVICE_KIND_LABEL[systemKind], href: `/services/${s.slug}` });
    }
  }
  if (want.has("repository"))
    for (const r of input.repositories) nodes.push({ id: `r:${r.id}`, kind: "repository", label: r.fullName, href: r.url ?? `https://github.com/${r.fullName}` });
  if (want.has("team")) for (const t of input.teams) nodes.push({ id: `t:${t.id}`, kind: "team", label: t.name });
  if (want.has("person")) for (const p of input.people) nodes.push({ id: `p:${p.id}`, kind: "person", label: p.name });
  if (want.has("resource"))
    for (const x of input.resources ?? []) nodes.push({ id: `x:${x.id}`, kind: "resource", label: x.name, sub: x.kind, href: `/integrations/${x.slug}` });

  for (const d of input.serviceDeps) edges.push({ id: `sd:${d.id}`, source: `s:${d.fromServiceId}`, target: `s:${d.toServiceId}`, label: d.protocol ? `${d.kind} ${CHANNEL_PROTOCOL_LABEL[d.protocol]}` : d.kind, kind: d.kind, protocol: d.protocol });
  for (const l of input.repoLinks) edges.push({ id: `rl:${l.id}`, source: `r:${l.fromRepoId}`, target: `r:${l.toRepoId}`, label: l.kind, kind: l.kind });
  for (const sr of input.serviceRepos) edges.push({ id: `sr:${sr.serviceId}:${sr.repositoryId}`, source: `s:${sr.serviceId}`, target: `r:${sr.repositoryId}`, label: sr.role, kind: "SOURCE" });
  for (const s of input.services) if (s.ownerTeamId) edges.push({ id: `own:${s.id}`, source: `t:${s.ownerTeamId}`, target: `s:${s.id}`, label: "OWNS", kind: "OWNS" });
  for (const p of input.people) for (const t of p.teamIds) edges.push({ id: `m:${p.id}:${t}`, source: `p:${p.id}`, target: `t:${t}`, label: "MEMBER", kind: "MEMBER" });
  for (const x of input.serviceResources ?? []) {
    const [a, b] = INBOUND.includes(x.relation) ? [`x:${x.resourceId}`, `s:${x.serviceId}`] : [`s:${x.serviceId}`, `x:${x.resourceId}`];
    edges.push({ id: `xr:${x.id}`, source: a, target: b, label: x.relation, kind: x.relation });
  }

  const ids = new Set(nodes.map((n) => n.id));
  let visibleEdges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));

  const seeds = (filters.focusIds?.length ? filters.focusIds : filters.focusId ? [filters.focusId] : []).filter((id) => ids.has(id));
  if (seeds.length) {
    const depth = filters.depth ?? 1;
    const keep = new Set(seeds);
    let frontier = [...seeds];
    for (let i = 0; i < depth; i++) {
      const next: string[] = [];
      for (const e of visibleEdges) {
        if (frontier.includes(e.source) && !keep.has(e.target)) { keep.add(e.target); next.push(e.target); }
        if (frontier.includes(e.target) && !keep.has(e.source)) { keep.add(e.source); next.push(e.source); }
      }
      frontier = next;
    }
    visibleEdges = visibleEdges.filter((e) => keep.has(e.source) && keep.has(e.target));
    return { nodes: nodes.filter((n) => keep.has(n.id)), edges: visibleEdges };
  }
  return { nodes, edges: visibleEdges };
}
