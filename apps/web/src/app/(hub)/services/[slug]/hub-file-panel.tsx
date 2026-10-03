"use client";

import { useState } from "react";

/** O hub.json gerado a partir do estado atual, para copiar quando o token não escreve. */
export function HubFilePanel({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-control border border-line bg-field">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="font-mono text-xs text-muted">hub.json</span>
        <button
          type="button"
          className="text-sm font-semibold text-accent hover:underline"
          onClick={() => { void navigator.clipboard.writeText(text).then(() => setCopied(true)); }}
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <textarea readOnly value={text} rows={16} spellCheck={false} className="w-full resize-y bg-transparent p-3 font-mono text-[12px] leading-relaxed text-ink outline-none" />
    </div>
  );
}
