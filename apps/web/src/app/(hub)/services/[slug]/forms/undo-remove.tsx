"use client";

import { UndoButton } from "@/components/undo-button";

/**
 * Remover um item recriável (canal, ligação com integração externa, variável) com janela de
 * "Desfazer" em vez de confirmação: é o padrão que o hub já usa para remover vínculos e membros.
 * Quem chama passa a Server Action que lê o campo `id` do FormData.
 *
 * Achado F3 da auditoria de UX de 02/10/2026: o `DangerAction` é um bloco de página (título, texto e
 * botão) e não cabe numa linha de tabela nem num cartão; por isso estas remoções usam o Desfazer.
 * Já a exclusão de uma página de regras (conteúdo escrito à mão, sem volta) usa DangerZone + confirmText.
 */
export function UndoRemove({ action, id, removedLabel, label }: { action: (form: FormData) => Promise<void>; id: string; removedLabel: string; label?: string }) {
  return (
    <UndoButton
      label={label}
      removedLabel={removedLabel}
      onRemove={() => {
        const form = new FormData();
        form.set("id", id);
        return action(form);
      }}
    />
  );
}
