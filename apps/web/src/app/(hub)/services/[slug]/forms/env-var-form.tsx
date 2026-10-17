"use client";

import { useActionState, useState } from "react";
import { looksSecret } from "@api-hub/core/envvars";
import { Button, Field, Input } from "@/components/ui";
import { ModalActions, useCloseOnSuccess } from "@/components/form-modal";
import { saveEnvVar } from "../actions";
import { feedbackMessage, initialResult } from "./feedback";
import { OptionalDetails } from "./optional-details";

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
    <form action={action} className="space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="environmentId" value={environmentId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <Field label="Nome *" hint={current ? undefined : "Letras maiúsculas, números e _."}>
          <Input name="key" value={key} onChange={(e) => { setKey(e.target.value.toUpperCase()); if (!current && looksSecret(e.target.value.toUpperCase())) setSecret(true); }} readOnly={!!current} placeholder="DATABASE_URL" required autoComplete="off" spellCheck={false} />
        </Field>
        <Field label={`Valor em ${envName}`} hint={current?.isSecret ? "Deixe em branco para manter o segredo atual." : undefined}>
          <Input name="value" type={secret ? "password" : "text"} defaultValue={current && !current.isSecret ? current.value ?? "" : ""} autoComplete="off" />
        </Field>
      </div>
      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="isSecret" checked={secret} onChange={(e) => setSecret(e.target.checked)} className="accent-accent" /> Segredo (fica cifrado e oculto)</label>
        {suspicious && <label className="flex items-center gap-2 text-wait"><input type="checkbox" name="confirmPlain" className="accent-accent" /> Confirmo que pode ficar visível</label>}
      </div>
      <OptionalDetails summary="descrição" open={Boolean(current?.description)}>
        <Field label="Descrição (Markdown)"><Input name="description" defaultValue={current?.description ?? ""} placeholder="Para que serve, formato esperado, quem fornece…" /></Field>
      </OptionalDetails>
      <ModalActions message={feedbackMessage(state)}>
        <Button disabled={pending}>{pending ? "Salvando…" : current ? "Salvar variável" : "Adicionar variável"}</Button>
      </ModalActions>
    </form>
  );
}
