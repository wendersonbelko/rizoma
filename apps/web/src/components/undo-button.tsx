"use client";

import { useRef, useState } from "react";
import { rowActionClass } from "@/components/table";

/**
 * Confirmação leve para ações destrutivas de um clique só (achado da revisão de UX de
 * 28/09/2026: "Remover um vínculo ou um membro de time acontece com um único clique, sem
 * confirmação nem desfazer"). Em vez de um confirm() bloqueante, adia a chamada de verdade por
 * alguns segundos e mostra "Desfazer" nesse meio-tempo — se a pessoa não cancelar, a ação
 * acontece sozinha ao final da janela, mesmo que ela já tenha saído da tela.
 * Visualmente é uma ação de linha de tabela (mesmo estilo de RowActionButton).
 */
export function UndoButton({ onRemove, label = "Remover", removedLabel = "Removido", undoWindowMs = 5000 }: {
  onRemove: () => void | Promise<void>;
  label?: string;
  removedLabel?: string;
  undoWindowMs?: number;
}) {
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function start() {
    setPending(true);
    timer.current = setTimeout(() => {
      void onRemove();
    }, undoWindowMs);
  }
  function cancel() {
    clearTimeout(timer.current);
    setPending(false);
  }

  if (pending) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted">
        {removedLabel}
        <button type="button" className={rowActionClass()} onClick={cancel}>Desfazer</button>
      </span>
    );
  }
  return <button type="button" className={rowActionClass("danger")} onClick={start}>{label}</button>;
}
