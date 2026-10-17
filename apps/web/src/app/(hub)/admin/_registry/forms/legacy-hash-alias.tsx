"use client";

import { useEffect } from "react";

/**
 * Link antigo com `#from` abre o modal de `#to`. O modal de token se chamava `#tokens` antes de o
 * contrato passar a `#new-token` (todo cadastro abre por `#new-<coisa>`); favoritos e links de fora
 * continuam funcionando. Troca o fragmento e avisa o FormModal, que escuta o hashchange.
 */
export function LegacyHashAlias({ from, to }: { from: string; to: string }) {
  useEffect(() => {
    const alias = () => {
      if (window.location.hash !== `#${from}`) return;
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${to}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    };
    alias();
    window.addEventListener("hashchange", alias);
    return () => window.removeEventListener("hashchange", alias);
  }, [from, to]);
  return null;
}
