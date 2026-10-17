"use client";

import { Fragment, useState, type ComponentProps, type ReactNode } from "react";
import { FormModal } from "@/components/form-modal";

type Props = Omit<ComponentProps<typeof FormModal>, "onOpen" | "children"> & { children: ReactNode };

/**
 * FormModal dos cadastros: cada vez que abre, o formulário de dentro recomeça do zero. Sem isso, depois de
 * criar um serviço (ou de gerar um token) o modal reabriria com o que foi preenchido e a resposta da vez
 * anterior, e o token já mostrado voltaria à tela. O `tour`, o `id` e o resto vão direto para o FormModal.
 */
export function CreateModal({ children, ...modal }: Props) {
  const [opening, setOpening] = useState(0);
  return (
    <FormModal {...modal} onOpen={() => setOpening((n) => n + 1)}>
      <Fragment key={opening}>{children}</Fragment>
    </FormModal>
  );
}
