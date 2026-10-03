import { THEME_TOKENS, TOKEN_LABEL, type Palette } from "@api-hub/core/themes";

/** Ajuste fino de cada cor do tema escolhido, com aviso de contraste (WCAG AA) por combinação. */
export function PaletteEditor({ palette, problems, showRestore, onChange, onRestore }: {
  palette: Palette; problems: string[]; showRestore: boolean; onChange: (palette: Palette) => void; onRestore: () => void;
}) {
  return (
    <section data-tour="appearance-palette" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Paleta de cores</h2>
        {showRestore && <button type="button" className="text-sm text-accent" onClick={onRestore}>Restaurar cores do tema</button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {THEME_TOKENS.map((t) => (
          <label key={t} className="flex items-center gap-3 rounded-control border border-line bg-field p-2 text-sm">
            <input type="color" value={palette[t]} onChange={(e) => onChange({ ...palette, [t]: e.target.value })} className="size-9 shrink-0 cursor-pointer rounded border border-line" />
            <span className="min-w-0">
              <span className="block truncate">{TOKEN_LABEL[t]}</span>
              <span className="font-mono text-xs text-muted">{palette[t]}</span>
            </span>
          </label>
        ))}
      </div>
      {problems.length > 0 && (
        <ul className="space-y-1 rounded-control border border-danger/40 bg-field p-3 text-sm text-danger">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
    </section>
  );
}
