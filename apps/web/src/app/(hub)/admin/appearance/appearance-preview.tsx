import { DEFAULT_ACCENT, THEME_MODES, THEME_MODE_LABEL, accentProblems, buildPalette, paletteToCssVars, type ThemeMode } from "@api-hub/core/themes";
import { HubLogo } from "@/components/hub-logo";

/**
 * Uma amostra do app inteira num tema: o wrapper redefine as variáveis --color-*, então as classes de
 * tokens lá dentro (bg-sheet, text-accent, border-line-strong…) pintam como o tema pintaria de verdade.
 */
function ThemeMock({ mode, appName, accent }: { mode: ThemeMode; appName: string; accent: string }) {
  const vars = paletteToCssVars(buildPalette(mode, accent)) as React.CSSProperties;
  return (
    <figure>
      <figcaption className="mb-1.5 text-sm font-medium">{THEME_MODE_LABEL[mode]}</figcaption>
      <div className="overflow-hidden rounded-panel border border-line">
        <div style={vars} className="flex min-h-72 bg-paper text-ink">
          <div className="w-24 shrink-0 border-r border-line bg-sheet p-2.5 text-[11px]">
            <p className="flex items-center gap-1.5 font-bold"><HubLogo className="size-4 shrink-0" /><span className="truncate">{appName || "…"}</span></p>
            <p className="mt-3 rounded px-1.5 py-1 font-semibold text-accent shadow-[inset_2px_0_0_var(--color-accent)]">Catálogo</p>
            <p className="mt-1 px-1.5 text-muted">Mapa</p>
            <p className="mt-1 px-1.5 text-muted">Integrações</p>
          </div>
          <div className="min-w-0 flex-1 space-y-2.5 p-3 text-xs">
            <p className="text-sm font-bold">Serviço de exemplo</p>
            <p className="text-muted">Texto secundário e <span className="text-accent underline">um link</span>.</p>
            <div className="space-y-2 rounded-control border border-line bg-sheet p-2">
              <p className="h-7 rounded-control border border-line-strong bg-field px-2 leading-7 text-muted">Buscar serviço</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="rounded-control bg-accent px-2.5 py-1 font-medium text-accent-ink">Salvar</span>
                <span className="text-wait">Pendência</span>
                <span className="text-danger">Erro</span>
              </div>
            </div>
            <div className="rounded-panel border border-line bg-raised p-2.5 shadow-[0_8px_20px_color-mix(in_srgb,var(--color-shadow)_30%,transparent)]">
              <p className="font-semibold">Novo vínculo</p>
              <p className="text-muted">Modal sobre a página.</p>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

/** Prévia ao vivo da marca nos dois temas, lado a lado — dados fictícios, claramente rotulados. */
export function AppearancePreview({ appName, accent }: { appName: string; accent: string }) {
  // Enquanto a cor digitada está incompleta ou ilegível, a prévia mostra o padrão em vez de quebrar.
  const safe = accentProblems(accent).length === 0 ? accent : DEFAULT_ACCENT;
  return (
    <section data-tour="appearance-preview" aria-label="Prévia nos temas Claro e Escuro" className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">Prévia</h2>
        <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Exemplo, não é um dado real</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {THEME_MODES.map((mode) => <ThemeMock key={mode} mode={mode} appName={appName} accent={safe} />)}
      </div>
    </section>
  );
}
