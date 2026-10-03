"use client";

import { cancelRecovery } from "./actions";
import { Form } from "./form-primitives";

export function CancelRecoveryForm() {
  return <Form action={async () => cancelRecovery()} submit="Cancelar janela de recuperação" tone="danger" />;
}
