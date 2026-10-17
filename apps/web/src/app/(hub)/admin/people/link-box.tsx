"use client";

import { useEffect, useState } from "react";
import { rowActionClass } from "@/components/table";

/**
 * Link de convite ou de nova senha, com o aviso de validade e o botão de copiar. Fica à vista
 * depois de gerado: o link não aparece de novo, então o modal que o mostra continua aberto.
 */
export function LinkBox({ message, url, ok }: { message?: string; url?: string; ok: boolean }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);
  if (!message) return null;
  return (
    <div className={`space-y-2 text-sm ${ok ? "" : "text-danger"}`} role="status">
      <p>{message}</p>
      {url && (
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-control border border-line-strong bg-field px-2 py-1 font-mono text-[12px]">{url}</code>
          <button
            type="button"
            className={rowActionClass()}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              } catch {
                // Sem permissão de área de transferência: a pessoa ainda pode selecionar o link e copiar.
              }
            }}
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
