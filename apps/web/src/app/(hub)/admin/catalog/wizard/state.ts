import { createServiceSchema } from "@api-hub/core/schemas";
import type { Created, Outcome, StepId } from "./types";

/** Estado e transições do wizard — isolados da apresentação para poderem ser testados sozinhos. */
export type WizardState = { step: StepId; created: Created | null; outcomes: Partial<Record<StepId, Outcome>>; errors: Record<string, string>; message?: string };
export type WizardAction =
  | { type: "goto"; step: StepId }
  | { type: "complete"; step: StepId; outcome: Outcome }
  | { type: "created"; service: Created }
  | { type: "errors"; errors: Record<string, string>; message?: string; step?: StepId }
  | { type: "clearError"; field: string };

export const initialWizardState: WizardState = { step: 1, created: null, outcomes: {}, errors: {} };

export function wizardReducer(s: WizardState, a: WizardAction): WizardState {
  switch (a.type) {
    case "goto":
      return { ...s, step: a.step, message: undefined };
    case "complete":
      return { ...s, outcomes: { ...s.outcomes, [a.step]: a.outcome }, step: Math.min(4, a.step + 1) as StepId, errors: {}, message: undefined };
    case "created":
      return { ...s, created: a.service, outcomes: { ...s.outcomes, 1: "done", 2: "done" }, step: 3, errors: {}, message: undefined };
    case "errors": {
      const outcomes = { ...s.outcomes };
      if (a.step === 1) delete outcomes[1]; // voltou por erro do servidor: tira o check
      return { ...s, errors: a.errors, message: a.message, step: a.step ?? s.step, outcomes };
    }
    case "clearError": {
      const { [a.field]: _removed, ...rest } = s.errors;
      return { ...s, errors: rest };
    }
  }
}

// ─── validação client (espelha createServiceSchema) ─────────────────────
const step1Schema = createServiceSchema.pick({ name: true, slug: true, description: true, tags: true });
const splitTags = (v: FormDataEntryValue | null) => String(v ?? "").split(",").map((t) => t.trim()).filter(Boolean);
const PT_FALLBACK: Record<string, string> = {
  description: "Descrição muito longa (máx. 500 caracteres).",
  tags: "Use no máximo 10 tags, cada uma com até 30 caracteres.",
};

export function validateStep1(fd: FormData): Record<string, string> {
  const r = step1Schema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
    description: fd.get("description") || undefined,
    tags: splitTags(fd.get("tags")),
  });
  const errs: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) { const f = String(i.path[0]); if (!errs[f]) errs[f] = PT_FALLBACK[f] ?? i.message; }
  return errs;
}

export function validateStep2(fd: FormData, requireTeam: boolean): Record<string, string> {
  return requireTeam && !fd.get("ownerTeamId") ? { ownerTeamId: "Escolha um dos seus times como responsável." } : {};
}
