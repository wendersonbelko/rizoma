"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui";

/**
 * Retrato do que o formulário vai enviar: nome e valor de cada campo, na ordem da tela. Arquivos
 * contam por nome, tamanho e data. Comparar dois retratos diz se algo mudou, seja campo comum,
 * seja o oculto que um seletor de selos preenche.
 */
export function formSignature(form: HTMLFormElement): string {
  const parts: string[] = [];
  for (const [name, value] of new FormData(form)) {
    parts.push(`${name}=${typeof value === "string" ? value : `${value.name}:${value.size}:${value.lastModified}`}`);
  }
  return parts.join("\u0001");
}

const LEAVE_MESSAGE = "Você tem alterações não salvas. Se sair desta página, elas se perdem. Sair mesmo assim?";

/**
 * Aviso ao sair com edição pendente: fechar/recarregar a aba (beforeunload) e clicar num link interno,
 * que o Next resolve sem recarregar a página e por isso não dispara o beforeunload. Serve a qualquer
 * tela com estado "sujo" que não seja um <form> (ex.: a matriz de permissões).
 */
export function useLeaveWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onLinkClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const to = new URL(link.href, window.location.href);
      if (to.origin !== window.location.origin) return;
      if (to.pathname === window.location.pathname && to.search === window.location.search) return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    // Captura: roda antes do onClick do <Link> do Next, que é quem navegaria.
    document.addEventListener("click", onLinkClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onLinkClick, true);
    };
  }, [dirty]);
}

/**
 * Formulário que só mostra o botão de salvar quando há o que salvar (achado F1 da auditoria de UX de
 * 02/10/2026: vários "Salvar" na mesma página, e quem edita dois cartões e clica no primeiro perde o outro).
 * Em vez de um botão por cartão, o <form> inteiro compara o estado atual com o inicial. Quando
 * muda, uma barra grudada no fim da tela (dentro do próprio formulário) oferece **Descartar** e **Salvar**;
 * sem mudança ela some. Com edição pendente, avisa antes de sair (fechar a aba, recarregar ou clicar num link da própria app).
 *
 * - `action`: Server Action, ou o `dispatch` de `useActionState`. Recebe o FormData do formulário. O envio é
 *   feito aqui (onSubmit + transição), e não pelo `action` do <form>, porque o React zera os campos não
 *   controlados quando um `action` do <form> termina, e a pessoa perderia o que digitou se o servidor devolvesse um erro.
 * - Quando o envio termina sem `error`, o estado salvo vira o novo inicial e a barra some. Com `error`
 *   (ex.: `state.ok ? undefined : state.message`), o formulário continua "sujo" e a mensagem aparece na barra.
 * - `pending` é opcional: o estado do envio já é medido aqui; use só se algo fora do formulário também puder estar salvando.
 * - Descartar remonta os filhos: campos controlados e estados internos também voltam ao inicial.
 */
export function DirtyForm({ action, children, saveLabel = "Salvar", pending, error, className }: {
  action: string | ((formData: FormData) => unknown);
  children: ReactNode;
  saveLabel?: string;
  pending?: boolean;
  error?: string;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const baseline = useRef<string | null>(null);
  const timer = useRef(0);
  const errorRef = useRef(error);
  errorRef.current = error;
  const [dirty, setDirty] = useState(false);
  const [session, setSession] = useState(0);
  const [sending, startSending] = useTransition();
  const busy = sending || Boolean(pending);

  const measure = useCallback(() => {
    const form = formRef.current;
    if (!form || baseline.current === null) return;
    setDirty(formSignature(form) !== baseline.current);
  }, []);

  // Várias mudanças seguidas (digitar, o React atualizando um campo controlado) viram uma só medição.
  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(measure, 0);
  }, [measure]);

  const rebase = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const form = formRef.current;
      if (!form) return;
      baseline.current = formSignature(form);
      setDirty(false);
    }, 0);
  }, []);

  // O estado inicial é o que está na tela depois que os filhos montaram (e de novo depois de cada Descartar).
  useEffect(() => {
    rebase();
    return () => window.clearTimeout(timer.current);
  }, [session, rebase]);

  // Campos que o React troca sem evento do usuário (selos adicionados, listas dinâmicas).
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const observer = new MutationObserver(schedule);
    observer.observe(form, { childList: true, subtree: true, attributes: true, attributeFilter: ["value", "checked", "selected"] });
    return () => observer.disconnect();
  }, [schedule]);

  const settled = useCallback(() => {
    // Salvou: o que está na tela passa a ser o estado salvo. Se deu erro, continua pendente.
    if (!errorRef.current) rebase();
    else schedule();
  }, [rebase, schedule]);

  const wasBusy = useRef(false);
  useEffect(() => {
    if (wasBusy.current && !busy) settled();
    wasBusy.current = busy;
  }, [busy, settled]);

  useLeaveWarning(dirty);

  function discard() {
    setSession((n) => n + 1);
    setDirty(false);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    if (typeof action === "string") return;
    e.preventDefault();
    const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startSending(async () => {
      await action(data);
    });
  }

  return (
    <form
      ref={formRef}
      action={typeof action === "string" ? action : undefined}
      onSubmit={submit}
      className={className}
      onInput={schedule}
      onChange={schedule}
      onKeyUp={schedule}
      onClick={schedule}
    >
      <Fragment key={session}>{children}</Fragment>
      {dirty && (
        // mr-14: deixa de fora o botão "?" de ajuda, que fica fixo no canto inferior direito da tela.
        <div className="sticky bottom-4 z-20 mr-14 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-panel border border-line-strong bg-raised px-4 py-3 shadow-[0_8px_24px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_18%,transparent)]">
          <p role="status" className="flex items-center gap-2 text-sm font-medium">
            <span aria-hidden="true" className="size-2 rounded-full bg-wait" />
            Alterações não salvas
          </p>
          {error && <p role="alert" className="min-w-0 text-sm text-danger">{error}</p>}
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" tone="quiet" disabled={busy} onClick={discard}>Descartar</Button>
            <Button type="submit" disabled={busy}>{busy ? "Salvando…" : saveLabel}</Button>
          </div>
        </div>
      )}
    </form>
  );
}
