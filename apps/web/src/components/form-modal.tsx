"use client";

import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
  type ReactNode, type SyntheticEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import "./form-modal.css";

export type FormModalSize = "sm" | "md" | "lg";
// 480 / 640 / 800 px (achado M1 da auditoria de UX de 02/10/2026); as larguras ficam em form-modal.css.
const SIZE_CLASS: Record<FormModalSize, string> = { sm: "", md: " hub-modal-md", lg: " hub-modal-lg" };

type ModalApi = {
  /** Fecha na hora, sem perguntar. É o que `useCloseOnSuccess` chama depois de salvar. */
  close: () => void;
  /** Fecha como a pessoa pediu (×, Cancelar, Esc, clique fora): se ela digitou algo, pergunta antes. */
  requestClose: () => void;
  /** Esquece o que foi digitado. Para o modal que continua aberto depois de enviar (token revelado). */
  markClean: () => void;
};

const ModalContext = createContext<ModalApi | null>(null);

/** Controles do FormModal em que o componente está, ou `null` fora de um modal. */
export function useModal(): ModalApi | null {
  return useContext(ModalContext);
}

/**
 * Fecha o modal depois que o envio deu certo, sem fechar de novo ao reabrir o mesmo formulário.
 * Precisa ser chamado num componente que está DENTRO do FormModal (o formulário), não no que o renderiza:
 * o contexto do modal só existe para os filhos.
 */
export function useCloseOnSuccess(state: { ok: boolean; keepOpen?: boolean }, pending: boolean) {
  const modal = useModal();
  const wasPending = useRef(false);
  // `keepOpen`: deu certo, mas nada mudou na tela por trás (ex.: "Nada para copiar"). Fechar na hora
  // esconderia o aviso e a pessoa ficaria sem saber o que aconteceu; o aviso fica no rodapé.
  const close = state.ok && !state.keepOpen;
  useEffect(() => {
    if (wasPending.current && !pending && close) modal?.close();
    wasPending.current = pending;
  }, [pending, close, modal]);
}

const FIELD = 'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly])';
const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
const isVisible = (el: HTMLElement) => (typeof el.checkVisibility === "function" ? el.checkVisibility() : el.offsetParent !== null);

/** Achado M5: o foco inicial vai para o primeiro campo editável, não para o × do cabeçalho. */
function focusInitial(dialog: HTMLDialogElement) {
  const body = dialog.querySelector<HTMLElement>(".hub-modal-body");
  if (!body) return;
  // Um autofocus do próprio formulário já decidiu: não atropelar.
  if (document.activeElement && body.contains(document.activeElement)) return;
  const target =
    [...body.querySelectorAll<HTMLElement>(FIELD)].find(isVisible) ??
    [...body.querySelectorAll<HTMLElement>(FOCUSABLE)].find(isVisible);
  (target ?? dialog).focus();
}

/**
 * Modal-padrão do hub (achados M1 e M5): cabeçalho com título e ×, corpo com rolagem própria e rodapé
 * fixo (<ModalActions>). Formulário de criar ou editar fica atrás de um botão; a tela só mostra o que já existe.
 *
 * - `size`: "sm" (480 px, padrão), "md" (640) ou "lg" (800). `wide` é o nome antigo de "md".
 * - `forced` abre na hora (edição vinda da URL). `closeHref` volta para a lista ao fechar.
 * - `id` abre o modal pelo endereço `#id` (⌘K e "+ Novo"); o hash é limpo ao fechar para poder abrir de novo.
 * - Esc, clique fora, × e Cancelar pedem confirmação se a pessoa digitou algo desde que o modal abriu.
 *   Um campo com `data-dirty-ignore` (ex.: a frase de confirmação de uma ação destrutiva) não conta como digitação.
 * - Foco: abre no primeiro campo editável e, ao fechar, volta para o botão que abriu.
 */
export function FormModal({ title, description, label, children, size, wide, tone = "quiet", forced, closeHref, tour, id, onOpen }: {
  title: string;
  /** Uma frase de apoio logo abaixo do título. */
  description?: string;
  label?: string;
  children: ReactNode;
  size?: FormModalSize;
  /** Nome antigo de `size="md"`. */
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
  const descriptionId = useId();
  const confirmId = useId();
  const router = useRouter();
  const opener = useRef<HTMLElement | null>(null);
  const dirty = useRef(false);
  const pressedOnBackdrop = useRef(false);
  const confirmReturn = useRef<HTMLElement | null>(null);
  // Fechar é tratado uma vez só, venha do close() daqui ou do evento "close" do navegador (um <form method="dialog">, por exemplo).
  const finished = useRef(true);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const [confirming, setConfirming] = useState(false);
  const [session, setSession] = useState(0);
  const [opened, setOpened] = useState(0);
  const resolvedSize = size ?? (wide ? "md" : "sm");

  const show = useCallback((from?: HTMLElement) => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    // O botão do `label` é passado direto: o Safari não foca botão ao clicar, e o foco precisa voltar para ele.
    opener.current = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    dirty.current = false;
    finished.current = false;
    dialog.showModal();
    setOpened((n) => n + 1);
    onOpenRef.current?.();
  }, []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    dirty.current = false;
    setConfirming(false);
    // Sem limpar o #id, abrir de novo pelo mesmo endereço não dispara hashchange.
    if (id && window.location.hash === `#${id}`) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    // O navegador já devolve o foco a quem abriu; isto cobre o caso de ele ter ido para o <body>.
    const from = opener.current;
    opener.current = null;
    if (from?.isConnected && (!document.activeElement || document.activeElement === document.body)) from.focus();
    if (closeHref) router.push(closeHref);
  }, [id, closeHref, router]);

  const close = useCallback(() => {
    const dialog = ref.current;
    if (!dialog?.open) return;
    dialog.close();
    finish();
  }, [finish]);

  const requestClose = useCallback(() => {
    if (!dirty.current) return close();
    confirmReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfirming(true);
  }, [close]);

  const markClean = useCallback(() => { dirty.current = false; }, []);
  const api = useMemo<ModalApi>(() => ({ close, requestClose, markClean }), [close, requestClose, markClean]);

  function keepEditing() {
    setConfirming(false);
    // O conteúdo de trás fica inerte enquanto a pergunta está na tela; só depois de reabrir ele aceita foco.
    window.setTimeout(() => confirmReturn.current?.focus(), 0);
  }

  function discard() {
    dirty.current = false;
    setConfirming(false);
    // Remonta o corpo: campos controlados e passos de wizard também voltam ao que está salvo.
    setSession((n) => n + 1);
    close();
  }

  useEffect(() => {
    if (forced) show();
  }, [forced, show]);

  useEffect(() => {
    if (!id) return;
    const openFromHash = () => {
      if (window.location.hash === `#${id}`) show();
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [id, show]);

  useEffect(() => {
    if (opened === 0) return;
    const dialog = ref.current;
    if (dialog?.open) focusInitial(dialog);
  }, [opened]);

  function markDirty(e: SyntheticEvent) {
    if (e.target instanceof Element && e.target.closest("[data-dirty-ignore]")) return;
    dirty.current = true;
  }

  return (
    <>
      {label && <Button type="button" tone={tone} data-tour={tour} id={id} onClick={(e) => show(e.currentTarget)}>{label}</Button>}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`hub-modal${SIZE_CLASS[resolvedSize]}`}
        // Só fecha se o clique também começou no fundo: selecionar texto num campo e soltar fora não pode fechar.
        onPointerDown={(e) => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
        onClick={(e) => {
          const fromBackdrop = e.target === e.currentTarget && pressedOnBackdrop.current;
          pressedOnBackdrop.current = false;
          if (fromBackdrop) requestClose();
        }}
        onKeyDown={(e) => {
          if (e.key !== "Escape" || e.nativeEvent.isComposing) return;
          // Impede o fechamento nativo para poder perguntar antes.
          e.preventDefault();
          if (confirming) keepEditing();
          else requestClose();
        }}
        onCancel={(e) => { e.preventDefault(); requestClose(); }}
        onClose={finish}
        onInput={markDirty}
        onChange={markDirty}
        // Depois de enviar, o que foi digitado deixa de ser "não salvo" (o modal pode continuar aberto, como o do token).
        onSubmit={markClean}
      >
        <ModalContext.Provider value={api}>
          <header className="hub-modal-header" inert={confirming}>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
              {description && <p id={descriptionId} className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              aria-label="Fechar"
              onClick={requestClose}
              className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-control text-muted transition hover:bg-paper hover:text-ink"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
              </svg>
            </button>
          </header>
          <div key={session} className="hub-modal-body" inert={confirming}>{children}</div>
          {confirming && (
            <div className="hub-modal-confirm" role="alertdialog" aria-modal="true" aria-labelledby={confirmId}>
              <div className="hub-modal-confirm-card">
                <p id={confirmId} className="font-semibold">Descartar o que você digitou?</p>
                <p className="mt-1 text-sm text-muted">Se você sair agora, o que foi preenchido neste formulário se perde.</p>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button type="button" tone="quiet" autoFocus onClick={keepEditing}>Continuar editando</Button>
                  <Button type="button" tone="danger" onClick={discard}>Descartar</Button>
                </div>
              </div>
            </div>
          )}
        </ModalContext.Provider>
      </dialog>
    </>
  );
}

/**
 * Rodapé do formulário. Vai como último filho do <form>.
 *
 * Dentro de um FormModal vira o rodapé fixo: Cancelar (secundário) à esquerda do(s) botão(ões)
 * principal(is) passados em `children`, que ficam sempre à direita. O botão diz verbo + objeto
 * ("Criar time", "Gerar token"). Fora de um modal é só uma linha alinhada à direita, sem Cancelar.
 *
 * `message` é um recado à esquerda do rodapé (erro ou sucesso do envio). `cancelLabel` troca "Cancelar"
 * (ex.: "Fechar" no modal que mostra um token e continua aberto).
 */
export function ModalActions({ children, message, cancelLabel = "Cancelar" }: { children: ReactNode; message?: ReactNode; cancelLabel?: string }) {
  const modal = useModal();
  if (!modal) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-3">
        {message && <div className="mr-auto min-w-0 text-sm" role="status">{message}</div>}
        {children}
      </div>
    );
  }
  return (
    <div className="hub-modal-actions">
      {message && <div className="hub-modal-actions-message" role="status">{message}</div>}
      <Button type="button" tone="quiet" onClick={modal.requestClose}>{cancelLabel}</Button>
      {children}
    </div>
  );
}
