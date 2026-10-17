"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui";

export type MailDraft = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromAddress: string;
  publicBaseUrl: string;
  hasPassword?: boolean;
};

const DEFAULT_PORT = 587;

export const emptyMail = (): MailDraft => ({
  host: "", port: DEFAULT_PORT, secure: false, user: "", password: "", fromAddress: "", publicBaseUrl: "",
});

export function mailPayload(d: MailDraft) {
  return {
    host: d.host, port: d.port, secure: d.secure, user: d.user || undefined,
    ...(d.password ? { password: d.password } : {}),
    fromAddress: d.fromAddress, publicBaseUrl: d.publicBaseUrl,
  };
}

/** Lê os campos do <MailEditor> (todos têm `name`) de um formulário, para quem salva ou testa sem guardar o estado à parte. */
export function mailPayloadFromForm(form: FormData) {
  const text = (name: string) => String(form.get(name) ?? "");
  return mailPayload({
    host: text("host"), port: Number(text("port")), secure: form.get("secure") === "on", user: text("user"),
    password: text("password"), fromAddress: text("fromAddress"), publicBaseUrl: text("publicBaseUrl"),
  });
}

/**
 * Campos do SMTP. Quem chama decide salvar, testar ou pular.
 * Começa pelo propósito e deixa o jargão de rede (porta, TLS, STARTTLS) em "Avançado" (achado V5 da
 * auditoria de UX de 02/10/2026); a aba abre já aberta se a configuração salva usa algo fora do padrão.
 */
export function MailEditor({ value, onChange }: { value: MailDraft; onChange: (v: MailDraft) => void }) {
  const set = (patch: Partial<MailDraft>) => onChange({ ...value, ...patch });
  const [advancedOpen] = useState(() => value.secure || value.port !== DEFAULT_PORT);
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">O sistema usa este servidor para enviar convites e links de nova senha.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Servidor SMTP *" hint="Ex.: smtp.empresa.com"><Input name="host" value={value.host} onChange={(e) => set({ host: e.target.value })} required /></Field>
        <Field label="Remetente *" hint="O endereço que aparece como quem enviou."><Input name="fromAddress" type="email" value={value.fromAddress} onChange={(e) => set({ fromAddress: e.target.value })} required /></Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Usuário" hint="Em branco se o servidor não exige autenticação."><Input name="user" value={value.user} onChange={(e) => set({ user: e.target.value })} autoComplete="off" /></Field>
        <Field label="Senha" hint={value.hasPassword ? "Já existe uma senha salva. Preencha só para trocar." : "Fica cifrada no banco."}>
          <Input name="password" type="password" value={value.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" />
        </Field>
      </div>
      <Field label="Endereço público do hub *" hint="Entra nos links do e-mail. Ex.: https://hub.empresa.com">
        <Input name="publicBaseUrl" value={value.publicBaseUrl} onChange={(e) => set({ publicBaseUrl: e.target.value })} required />
      </Field>
      <details open={advancedOpen} className="rounded-control border border-line bg-paper/60 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">Avançado: porta e criptografia</summary>
        <div className="mt-3 space-y-4">
          {/* Sem `required`: dentro de um <details> fechado o navegador não consegue apontar o campo inválido. O servidor confere a porta. */}
          <div className="max-w-40">
            <Field label="Porta" hint="Em geral 587 ou 465."><Input name="port" type="number" min={1} max={65535} value={value.port} onChange={(e) => set({ port: Number(e.target.value) })} /></Field>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="secure" checked={value.secure} onChange={(e) => set({ secure: e.target.checked })} className="mt-1 size-4 accent-accent" />
            <span>TLS implícito (porta 465). Desmarcado, a conexão usa STARTTLS quando o servidor oferece, como na porta 587.</span>
          </label>
        </div>
      </details>
    </div>
  );
}
