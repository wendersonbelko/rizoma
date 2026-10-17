"use client";

import { useEffect } from "react";
import { THEME_COOKIE, themeChoiceFromPreference, type ThemeChoice } from "@api-hub/core/themes";
import type { ThemePreference } from "@api-hub/core/types";

/** Aplica o tema na hora (sem esperar o servidor) e guarda a escolha no cookie que o layout raiz lê. */
export function applyTheme(choice: ThemeChoice) {
  document.documentElement.dataset.theme = choice;
  document.cookie = `${THEME_COOKIE}=${choice}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * Achado F5 da auditoria de UX de 02/10/2026: o banco guarda o tema de cada pessoa, mas o cookie
 * é local do aparelho. Num aparelho novo (ou depois de limpar os cookies) o cookie não existe ou
 * diverge do banco; aqui a preferência salva vence e o cookie é refeito.
 */
export function ThemeSync({ preference }: { preference: ThemePreference }) {
  useEffect(() => {
    const choice = themeChoiceFromPreference(preference);
    const cookie = document.cookie.split("; ").find((c) => c.startsWith(`${THEME_COOKIE}=`))?.split("=")[1];
    if (document.documentElement.dataset.theme !== choice || cookie !== choice) applyTheme(choice);
  }, [preference]);
  return null;
}
