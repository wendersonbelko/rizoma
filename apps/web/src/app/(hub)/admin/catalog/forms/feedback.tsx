import type { ActionResult } from "../actions";

export type Opt = { id: string; label: string };
export const initialResult: ActionResult = { ok: false };

/** Mensagem de sucesso/erro de uma server action — repetida em todo formulário desta pasta. */
export function Feedback({ state }: { state: ActionResult }) {
  if (!state.message) return null;
  return <p className={`text-sm ${state.ok ? "text-accent" : "text-danger"}`} role="status">{state.message}</p>;
}
