import { SPEC_SOURCE_LABEL } from "@api-hub/core";
import { LinkButton, Notice } from "@/components/ui";

// "Esta versão não veio {do CI | do repositório | …}": a frase se ajusta à origem que o serviço configurou.
const FROM: Record<string, string> = {
  CI_PUSH: "do CI",
  REPO_FILE: "do repositório",
  URL_PULL: "da URL configurada",
  MANUAL_UPLOAD: "da importação manual",
};

/**
 * Aviso de que a versão atual chegou por um caminho diferente do configurado (achado D3 da auditoria
 * de UX de 02/10/2026: duas origens e uma conjunção na mesma frase). A frase curta fica à vista; o
 * detalhe ("Importação manual × Enviada pelo CI") vai no tooltip e, para leitor de tela, como texto oculto.
 */
export function SpecOriginNotice({ envName, actualSource, configuredSource, href }: { envName: string; actualSource: string; configuredSource: string; href: string }) {
  const detail = `A versão atual em ${envName} veio de ${SPEC_SOURCE_LABEL[actualSource] ?? actualSource}, mas a origem configurada é ${SPEC_SOURCE_LABEL[configuredSource] ?? configuredSource}.`;
  return (
    <Notice tone="wait">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p title={detail} className="text-ink">
          Esta versão não veio {FROM[configuredSource] ?? "da origem configurada"}.
          <span className="sr-only"> {detail}</span>
        </p>
        <LinkButton href={href} tone="quiet">Ver origem</LinkButton>
      </div>
    </Notice>
  );
}
