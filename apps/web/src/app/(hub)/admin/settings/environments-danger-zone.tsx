"use client";

import { useState } from "react";
import { DangerAction, DangerZone } from "@/components/danger-zone";
import { endAllSessions, removeEnvironment } from "./actions";
import { Msg } from "./form-primitives";
import type { SettingsResult } from "./actions";

/**
 * Ações irreversíveis da aba Ambientes e sessões, no padrão único do hub (achado F3 da auditoria de UX de
 * 02/10/2026): contorno vermelho, confirmação com frase digitada. Encerrar sessões pede "ENCERRAR"; remover um
 * ambiente pede o nome dele. As duas Server Actions conferem a frase no servidor.
 */
export function EnvironmentsDangerZone({ envs }: { envs: { slug: string; name: string }[] }) {
  const [notice, setNotice] = useState<SettingsResult | null>(null);
  // O modal fecha quando dá certo e o ambiente removido some da lista; o resultado fica aqui, que continua na tela.
  const remember = (result: SettingsResult) => {
    if (result.ok) setNotice(result);
    return result;
  };
  return (
    <DangerZone>
      <DangerAction
        title="Encerrar todas as sessões"
        description="Use depois de um incidente ou de trocar credenciais. Todo mundo, menos você, precisa entrar de novo."
        actionLabel="Encerrar todas as sessões"
        confirmText="ENCERRAR"
        action={async (form) => remember(await endAllSessions(form))}
      />
      {envs.length > 1 && envs.map((env) => (
        <DangerAction
          key={env.slug}
          title={`Remover o ambiente ${env.name}`}
          description="Só dá para remover um ambiente que não tem specs nem variáveis; se tiver, renomeie em vez de remover. Não dá para desfazer."
          actionLabel="Remover ambiente"
          confirmText={env.name}
          fields={{ slug: env.slug }}
          action={async (form) => remember(await removeEnvironment(form))}
        />
      ))}
      <Msg state={notice} />
    </DangerZone>
  );
}
