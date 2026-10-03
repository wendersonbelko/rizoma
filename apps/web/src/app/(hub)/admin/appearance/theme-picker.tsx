import { THEMES } from "@api-hub/core/themes";

/** Grade de temas prontos, cada um com uma miniatura da própria paleta. */
export function ThemePicker({ themeId, onPick }: { themeId: string; onPick: (id: string) => void }) {
  return (
    <section data-tour="appearance-themes" className="space-y-3">
      <h2 className="text-lg font-semibold">Tema</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((t) => (
          <button key={t.id} type="button" onClick={() => onPick(t.id)}
            className={`rounded-panel border-2 p-3 text-left ${themeId === t.id ? "border-accent" : "border-line hover:border-muted"}`}>
            <div className="mb-3 flex h-14 overflow-hidden rounded-control border border-line" style={{ background: t.palette.paper }}>
              <div className="w-1/3" style={{ background: t.palette.sheet, borderRight: `1px solid ${t.palette.line}` }} />
              <div className="flex flex-1 flex-col justify-center gap-1.5 px-3">
                <div className="h-2 w-3/4 rounded" style={{ background: t.palette.ink }} />
                <div className="h-2 w-1/2 rounded" style={{ background: t.palette.muted }} />
                <div className="h-3 w-10 rounded" style={{ background: t.palette.accent }} />
              </div>
            </div>
            <strong className="text-sm">{t.name}</strong>
            <span className="block text-xs text-muted">{t.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
