"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { slugify } from "@api-hub/core/text";
import { Field, Input } from "@/components/ui";

type Props = {
  nameLabel?: string;
  /** Rótulo do campo que aparece ao clicar em "editar endereço". */
  slugLabel?: string;
  /** Exemplo dentro do campo do nome ("Ex.: Pagamentos API"). */
  namePlaceholder?: string;
  /** Marca o nome como obrigatório: acrescenta " *" ao rótulo e o `required` ao campo. */
  nameRequired?: boolean;
  /**
   * Começo do endereço final ("/services/"). Aparece colado ao slug no texto pequeno abaixo do
   * nome: `/services/entregas-api · editar endereço`. Precisa ser texto: este componente é client
   * e a página que o usa pode ser server.
   */
  slugPrefix?: string;
  /**
   * Texto de ajuda do slug, para quem ainda usa (prefira `slugPrefix`). `{slug}` vira `<code>` com o
   * valor atual. `{/services/{slug}}` inclui o prefixo dentro do mesmo `<code>`. Sem `slugPrefix`,
   * este texto ocupa o lugar do endereço abaixo do nome e também acompanha o campo quando ele abre.
   */
  slugHint?: string;
  defaultName?: string;
  defaultSlug?: string;
  errors?: { name?: string; slug?: string };
  /** Edição de um recurso que já publicou dados: o slug não pode mudar. Mostra só o texto. */
  slugLocked?: boolean;
  onEdit?: (field: "name" | "slug") => void;
};

/**
 * Campos "Nome" + endereço com geração automática (achados B1 e M4 da auditoria de UX): o slug é dado
 * de sistema, não de negócio, então não vira campo. Abaixo do nome aparece só um texto pequeno
 * (`/services/entregas-api · editar endereço`) e o campo "Endereço" abre se a pessoa quiser mexer.
 * O slug acompanha o nome digitado até ser editado à mão e então para de sincronizar.
 * O campo `slug` é enviado sempre (oculto enquanto fechado). Erro de slug abre o campo sozinho.
 */
export function NameSlugFields({
  nameLabel = "Nome",
  slugLabel = "Endereço",
  namePlaceholder,
  nameRequired,
  slugPrefix,
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
  const [editing, setEditing] = useState(false);
  // Com erro no slug o campo fica à vista até a mensagem sumir, mesmo que a pessoa nunca tenha clicado em editar.
  const showField = !slugLocked && (editing || Boolean(errors?.slug));
  const fullAddress = `${slugPrefix ?? ""}${slug || "…"}`;

  return (
    <div className="col-span-full space-y-2">
      <Field label={nameRequired ? `${nameLabel} *` : nameLabel} error={errors?.name}>
        <Input
          name="name"
          value={name}
          placeholder={namePlaceholder}
          required={nameRequired}
          aria-invalid={!!errors?.name}
          onChange={(e) => {
            setName(e.target.value);
            if (!manual && !slugLocked) setSlug(slugify(e.target.value));
            onEdit?.("name");
          }}
        />
      </Field>

      {showField ? (
        <Field
          label={slugLabel}
          error={errors?.slug}
          hint={renderSlugHint(slugHint, slug) ?? (slugPrefix ? <>Endereço final: <code className="font-mono">{fullAddress}</code></> : undefined)}
        >
          <Input
            name="slug"
            value={slug}
            autoFocus={editing}
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
      ) : (
        <>
          <input type="hidden" name="slug" value={slug} />
          <p className="text-sm text-muted">
            {slugPrefix || !slugHint ? <code className="break-all font-mono">{fullAddress}</code> : renderSlugHint(slugHint, slug)}
            {!slugLocked && (
              <>
                {" · "}
                <button type="button" onClick={() => setEditing(true)} className="text-accent underline-offset-2 hover:underline">editar endereço</button>
              </>
            )}
          </p>
        </>
      )}
    </div>
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
