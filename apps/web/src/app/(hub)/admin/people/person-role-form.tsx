"use client";

import { startTransition, useActionState, useState } from "react";
import { ROLE_LABEL, type Role } from "@api-hub/core/types";
import { Button, Select } from "@/components/ui";
import { changeRole } from "./actions";

/**
 * Seção "Papel" da pessoa (achado F4 da auditoria de UX de 02/10/2026): o seletor e o botão
 * "Salvar papel", sozinhos. O botão só habilita quando o papel escolhido é outro; a resposta (ou o motivo
 * de recusa) aparece aqui, sem tela de erro. `options` já vem filtrado pelo que quem edita pode conceder.
 */
export function PersonRoleForm({ userId, current, options }: { userId: string; current: Role; options: Role[] }) {
  const [state, dispatch, pending] = useActionState(changeRole, { ok: false });
  const [chosen, setChosen] = useState<Role>(current);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
      className="space-y-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Papel</span>
          <Select name="role" value={chosen} onChange={(e) => setChosen(e.target.value as Role)} className="w-56">
            {options.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
        </label>
        <Button type="submit" tone="quiet" disabled={pending || chosen === current}>{pending ? "Salvando…" : "Salvar papel"}</Button>
      </div>
      {state.message && <p role="status" className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}
