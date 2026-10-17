"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-color-scheme: dark)";

/**
 * O tema que está valendo na tela agora. `<html data-theme>` é "light", "dark" ou "system"; só em
 * "system" quem decide é o navegador (prefers-color-scheme), que o servidor não enxerga.
 */
function readDark(): boolean {
  const theme = document.documentElement.dataset.theme;
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  // A pessoa troca o tema no menu do usuário sem recarregar a página (muda o data-theme)…
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // …e, em "Sistema", o próprio aparelho pode alternar claro/escuro.
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/**
 * Pendência herdada da fase 1 (tema por pessoa): `getTheme().dark` só é verdadeiro quando a pessoa
 * escolheu "Escuro"; em "Sistema" fica falso e o Scalar abria claro num aparelho escuro. Aqui o
 * navegador decide. `serverHint` é o que o servidor sabia (vale na hidratação, para não piscar
 * quando o cookie já diz "escuro").
 */
export function useDarkMode(serverHint: boolean): boolean {
  return useSyncExternalStore(subscribe, readDark, () => serverHint);
}
