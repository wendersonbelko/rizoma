"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

type Config = Parameters<typeof ApiReferenceReact>[0]["configuration"];

/**
 * RN-S15: o hub é privado. Nada do renderizador pode enviar a spec para fora:
 * sem assistente de IA, MCP, compartilhamento, deploy, telemetria ou "testar requisição".
 */
export function ApiReference({ content, dark }: { content: string; dark?: boolean }) {
  const configuration = {
    content,
    withDefaultFonts: false,
    hideDarkModeToggle: true,
    forceDarkModeState: dark ? "dark" : "light",
    telemetry: false,
    showToolbar: "never",
    showDeveloperTools: "never",
    hideClientButton: false,
    hideTestRequestButton: true,
    mcp: { disabled: true },
    agent: { disabled: true },
    layout: "classic",
  } as unknown as Config;
  return <ApiReferenceReact configuration={configuration} />;
}
