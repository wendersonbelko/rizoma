"use client";

import { useState } from "react";
import dagre from "@dagrejs/dagre";
import type { GraphEdge, GraphNode, NodeKind } from "@api-hub/core/graph";
import { RESOURCE_KIND_LABEL, SERVICE_KIND_LABEL, type ResourceKind, type ServiceKind } from "@api-hub/core/types";
import { Button } from "@/components/ui";
import { edgeRelationLabel, KIND } from "./constants";
import { recordGraphPrint } from "./print-actions";

const NW = 250;
const NH = 74;

function color(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function subtitle(n: GraphNode) {
  if (n.kind === "resource" && n.sub && n.sub in RESOURCE_KIND_LABEL) return RESOURCE_KIND_LABEL[n.sub as ResourceKind];
  return n.sub;
}

type Box = { x: number; y: number; w: number; h: number };

function overlaps(a: Box, b: Box, gap = 8) {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/** `depth` é o alcance em graus (1 ou 2); sem ele o print leva o mapa todo ("Tudo"). */
export type PrintFilters = { kinds: NodeKind[]; serviceKinds: ServiceKind[]; focusLabel?: string; depth?: number };
export type PrintStamp = { id: string; who: string; at: string; orgName: string; appName: string };

/** Desenha as ligações visíveis num cartaz e baixa o PNG. */
function downloadGraphPrint(nodes: GraphNode[], edges: GraphEdge[], filters: PrintFilters | undefined, stamp: PrintStamp) {
  const paper = color("--color-paper", "#f4f7f5");
  const sheet = color("--color-sheet", "#ffffff");
  const ink = color("--color-ink", "#16242c");
  const muted = color("--color-muted", "#5b6b70");
  const line = color("--color-line", "#e2e8e4");
  const accent = color("--color-accent", "#0f7a68");
  const wait = color("--color-wait", "#8f5c0c");

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 88, ranksep: 200 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((n) => g.setNode(n.id, { width: NW, height: NH }));
  edges.forEach((e) => { if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target); });
  dagre.layout(g);

  const placed = nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, x: p ? p.x - NW / 2 : 0, y: p ? p.y - NH / 2 : 0 };
  });
  const maxX = placed.reduce((m, n) => Math.max(m, n.x + NW), 640);
  const maxY = placed.reduce((m, n) => Math.max(m, n.y + NH), 160);

  const pad = 56;
  const header = (filters?.focusLabel ? 252 : 230);
  const legend = 36;
  const foot = 72;
  const width = Math.ceil(maxX + pad * 2);
  const height = Math.ceil(header + legend + maxY + foot + pad);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = muted;
  ctx.font = "600 14px 'Schibsted Grotesk', sans-serif";
  ctx.fillText(fitText(ctx, `Empresa: ${stamp.orgName || "—"}`, width - pad * 2), pad, 40);
  ctx.fillStyle = ink;
  ctx.font = "700 28px 'Schibsted Grotesk', sans-serif";
  ctx.fillText(fitText(ctx, stamp.appName || "Rizoma", width - pad * 2), pad, 74);
  ctx.fillStyle = ink;
  ctx.font = "700 20px 'Schibsted Grotesk', sans-serif";
  ctx.fillText("Mapa de ligações", pad, 106);
  ctx.fillStyle = muted;
  ctx.font = "400 15px 'Schibsted Grotesk', sans-serif";
  ctx.fillText(`Gerado por ${stamp.who} em ${stamp.at}`, pad, 132);
  ctx.fillText(`Registro de auditoria: ${stamp.id}`, pad, 154);
  const activeKinds = (filters?.kinds ?? []).map((k) => KIND[k].label);
  const activeSystems = (filters?.serviceKinds ?? []).map((k) => SERVICE_KIND_LABEL[k]);
  ctx.font = "600 14px 'Schibsted Grotesk', sans-serif";
  ctx.fillStyle = ink;
  ctx.fillText(`Filtros: ${activeKinds.length ? activeKinds.join(", ") : "nenhum tipo"}`, pad, 184);
  ctx.fillText(`Sistemas: ${activeSystems.length ? activeSystems.join(", ") : "nenhum"}`, pad, 206);
  if (filters?.focusLabel) {
    ctx.fillText(`Foco: ${filters.focusLabel} · ${filters.depth ? `${filters.depth}º grau` : "tudo"}`, pad, 228);
  }

  const kinds = [...new Set(nodes.map((n) => n.kind))];
  kinds.forEach((kind, i) => {
    const x = pad + i * 168;
    ctx.fillStyle = kind === "service" ? accent : kind === "resource" ? wait : ink;
    ctx.beginPath();
    ctx.arc(x + 6, header + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = "600 13px 'Schibsted Grotesk', sans-serif";
    ctx.fillText(KIND[kind as NodeKind].label, x + 18, header + 13);
  });

  const ox = pad;
  const oy = header + legend;
  const byId = new Map(placed.map((n) => [n.id, n]));
  const nodeBoxes: Box[] = placed.map((n) => ({ x: ox + n.x - 6, y: oy + n.y - 6, w: NW + 12, h: NH + 12 }));
  const labelBoxes: Box[] = [];
  const outs = new Map<string, number>();
  const ins = new Map<string, number>();
  for (const e of edges) {
    outs.set(e.source, (outs.get(e.source) ?? 0) + 1);
    ins.set(e.target, (ins.get(e.target) ?? 0) + 1);
  }
  const outAt = new Map<string, number>();
  const inAt = new Map<string, number>();

  for (const e of edges) {
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    if (!a || !b) continue;
    const outCount = outs.get(e.source) ?? 1;
    const inCount = ins.get(e.target) ?? 1;
    const outIndex = outAt.get(e.source) ?? 0;
    const inIndex = inAt.get(e.target) ?? 0;
    outAt.set(e.source, outIndex + 1);
    inAt.set(e.target, inIndex + 1);
    const slot = (index: number, count: number) => (count <= 1 ? NH / 2 : 16 + (index * (NH - 32)) / (count - 1));
    const x1 = ox + a.x + NW;
    const y1 = oy + a.y + slot(outIndex, outCount);
    const x2 = ox + b.x;
    const y2 = oy + b.y + slot(inIndex, inCount);
    ctx.strokeStyle = muted;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2 - 8, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2 - 10, y2 - 5);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - 10, y2 + 5);
    ctx.stroke();

    const label = edgeRelationLabel(e);
    ctx.font = "600 12px 'Schibsted Grotesk', sans-serif";
    const tw = ctx.measureText(label).width;
    const baseX = (x1 + x2) / 2 - (tw + 16) / 2;
    const baseY = (y1 + y2) / 2 - 11;
    let box: Box = { x: baseX, y: baseY, w: tw + 16, h: 22 };
    const occupied = [...nodeBoxes, ...labelBoxes];
    for (let step = 0; step < 18 && occupied.some((other) => overlaps(box, other)); step++) {
      const dir = step % 2 === 0 ? 1 : -1;
      const amount = Math.ceil((step + 1) / 2) * 26;
      box = { x: baseX, y: Math.max(oy, baseY + dir * amount), w: tw + 16, h: 22 };
    }
    labelBoxes.push(box);
    ctx.fillStyle = paper;
    roundRect(ctx, box.x, box.y, box.w, box.h, 8);
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.stroke();
    ctx.fillStyle = muted;
    ctx.fillText(label, box.x + 8, box.y + 15);
  }

  for (const n of placed) {
    const x = ox + n.x;
    const y = oy + n.y;
    ctx.fillStyle = n.kind === "team" || n.kind === "person" ? paper : sheet;
    ctx.strokeStyle = n.kind === "resource" ? wait : line;
    ctx.lineWidth = 1.5;
    ctx.setLineDash(n.kind === "resource" ? [5, 4] : []);
    roundRect(ctx, x, y, NW, NH, n.kind === "team" || n.kind === "person" ? 37 : 14);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    if (n.kind === "service") {
      ctx.fillStyle = accent;
      roundRect(ctx, x, y, 5, NH, 3);
      ctx.fill();
    }
    ctx.fillStyle = ink;
    ctx.font = "600 16px 'Schibsted Grotesk', sans-serif";
    const title = fitText(ctx, n.label, NW - 36);
    ctx.fillText(title, x + 16, y + 30);
    const sub = subtitle(n);
    if (sub) {
      ctx.fillStyle = accent;
      ctx.font = "600 12px 'Schibsted Grotesk', sans-serif";
      ctx.fillText(fitText(ctx, sub, NW - 36), x + 16, y + 50);
    }
  }

  ctx.fillStyle = muted;
  ctx.font = "400 13px 'Schibsted Grotesk', sans-serif";
  ctx.fillText("A seta mostra o sentido da ligação.", pad, height - 28);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `link-map-${stamp.id}.png`;
  a.click();
}

/** Câmera abaixo do botão de novo vínculo: confirma e baixa o cartaz das ligações em foco (as nítidas na tela). */
export function PrintGraphButton({ nodes, edges, filters }: { nodes: GraphNode[]; edges: GraphEdge[]; filters: PrintFilters }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const stamp = await recordGraphPrint({
        filters,
        nodes: nodes.map((n) => ({ id: n.id, kind: n.kind, label: n.label, sub: n.sub })),
        edges: edges.map((e) => ({ id: e.id, from: e.source, to: e.target, relation: edgeRelationLabel(e) })),
      });
      downloadGraphPrint(nodes, edges, filters, stamp);
      setOpen(false);
    } catch {
      setError("Não foi possível registrar o print. A imagem não foi gerada.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <button
        type="button"
        data-tour="graph-print"
        aria-label="Tirar um print das ligações"
        title="Tirar um print das ligações"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full border border-line bg-sheet text-ink hover:border-accent"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay px-4" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="print-graph-title"
            className="w-full max-w-sm rounded-panel border border-line bg-raised p-6"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="print-graph-title" className="text-lg font-semibold tracking-tight">Tem certeza que deseja tirar um print?</h2>
            <p className="mt-2 text-sm text-muted">A imagem usa as ligações em foco (as que estão nítidas na tela agora), com nome, tipo e o sentido de cada seta.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" tone="quiet" disabled={pending} onClick={() => setOpen(false)}>Não</Button>
              <Button type="button" disabled={pending} onClick={() => { void confirm(); }}>{pending ? "Registrando…" : "Sim"}</Button>
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
