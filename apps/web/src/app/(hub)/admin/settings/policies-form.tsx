"use client";

import { Field, Input, Select } from "@/components/ui";
import { savePolicies } from "./actions";
import { Form } from "./form-primitives";

export function PoliciesForm(p: { auto: boolean; outsider: string; session: number; recheck: number; ttl: number }) {
  return (
    <Form action={savePolicies} submit="Salvar regras">
      <div className="space-y-4 rounded-control border border-line bg-field p-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="auto" defaultChecked={p.auto} className="mt-1 size-4 accent-accent" />
          <span>
            <strong>Liberar automaticamente quem comprova vínculo com a empresa</strong>
            <span className="mt-0.5 block text-sm text-muted">Desmarcado, todo mundo passa pela aprovação.</span>
          </span>
        </label>
        <Field label="Quem não comprova vínculo" hint="Vínculo = pertencer a um domínio de e-mail ou org do GitHub aceitos na Organização.">
          <Select name="outsider" defaultValue={p.outsider}>
            <option value="REQUEST_APPROVAL">Pode pedir acesso e aguardar aprovação</option>
            <option value="BLOCK">Não pode entrar (convites e aprovações manuais continuam valendo)</option>
          </Select>
        </Field>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">Prazos</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Sessão (horas)" hint="Tempo até pedir login de novo."><Input name="session" type="number" min={1} max={72} defaultValue={p.session} /></Field>
          <Field label="Revalidar vínculo (horas)" hint="De quanto em quanto tempo o hub confere se a pessoa ainda pertence à empresa."><Input name="recheck" type="number" min={1} max={72} defaultValue={p.recheck} /></Field>
          <Field label="Pedido expira (dias)" hint="Pedidos de acesso não decididos somem depois disso."><Input name="ttl" type="number" min={1} max={90} defaultValue={p.ttl} /></Field>
        </div>
      </div>
    </Form>
  );
}
