"use client";

import { useContext, useEffect, useId, useRef, createContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

const ModalClose = createContext<(() => void) | null>(null);

/** Fecha o modal depois que o envio deu certo, sem fechar de novo ao reabrir o mesmo formulário. */
export function useCloseOnSuccess(state: { ok: boolean }, pending: boolean) {
  const close = useContext(ModalClose);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && state.ok) close?.();
    wasPending.current = pending;
  }, [pending, state.ok, close]);
}

/**
 * Formulário de criar ou editar fica atrás de um botão. A tela só mostra o que já existe.
 * `forced` abre na hora (edição vinda da URL). `closeHref` volta para a lista ao fechar.
 */
export function FormModal({ title, label, children, wide, tone = "quiet", forced, closeHref, tour, id, onOpen }: {
  title: string;
  label?: string;
  children: ReactNode;
  wide?: boolean;
  tone?: "primary" | "quiet" | "danger";
  forced?: boolean;
  closeHref?: string;
  tour?: string;
  id?: string;
  /** Dispara quando o diálogo abre, para o formulário de dentro recomeçar do que está salvo. */
  onOpen?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const dismiss = () => ref.current?.close();

  useEffect(() => {
    const dialog = ref.current;
    if (forced && dialog && !dialog.open) dialog.showModal();
  }, [forced]);

  useEffect(() => {
    if (!id) return;
    const openFromHash = () => {
      if (window.location.hash === `#${id}`) ref.current?.showModal();
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [id]);

  return (
    <>
      {label && <Button type="button" tone={tone} data-tour={tour} id={id} onClick={() => ref.current?.showModal()}>{label}</Button>}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        className={`hub-modal ${wide ? "hub-modal-wide" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
        onToggle={(e) => { if (e.currentTarget.open) onOpen?.(); }}
        onClose={() => { if (closeHref) router.push(closeHref); }}
      >
        <ModalClose.Provider value={dismiss}>
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
            <button type="button" className="text-sm text-muted hover:text-ink" onClick={dismiss}>Fechar</button>
          </header>
          <div className="px-6 py-5">{children}</div>
        </ModalClose.Provider>
      </dialog>
    </>
  );
}
