"use client";

import { useActionState, useState } from "react";
import { looksSecret } from "@api-hub/core/envvars";
import { Button, Field, Input } from "@/components/ui";
import { useCloseOnSuccess } from "@/components/form-modal";
import { saveEnvVar } from "../actions";
import { Feedback, initialResult } from "./feedback";

/** Criar/editar uma variável de ambiente, com aviso quando o nome parece um segredo. */
export function EnvVarForm({ serviceId, environmentId, envName, current }: {
  serviceId: string; environmentId: string; envName: string;
  current?: { key: string; value: string | null; isSecret: boolean; description: string | null };
}) {
  const [state, action, pending] = useActionState(saveEnvVar, initialResult);
  useCloseOnSuccess(state, pending);
  const [key, setKey] = useState(current?.key ?? "");
  const [secret, setSecret] = useState(current?.isSecret ?? false);
  const suspicious = !secret && looksSecret(key);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="environmentId" value={environmentId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
        <Field label="Nome"><Input name="key" value={key} onChange={(e) => { setKey(e.target.value.toUpperCase()); if (!current && looksSecret(e.target.value.toUpperCase())) setSecret(true); }} readOnly={!!current} placeholder="DATABASE_URL" required /></Field>
        <Field label={`Valor em ${envName}`} hint={current?.isSecret ? "Deixe em branco para manter o segredo atual." : undefined}>
          <Input name="value" type={secret ? "password" : "text"} defaultValue={current && !current.isSecret ? current.value ?? "" : ""} autoComplete="off" />
        </Field>
      </div>
      <Field label="Descrição (Markdown)"><Input name="description" defaultValue={current?.description ?? ""} placeholder="Para que serve, formato esperado, quem fornece…" /></Field>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="isSecret" checked={secret} onChange={(e) => setSecret(e.target.checked)} className="accent-accent" /> Segredo (fica cifrado e oculto)</label>
        {suspicious && <label className="flex items-center gap-2 text-wait"><input type="checkbox" name="confirmPlain" className="accent-accent" /> Confirmo que pode ficar visível</label>}
        <Button className="ml-auto" disabled={pending}>{current ? "Salvar" : "Adicionar variável"}</Button>
      </div>
      <Feedback state={state} />
    </form>
  );
}
