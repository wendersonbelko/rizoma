"use client";

import { useActionState, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { useCloseOnSuccess } from "@/components/form-modal";
import { addRepository } from "../actions";
import { Feedback, initialResult } from "./feedback";

const PROVIDER_LABEL: Record<string, string> = { GITHUB: "GitHub", GITLAB: "GitLab", BITBUCKET: "Bitbucket", GENERIC: "Outro" };

/** Provedores disponíveis vêm de Configurações → Repositórios; "Outro" sempre existe (só URL). */
export function RepositoryForm({ providers }: { providers: string[] }) {
  const [state, action, pending] = useActionState(addRepository, initialResult);
  useCloseOnSuccess(state, pending);
  const options = [...new Set([...providers.filter((p) => p !== "GENERIC"), "GENERIC"])];
  const [provider, setProvider] = useState(options[0]!);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
        <Field label="Onde está">
          <Select name="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
            {options.map((p) => <option key={p} value={p}>{PROVIDER_LABEL[p]}</option>)}
          </Select>
        </Field>
        <Field label={provider === "GENERIC" ? "Nome (grupo/repositório)" : "Repositório"} hint={provider === "GITLAB" ? "Aceita subgrupos: grupo/subgrupo/projeto." : undefined}>
          <Input name="fullName" placeholder={provider === "GITLAB" ? "backend/pagamentos/pix-api" : "empresa/pedidos-api"} required />
        </Field>
      </div>
      {provider === "GENERIC" && (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <Field label="URL do repositório"><Input name="url" type="url" placeholder="https://git.empresa.com/pedidos" required /></Field>
          <Field label="Branch padrão"><Input name="defaultBranch" defaultValue="main" /></Field>
        </div>
      )}
      <div className="flex items-center gap-4"><Button disabled={pending}>Adicionar</Button><Feedback state={state} /></div>
    </form>
  );
}
