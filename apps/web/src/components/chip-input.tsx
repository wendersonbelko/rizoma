"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

type Props = {
  /** Nome do campo enviado no formulário, com os itens unidos por vírgula. */
  name?: string;
  defaultValues?: string[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  max?: number;
  /** Ajuste de cada item antes de guardar (tags em minúsculas, por exemplo). */
  normalize?: (value: string) => string;
  addLabel?: string;
};

/**
 * Lista de vários valores: a pessoa digita um, clica em + (ou Enter) e ele vira um selo.
 * O formulário continua recebendo um único campo, para as actions que já separam por vírgula.
 */
export function ChipInput({ name, defaultValues = [], value, onChange, placeholder, max, normalize, addLabel = "Adicionar" }: Props) {
  const [own, setOwn] = useState(defaultValues);
  const [draft, setDraft] = useState("");
  const items = value ?? own;
  const atMax = max !== undefined && items.length >= max;

  function commit(next: string[]) {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  }

  function add() {
    const pieces = draft.split(/[\s,]+/).map((part) => (normalize ? normalize(part.trim()) : part.trim())).filter(Boolean);
    if (!pieces.length) return;
    const next = [...items];
    for (const piece of pieces) {
      if (max !== undefined && next.length >= max) break;
      if (next.some((item) => item.toLowerCase() === piece.toLowerCase())) continue;
      next.push(piece);
    }
    commit(next);
    setDraft("");
  }

  function remove(item: string) {
    commit(items.filter((current) => current !== item));
  }

  return (
    <div className="space-y-2">
      {name && <input type="hidden" name={name} value={items.join(", ")} />}
      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item} className="inline-flex items-center gap-1 rounded-control border border-line bg-paper px-2 py-1 text-sm">
              <span>{item}</span>
              <button type="button" aria-label={`Remover ${item}`} onClick={() => remove(item)} className="px-1 text-muted hover:text-danger">×</button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          disabled={atMax}
          aria-label={addLabel}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            add();
          }}
        />
        <Button type="button" tone="quiet" disabled={atMax || !draft.trim()} aria-label={addLabel} onClick={add}>+</Button>
      </div>
      {atMax && <p className="text-sm text-muted">Limite de {max}.</p>}
    </div>
  );
}
