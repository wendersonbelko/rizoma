"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "../actions";

const initial: ActionResult = { ok: false };

/**
 * Envio dos formulários de cadastro. Chama a Server Action direto, dentro de uma transição, em vez de
 * usar `<form action>`: com `action`, o React zera os campos depois de cada envio, e um erro do servidor
 * apagaria o que a pessoa digitou e escolheu (o tipo do serviço, os selects). Assim os campos ficam como estão.
 *
 * - `reject`: mostra erros que o próprio navegador achou, antes de ir ao servidor, no mesmo formato dos do servidor.
 * - `clearError`: tira o erro de um campo quando a pessoa mexe nele.
 */
export function useRegistryForm(run: (previous: ActionResult, form: FormData) => Promise<ActionResult>) {
  const [state, setState] = useState<ActionResult>(initial);
  const [pending, startTransition] = useTransition();

  function submit(form: FormData) {
    startTransition(async () => {
      try {
        setState(await run(initial, form));
      } catch {
        setState({ ok: false, message: "Não foi possível concluir. Tente de novo." });
      }
    });
  }

  function reject(fieldErrors: NonNullable<ActionResult["fieldErrors"]>, message?: string) {
    setState({ ok: false, message, fieldErrors });
  }

  function clearError(field: string) {
    setState((s) => (s.fieldErrors?.[field] ? { ...s, fieldErrors: { ...s.fieldErrors, [field]: undefined } } : s));
  }

  return { state, pending, submit, reject, clearError };
}
