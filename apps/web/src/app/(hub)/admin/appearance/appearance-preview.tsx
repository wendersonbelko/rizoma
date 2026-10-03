import { paletteToCssVars, type Palette } from "@api-hub/core/themes";
import { HubLogo } from "@/components/hub-logo";

/** Prévia ao vivo da combinação de tema/paleta escolhida — dados fictícios, claramente rotulados. */
export function AppearancePreview({ appName, palette }: { appName: string; palette: Palette }) {
  return (
    <aside data-tour="appearance-preview" className="xl:sticky xl:top-6 xl:self-start">
      <div className="mb-2 flex items-center gap-2">
        <p className="text-sm text-muted">Prévia</p>
        <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Exemplo, não é um dado real</span>
      </div>
      <div style={paletteToCssVars(palette) as React.CSSProperties} className="overflow-hidden rounded-panel border border-line">
        <div className="flex" style={{ background: "var(--color-paper)", color: "var(--color-ink)" }}>
          <div className="w-28 border-r p-3 text-xs" style={{ borderColor: "var(--color-line)" }}>
            <p className="flex items-center gap-2 font-bold"><HubLogo className="size-6" />{appName || "…"}</p>
            <p className="mt-3 rounded px-1.5 py-1 font-semibold" style={{ background: "var(--color-sheet)", boxShadow: "inset 2px 0 0 var(--color-accent)" }}>Catálogo</p>
            <p className="mt-1 px-1.5" style={{ color: "var(--color-muted)" }}>Mapa</p>
            <p className="mt-1 px-1.5" style={{ color: "var(--color-muted)" }}>Integrações</p>
          </div>
          <div className="flex-1 space-y-3 p-4 text-sm">
            <p className="text-base font-bold">Serviço de exemplo</p>
            <p style={{ color: "var(--color-muted)" }}>Assim ficam os textos secundários.</p>
            <div className="rounded border p-3" style={{ background: "var(--color-sheet)", borderColor: "var(--color-line)" }}>
              <p>Consome <a style={{ color: "var(--color-accent)", textDecoration: "underline" }}>Serviço B (exemplo)</a></p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-wait)" }}>Exemplo de aviso (cor "Pendências")</p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-danger)" }}>Exemplo de erro (cor "Perigo")</p>
            </div>
            <span className="inline-block rounded px-3 py-1.5 text-xs font-medium" style={{ background: "var(--color-accent)", color: "var(--color-accent-ink)" }}>Salvar</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
