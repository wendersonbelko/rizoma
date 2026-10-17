import { countLabel, plural } from "@api-hub/core";

/**
 * Coluna "Vínculos" do catálogo, no formato "1 ↗ · 2 ↙ · 1 externa" (p. 15 da auditoria de UX de
 * 02/10/2026): ↗ são os vínculos de saída (serviços que este usa), ↙ os de entrada (serviços que
 * usam este) e "externa" são as integrações externas. As setas são só desenho; leitor de tela lê
 * "de saída" e "de entrada", e o `title` explica o formato inteiro.
 */
export function ServiceLinksSummary({ outgoing, incoming, resources }: { outgoing: number; incoming: number; resources: number }) {
  const title =
    `${outgoing} ${plural(outgoing, "vínculo de saída", "vínculos de saída")} (serviços que este usa) · ` +
    `${incoming} ${plural(incoming, "vínculo de entrada", "vínculos de entrada")} (serviços que usam este) · ` +
    countLabel(resources, "integração externa", "integrações externas");
  return (
    <span title={title} className="whitespace-nowrap tabular-nums">
      {outgoing} <span aria-hidden>↗</span><span className="sr-only"> de saída</span>
      {" · "}
      {incoming} <span aria-hidden>↙</span><span className="sr-only"> de entrada</span>
      {" · "}
      {resources} {plural(resources, "externa", "externas")}
    </span>
  );
}
