"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { slugify } from "@api-hub/core/text";
import { Field, Input } from "@/components/ui";

type Props = {
  nameLabel?: string;
  slugLabel?: string;
  /**
   * Texto de ajuda do slug. `{slug}` vira `<code>` com o valor atual.
   * `{/services/{slug}}` inclui o prefixo dentro do mesmo `<code>`.
   * Precisa ser texto: este componente é client e a página que o usa pode ser server.
   */
  slugHint?: string;
  defaultName?: string;
  defaultSlug?: string;
  errors?: { name?: string; slug?: string };
  /** Edição de um recurso que já publicou dados: o slug não pode mudar. */
  slugLocked?: boolean;
  onEdit?: (field: "name" | "slug") => void;
};

/**
 * Campos "Nome" + "Slug" com geração automática (B1 da auditoria de UX): o slug acompanha o
 * nome digitado até a pessoa editá-lo manualmente, e então para de sincronizar.
 */
export function NameSlugFields({
  nameLabel = "Nome",
  slugLabel = "Slug",
  slugHint,
  defaultName = "",
  defaultSlug = "",
  errors,
  slugLocked,
  onEdit,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(defaultSlug || slugify(defaultName));
  const [manual, setManual] = useState(Boolean(defaultSlug));

  return (
    <>
      <Field label={nameLabel} error={errors?.name}>
        <Input
          name="name"
          value={name}
          aria-invalid={!!errors?.name}
          onChange={(e) => {
            setName(e.target.value);
            if (!manual && !slugLocked) setSlug(slugify(e.target.value));
            onEdit?.("name");
          }}
        />
      </Field>
      <Field label={slugLabel} error={errors?.slug} hint={renderSlugHint(slugHint, slug)}>
        <Input
          name="slug"
          value={slug}
          readOnly={slugLocked}
          aria-invalid={!!errors?.slug}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value.toLowerCase();
            setSlug(v);
            setManual(v !== "");
            onEdit?.("slug");
          }}
        />
      </Field>
    </>
  );
}

function renderSlugHint(template: string | undefined, slug: string): ReactNode {
  if (!template) return undefined;
  const value = slug || "slug";
  const re = /\{([^{}]*)\{slug\}([^{}]*)\}|\{slug\}/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(template))) {
    if (match.index > last) nodes.push(template.slice(last, match.index));
    const code = match[1] !== undefined ? `${match[1]}${value}${match[2] ?? ""}` : value;
    nodes.push(<code key={i++} className="font-mono">{code}</code>);
    last = match.index + match[0].length;
  }
  if (last < template.length) nodes.push(template.slice(last));
  return <>{nodes}</>;
}
