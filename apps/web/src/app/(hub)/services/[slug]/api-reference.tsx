"use client";

import { useMemo } from "react";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { useDarkMode } from "./use-dark-mode";

type Config = Parameters<typeof ApiReferenceReact>[0]["configuration"];

/**
 * RN-S15: o hub é privado. Nada do renderizador pode enviar a spec para fora:
 * sem assistente de IA, MCP, compartilhamento, deploy, telemetria ou "testar requisição".
 *
 * O modo escuro segue o tema que está na tela (Claro, Escuro ou Sistema), inclusive quando a pessoa
 * o troca no menu do usuário com a página aberta. `dark` é só a dica do servidor para a primeira pintura.
 */
export function ApiReference({ content, dark }: { content: string; dark?: boolean }) {
  const isDark = useDarkMode(Boolean(dark));
  // Objeto estável: o wrapper do Scalar reaplica a configuração toda vez que ela muda de identidade.
  const configuration = useMemo(() => ({
    content,
    withDefaultFonts: false,
    hideDarkModeToggle: true,
    forceDarkModeState: isDark ? "dark" : "light",
    telemetry: false,
    showToolbar: "never",
    showDeveloperTools: "never",
    hideClientButton: false,
    hideTestRequestButton: true,
    mcp: { disabled: true },
    agent: { disabled: true },
    layout: "classic",
  } as unknown as Config), [content, isDark]);
  return <ApiReferenceReact configuration={configuration} />;
}
