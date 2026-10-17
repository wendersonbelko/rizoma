import type { ReactNode } from "react";
import type { Result } from "../actions";

export const initialResult: Result = { ok: false };

/** Mensagem de sucesso/erro de uma server action — repetida em todo formulário desta pasta. */
export function Feedback({ state }: { state: Result }) {
  if (!state.message) return null;
  return <p role="status" className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`}>{state.message}</p>;
}

/** O mesmo recado, para o campo `message` de <ModalActions> (sem `undefined` vira rodapé sem texto). */
export function feedbackMessage(state: Result): ReactNode {
  if (!state.message) return undefined;
  return <span className={state.ok ? "text-accent" : "text-danger"}>{state.message}</span>;
}
