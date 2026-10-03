"use client";

import { useState } from "react";
import { MailEditor, emptyMail, mailPayload, type MailDraft } from "@/components/mail-editor";
import { Badge, Button, Field, Input } from "@/components/ui";
import { disableMail, saveMail, testMail } from "./actions";
import { Msg } from "./form-primitives";
import type { SettingsResult } from "./actions";

export function MailSettingsForm({ initial }: { initial: MailDraft | null }) {
  const [value, setValue] = useState<MailDraft>(initial ? { ...initial, password: "" } : emptyMail());
  const [to, setTo] = useState("");
  const [state, setState] = useState<SettingsResult | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (fn: () => Promise<SettingsResult>) => {
    setPending(true);
    setState(await fn());
    setPending(false);
  };

  return (
    <div className="space-y-5">
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Badge tone={initial ? "accent" : "neutral"}>{initial ? "Envio ligado" : "Envio desligado"}</Badge>
        Convite e link de nova senha saem por este servidor. A senha fica cifrada.
      </p>
      <MailEditor grouped value={value} onChange={setValue} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Field label="E-mail de prova" hint="Opcional, só para o teste.">
            <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <Button disabled={pending} onClick={() => run(() => saveMail(mailPayload(value)))}>{pending ? "Salvando…" : "Salvar SMTP"}</Button>
        <Button tone="quiet" disabled={pending} onClick={() => run(() => testMail(mailPayload(value), to))}>Testar conexão</Button>
        <Msg state={state} />
      </div>
      {initial && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Button tone="danger" disabled={pending} onClick={() => run(() => disableMail())}>Desligar envio</Button>
          <p className="text-sm text-muted">Os links voltam a ser só copiados.</p>
        </div>
      )}
    </div>
  );
}
