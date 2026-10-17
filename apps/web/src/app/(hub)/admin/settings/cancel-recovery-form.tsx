"use client";

import { DangerAction } from "@/components/danger-zone";
import { cancelRecovery } from "./actions";

/** Cancelar a janela de recuperação de Proprietário, no mesmo padrão das outras ações destrutivas (achado F3). */
export function CancelRecoveryForm() {
  return (
    <DangerAction
      title="Cancelar a janela de recuperação"
      description="O primeiro login desse identificador deixa de virar Proprietário. Se precisar, abra outra janela pelo servidor."
      actionLabel="Cancelar janela"
      action={async () => cancelRecovery()}
    />
  );
}
