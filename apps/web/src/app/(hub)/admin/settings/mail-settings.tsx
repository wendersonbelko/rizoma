"use client";

import { useState, useTransition } from "react";
import { MailEditor, emptyMail, mailPayloadFromForm, type MailDraft } from "@/components/mail-editor";
import { DangerAction, DangerZone } from "@/components/danger-zone";
import { Badge, Button, Field, Input } from "@/components/ui";
import { disableMail, saveMail, testMail } from "./actions";
import { Msg, SettingsForm } from "./form-primitives";
import type { SettingsResult } from "./actions";

/** Servidor de e-mail: um formulário só, com o botão de salvar aparecendo quando há mudança (achado F1). */
export function MailSettingsForm({ initial }: { initial: MailDraft | null }) {
  return (
    <div className="space-y-5">
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Badge tone={initial ? "accent" : "neutral"}>{initial ? "Envio ligado" : "Envio desligado"}</Badge>
        {initial ? "Convites e links de nova senha saem por este servidor." : "Sem servidor, convites e links de nova senha são só copiados e enviados por você."}
      </p>
      <SettingsForm action={async (form) => saveMail(mailPayloadFromForm(form))} saveLabel="Salvar e-mail">
        <MailFields initial={initial} />
      </SettingsForm>
    </div>
  );
}

/**
 * Fica dentro do formulário: o estado dos campos mora aqui para o "Descartar" da barra voltar ao que está salvo.
 * Testar a conexão usa o que está na tela agora, sem salvar.
 */
function MailFields({ initial }: { initial: MailDraft | null }) {
  const [value, setValue] = useState<MailDraft>(initial ? { ...initial, password: "" } : emptyMail());
  const [to, setTo] = useState("");
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [testing, startTest] = useTransition();

  return (
    <>
      <MailEditor value={value} onChange={setValue} />
      <div className="flex flex-wrap items-end gap-3 rounded-control border border-line bg-paper/60 p-4">
        <div className="w-full max-w-xs">
          <Field label="E-mail de prova" hint="Opcional: o teste também envia uma mensagem para este endereço.">
            {/* Sem `name`: não é dado do servidor de e-mail, então não conta como alteração nem é enviado. O Enter não salva o formulário. */}
            <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} />
          </Field>
        </div>
        <Button
          type="button"
          tone="quiet"
          disabled={testing}
          onClick={(e) => {
            const form = e.currentTarget.form;
            if (!form) return;
            const payload = mailPayloadFromForm(new FormData(form));
            setResult(null);
            startTest(async () => setResult(await testMail(payload, to)));
          }}
        >
          {testing ? "Testando…" : "Testar conexão"}
        </Button>
        <Msg state={result} />
      </div>
    </>
  );
}

/**
 * Desligar o envio de e-mail, no fim da aba, no padrão único de ação destrutiva (achado F3). Depois de desligar,
 * a aba recarrega sem a zona de perigo e o selo do formulário passa a "Envio desligado".
 */
export function MailDangerZone() {
  return (
    <DangerZone>
      <DangerAction
        title="Desligar envio de e-mail"
        description="Apaga a configuração do servidor, inclusive a senha guardada. Convites e links de nova senha deixam de sair por e-mail: você copia o link e envia à pessoa."
        actionLabel="Desligar envio"
        action={async () => disableMail()}
      />
    </DangerZone>
  );
}
