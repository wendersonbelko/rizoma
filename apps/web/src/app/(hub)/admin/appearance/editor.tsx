"use client";

import { useMemo, useState } from "react";
import { accentProblems } from "@api-hub/core/themes";
import { SettingsForm } from "@/app/(hub)/admin/settings/form-primitives";
import { saveAppearance } from "./actions";
import { TitleSection } from "./title-section";
import { AccentSection } from "./accent-section";
import { AppearancePreview } from "./appearance-preview";

/**
 * Marca da instalação: nome do sistema e cor de destaque, com a prévia nos dois temas ao lado
 * (achado F5 da auditoria de UX de 02/10/2026; o tema Claro/Escuro é de cada pessoa, no menu do
 * avatar). É a aba "Aparência" de Configurações e, como as outras, só mostra o botão de salvar quando
 * há mudança (achado F1): o <SettingsForm> compara o formulário com o estado salvo.
 */
export function AppearanceEditor({ appName, accent }: { appName: string; accent: string }) {
  const save = async (form: FormData) => {
    const result = await saveAppearance({ appName: String(form.get("appName") ?? ""), accent: String(form.get("accent") ?? "") });
    // Cor ilegível: a mensagem e o motivo viram uma frase só, que cabe na barra de salvar.
    return result.problems?.length ? { ok: false, message: [result.message, ...result.problems].filter(Boolean).join(" ") } : result;
  };
  return (
    <SettingsForm action={save} saveLabel="Salvar marca">
      <AppearanceFields initialName={appName} initialAccent={accent} />
    </SettingsForm>
  );
}

/**
 * O estado dos campos mora aqui, dentro do formulário, para o "Descartar" da barra voltar ao que está salvo.
 * Nenhuma seção sabe salvar: só escrevem `appName` e `accent` no formulário.
 */
function AppearanceFields({ initialName, initialAccent }: { initialName: string; initialAccent: string }) {
  const [appName, setAppName] = useState(initialName);
  const [accent, setAccent] = useState(initialAccent);
  const problems = useMemo(() => accentProblems(accent), [accent]);
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="space-y-8">
        <TitleSection appName={appName} onChange={setAppName} />
        <AccentSection accent={accent} problems={problems} onChange={setAccent} />
      </div>
      <AppearancePreview appName={appName} accent={accent} />
    </div>
  );
}
