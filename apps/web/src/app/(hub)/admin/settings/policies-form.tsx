"use client";

import { PolicyFields } from "@/components/config-editors";
import { savePolicies } from "./actions";
import { SettingsForm } from "./form-primitives";

export function PoliciesForm(p: { auto: boolean; outsider: string; session: number; recheck: number; ttl: number }) {
  return (
    <SettingsForm action={savePolicies} saveLabel="Salvar regras">
      <PolicyFields defaults={p} />
    </SettingsForm>
  );
}
