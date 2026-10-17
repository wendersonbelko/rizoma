"use client";

import { useState, useTransition } from "react";
import { ROLE_LABEL } from "@api-hub/core/types";
import { plural } from "@api-hub/core/text";
import { Button } from "@/components/ui";
import { FormModal, ModalActions, useModal } from "@/components/form-modal";
import { countChanges, permissionLabel, type RoleChange } from "./diff";
import type { PermResult } from "./actions";

/**
 * Barra fixa no rodapé enquanto a matriz tem mudança não salva (achado F2 da auditoria de UX de
 * 02/10/2026): o contador, "Descartar" e "Revisar e salvar", que abre o diff por papel antes de gravar.
 * `mr-14` deixa de fora o botão "?" de ajuda, fixo no canto inferior direito da tela.
 */
export function ChangeBar({ changes, onDiscard, onSave, onSaved }: {
  changes: RoleChange[];
  onDiscard: () => void;
  /** Grava a matriz. Quem chama atualiza o estado só se der certo (onSaved), depois de o modal fechar. */
  onSave: () => Promise<PermResult>;
  onSaved: (result: PermResult) => void;
}) {
  const total = countChanges(changes);
  const noun = `${total} ${plural(total, "mudança", "mudanças")}`;
  return (
    <div
      className="sticky bottom-4 z-20 mr-14 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-panel border border-line-strong bg-raised px-4 py-3 shadow-[0_8px_24px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_18%,transparent)]"
    >
      <p role="status" className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden="true" className="size-2 rounded-full bg-wait" />
        {noun} não {plural(total, "salva", "salvas")}
      </p>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" tone="quiet" onClick={onDiscard}>Descartar</Button>
        <FormModal label="Revisar e salvar" tone="primary" title="Revisar mudanças" description="Confira quem ganha e quem perde cada permissão antes de salvar." size="md">
          <ReviewChanges changes={changes} onSave={onSave} onSaved={onSaved} />
        </FormModal>
      </div>
    </div>
  );
}

/** Corpo do modal. Fica à parte porque precisa estar DENTRO do FormModal para poder fechá-lo (useModal). */
function ReviewChanges({ changes, onSave, onSaved }: { changes: RoleChange[]; onSave: () => Promise<PermResult>; onSaved: (result: PermResult) => void }) {
  const modal = useModal();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const total = countChanges(changes);

  return (
    <div className="space-y-5">
      {changes.map((c) => (
        <section key={c.role} className="space-y-2">
          <h3 className="text-sm font-semibold">{ROLE_LABEL[c.role]}</h3>
          {c.gained.length > 0 && <ChangeList verb={`${ROLE_LABEL[c.role]} ganha:`} ids={c.gained} tone="gain" />}
          {c.lost.length > 0 && <ChangeList verb={`${ROLE_LABEL[c.role]} perde:`} ids={c.lost} tone="loss" />}
        </section>
      ))}
      <ModalActions message={error ? <span className="text-danger">{error}</span> : undefined}>
        <Button
          type="button"
          disabled={pending}
          onClick={() => start(async () => {
            setError(undefined);
            const result = await onSave();
            if (!result.ok) return setError(result.message ?? "Não foi possível salvar. Tente de novo.");
            // Fecha antes de avisar a tela: salvar zera as mudanças e a barra (com este modal) deixa de existir.
            modal?.close();
            onSaved(result);
          })}
        >
          {pending ? "Salvando…" : `Salvar ${total} ${plural(total, "mudança", "mudanças")}`}
        </Button>
      </ModalActions>
    </div>
  );
}

function ChangeList({ verb, ids, tone }: { verb: string; ids: string[]; tone: "gain" | "loss" }) {
  return (
    <div className="text-sm">
      <p className={`font-medium ${tone === "gain" ? "text-accent" : "text-danger"}`}>{verb}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
        {ids.map((id) => <li key={id}>{permissionLabel(id)}</li>)}
      </ul>
    </div>
  );
}
