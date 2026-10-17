import Link from "next/link";
import { Button, Field, Input, Select } from "@/components/ui";
import { AUDIT_GROUP_LIST } from "./events";
import type { AuditFilters } from "./query";

/**
 * Filtros da Auditoria (achado V3 da auditoria de UX de 02/10/2026): os doze chips viraram um menu
 * "Tipo de evento", ao lado de Período (De/Até) e Pessoa. Mesmos parâmetros de URL de antes
 * (`group`, `from`, `to`, `actor`), então links e o CSV continuam valendo. É um formulário GET comum:
 * funciona sem JavaScript e o filtro aplicado fica na URL.
 */
export function AuditFilterForm({ filters }: { filters: AuditFilters }) {
  const active = Boolean(filters.group || filters.actor || filters.from || filters.to || filters.target);
  return (
    <form action="/admin/audit" className="flex flex-wrap items-end gap-3">
      {/* O tamanho da página e o filtro por alvo (vindo de link) não têm campo, mas não podem se perder. */}
      {filters.size && <input type="hidden" name="size" value={filters.size} />}
      {filters.target && <input type="hidden" name="target" value={filters.target} />}
      <Field label="Tipo de evento">
        <Select name="group" defaultValue={filters.group ?? ""} className="w-56">
          <option value="">Todos os eventos</option>
          {AUDIT_GROUP_LIST.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </Select>
      </Field>
      <Field label="Pessoa">
        <Input name="actor" defaultValue={filters.actor} placeholder="Nome, @usuário ou e-mail" className="w-56" autoComplete="off" />
      </Field>
      <Field label="De"><Input name="from" type="date" defaultValue={filters.from} className="w-40" /></Field>
      <Field label="Até"><Input name="to" type="date" defaultValue={filters.to} className="w-40" /></Field>
      <div className="flex items-center gap-3 pb-1">
        <Button type="submit" tone="quiet">Filtrar</Button>
        {active && <Link href="/admin/audit" className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline">Limpar filtros</Link>}
      </div>
    </form>
  );
}
