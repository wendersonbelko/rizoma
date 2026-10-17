/**
 * Checklist "Rascunho" do serviço (achado M2 e p. 14 da auditoria de UX de 02/10/2026).
 *
 * Criar um serviço pede só nome, time e tipo; o resto (repositório, origem da spec, token) vira
 * uma lista de próximos passos na própria página, porque cada um é opcional, reversível e costuma
 * ser feito por quem tem a informação. Esta função é pura: a página carrega os fatos e ela decide
 * o que está feito, o que falta e para onde cada passo leva.
 */

export type ChecklistStepId = "created" | "repository" | "spec-source" | "token";

export type ChecklistStep = {
  id: ChecklistStepId;
  label: string;
  detail: string;
  done: boolean;
  /** Para onde o botão do passo leva. Ausente quando a pessoa não tem permissão para esse passo. */
  href?: string;
  actionLabel?: string;
};

export type Checklist = {
  steps: ChecklistStep[];
  /** Quantos passos ainda faltam (o "Serviço criado" nunca conta: ele já está feito). */
  pending: number;
  /** "Faltam 3 passos para ele aparecer completo no catálogo e no mapa." */
  summary: string;
};

export type ChecklistFacts = {
  serviceId: string;
  slug: string;
  teamName: string | null;
  visibility: "ORG" | "TEAM";
  specSource: string;
  /** Há repositório com papel Código-fonte ligado ao serviço. */
  hasSourceRepository: boolean;
  /** Já existe alguma spec publicada, em qualquer ambiente. */
  hasSpec: boolean;
  /** Existe token de CI sem revogação e dentro da validade. */
  hasActiveToken: boolean;
  /** Quem olha pode abrir "Vínculos" (link:edit) e "Tokens de CI" (token:manage). */
  canLink: boolean;
  canToken: boolean;
};

const NO_ACCESS = "Peça a quem tem acesso a este cadastro.";

export function buildChecklist(f: ChecklistFacts): Checklist {
  const steps: ChecklistStep[] = [
    {
      id: "created",
      label: "Serviço criado",
      detail: `${f.teamName ? `Time ${f.teamName}` : "Sem time responsável"} · ${f.visibility === "ORG" ? "visível para toda a empresa" : "visível só para o time"}`,
      done: true,
    },
    {
      id: "repository",
      label: "Vincular repositório",
      detail: f.hasSourceRepository ? "O código-fonte já está vinculado." : f.canLink ? "Diz onde está o código deste serviço." : NO_ACCESS,
      done: f.hasSourceRepository,
      // Contrato com a tela de Vínculos: abre o modal "Novo vínculo" com este serviço no "De".
      href: f.canLink ? `/admin/links?from=${encodeURIComponent(f.serviceId)}&fromKind=service#new-link` : undefined,
      actionLabel: "Vincular",
    },
    {
      id: "spec-source",
      label: "Escolher como a spec chega",
      detail: f.hasSpec ? "Já existe uma spec publicada." : "CI · arquivo no repositório · URL · importação manual",
      done: f.hasSpec,
      href: `/services/${f.slug}?tab=config`,
      actionLabel: "Configurar",
    },
  ];

  // Só quem publica pelo CI precisa de token; nos outros jeitos o passo nem aparece (não "falta" nada).
  if (f.specSource === "CI_PUSH") {
    steps.push({
      id: "token",
      label: "Gerar token de CI",
      detail: f.hasActiveToken ? "Há um token ativo para o pipeline." : f.canToken ? "É com ele que o pipeline publica a spec." : NO_ACCESS,
      done: f.hasActiveToken,
      href: f.canToken ? `/admin/tokens?service=${encodeURIComponent(f.serviceId)}#new-token` : undefined,
      actionLabel: "Gerar",
    });
  }

  const pending = steps.filter((s) => !s.done).length;
  const summary =
    pending === 0
      ? "Tudo certo: o serviço aparece completo no catálogo e no mapa."
      : `${pending === 1 ? "Falta 1 passo" : `Faltam ${pending} passos`} para ele aparecer completo no catálogo e no mapa.`;
  return { steps, pending, summary };
}
