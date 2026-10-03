"use client";

import { useMemo, useState, useTransition } from "react";
import { THEME_TOKENS, paletteProblems, resolveTheme, type Palette } from "@api-hub/core/themes";
import { Button } from "@/components/ui";
import { saveAppearance, type AppearanceResult } from "./actions";
import { TitleSection } from "./title-section";
import { ThemePicker } from "./theme-picker";
import { PaletteEditor } from "./palette-editor";
import { AppearancePreview } from "./appearance-preview";

/**
 * Tela de Aparência: só guarda o estado (nome, tema, paleta) e junta as quatro seções, cada
 * uma num arquivo à parte (título, tema, paleta, prévia) — nenhuma delas sabe salvar nada.
 */
export function AppearanceEditor({ appName: initialName, themeId: initialTheme, palette: initialPalette }: { appName: string; themeId: string; palette: Palette }) {
  const [appName, setAppName] = useState(initialName);
  const [themeId, setThemeId] = useState(initialTheme);
  const [palette, setPalette] = useState<Palette>(initialPalette);
  const [result, setResult] = useState<AppearanceResult | null>(null);
  const [pending, start] = useTransition();
  const problems = useMemo(() => paletteProblems(palette), [palette]);
  const custom = THEME_TOKENS.some((t) => palette[t] !== resolveTheme(themeId).palette[t]);

  const pickTheme = (id: string) => { setThemeId(id); setPalette(resolveTheme(id).palette); setResult(null); };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-8">
        <TitleSection appName={appName} onChange={setAppName} />
        <ThemePicker themeId={themeId} onPick={pickTheme} />
        <PaletteEditor
          palette={palette} problems={problems} showRestore={custom}
          onChange={setPalette} onRestore={() => setPalette(resolveTheme(themeId).palette)}
        />

        <div data-tour="appearance-save" className="flex flex-wrap items-center gap-4">
          <Button disabled={pending || problems.length > 0 || appName.trim().length < 2} onClick={() => start(async () => setResult(await saveAppearance({ appName, themeId, palette })))}>
            {pending ? "Salvando…" : "Salvar aparência"}
          </Button>
          {result?.message && <p role="status" className={`text-sm ${result.ok ? "text-accent" : "text-danger"}`}>{result.message}</p>}
        </div>
        {result?.problems && <ul className="text-sm text-danger">{result.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
      </div>

      <AppearancePreview appName={appName} palette={palette} />
    </div>
  );
}
