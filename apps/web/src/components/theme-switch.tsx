"use client";

import { useState, useTransition } from "react";
import { themeChoiceFromPreference } from "@api-hub/core/themes";
import { THEME_PREFERENCES, THEME_PREFERENCE_LABEL, type ThemePreference } from "@api-hub/core/types";
import { setThemePreference } from "@/lib/theme-actions";
import { applyTheme } from "@/components/theme-sync";

function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.5v1.75M8 12.75v1.75M1.5 8h1.75M12.75 8h1.75M3.4 3.4l1.25 1.25M11.35 11.35l1.25 1.25M12.6 3.4l-1.25 1.25M4.65 11.35 3.4 12.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z" />
    </svg>
  );
}

const ICON: Partial<Record<ThemePreference, () => React.JSX.Element>> = { LIGHT: SunIcon, DARK: MoonIcon };

/**
 * Seletor Claro, Escuro e Sistema (achado F5 da auditoria de UX de 02/10/2026). Troca o tema na
 * hora e grava a escolha por pessoa; se o servidor recusar, volta ao tema anterior e avisa.
 */
export function ThemeSwitch({ preference }: { preference: ThemePreference }) {
  const [value, setValue] = useState(preference);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const pick = (next: ThemePreference) => {
    const previous = value;
    setValue(next);
    setError(null);
    applyTheme(themeChoiceFromPreference(next));
    start(async () => {
      const result = await setThemePreference(next);
      if (result.ok) return;
      setValue(previous);
      applyTheme(themeChoiceFromPreference(previous));
      setError(result.message ?? "Não foi possível salvar o tema. Tente de novo.");
    });
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Aparência" className="grid grid-cols-3 gap-1 rounded-control border border-line bg-paper p-1">
        {THEME_PREFERENCES.map((p) => {
          const Icon = ICON[p];
          return (
            <label
              key={p}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[7px] px-2 py-1.5 text-xs font-medium text-muted transition hover:text-ink has-[:checked]:bg-sheet has-[:checked]:text-ink has-[:checked]:shadow-sm has-[:checked]:ring-1 has-[:checked]:ring-line-strong has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input type="radio" name="theme" value={p} checked={value === p} onChange={() => pick(p)} className="sr-only" />
              {Icon && <Icon />}
              {THEME_PREFERENCE_LABEL[p]}
            </label>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
