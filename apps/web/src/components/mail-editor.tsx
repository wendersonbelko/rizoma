"use client";

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

export const emptyMail = (): MailDraft => ({
  host: "", port: 587, secure: false, user: "", password: "", fromAddress: "", publicBaseUrl: "",
});

export function mailPayload(d: MailDraft) {
  return {
    host: d.host, port: d.port, secure: d.secure, user: d.user || undefined,
    ...(d.password ? { password: d.password } : {}),
    fromAddress: d.fromAddress, publicBaseUrl: d.publicBaseUrl,
  };
}

/** Campos do SMTP. Quem chama decide salvar, testar ou pular. `grouped` separa servidor e mensagens. */
export function MailEditor({ value, onChange, grouped = false }: { value: MailDraft; onChange: (v: MailDraft) => void; grouped?: boolean }) {
  const set = (patch: Partial<MailDraft>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-5">
      {grouped && <h3 className="text-sm font-semibold tracking-tight">Servidor</h3>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Servidor SMTP" hint="Ex.: smtp.empresa.com"><Input value={value.host} onChange={(e) => set({ host: e.target.value })} required /></Field>
        <Field label="Porta"><Input type="number" value={value.port} onChange={(e) => set({ port: Number(e.target.value) })} required /></Field>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={value.secure} onChange={(e) => set({ secure: e.target.checked })} className="mt-1 size-4 accent-accent" />
        <span>TLS implícito (porta 465). Desmarcado, a conexão usa STARTTLS quando o servidor oferece, como na porta 587.</span>
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Usuário" hint="Em branco se o servidor não exige autenticação."><Input value={value.user} onChange={(e) => set({ user: e.target.value })} autoComplete="off" /></Field>
        <Field label="Senha" hint={value.hasPassword ? "Já existe uma senha salva. Preencha só para trocar." : undefined}>
          <Input type="password" value={value.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" />
        </Field>
      </div>
      {grouped && <h3 className="text-sm font-semibold tracking-tight">Mensagens</h3>}
      <Field label="Remetente"><Input type="email" value={value.fromAddress} onChange={(e) => set({ fromAddress: e.target.value })} required /></Field>
      <Field label="Endereço público do hub" hint="Entra nos links do e-mail. Ex.: https://hub.empresa.com">
        <Input value={value.publicBaseUrl} onChange={(e) => set({ publicBaseUrl: e.target.value })} required />
      </Field>
    </div>
  );
}
