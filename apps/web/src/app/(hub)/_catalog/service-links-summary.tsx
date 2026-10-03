import { countLabel, plural } from "@api-hub/core";

/** Resumo de quantas ligações o serviço tem — só a coluna "Ligações" da listagem sabe disso. */
export function ServiceLinksSummary({ outgoing, incoming, resources }: { outgoing: number; incoming: number; resources: number }) {
  return (
    <>
      <p>{outgoing} {plural(outgoing, "sai", "saem")} · {incoming} {plural(incoming, "chega", "chegam")}</p>
      {resources > 0 && <p className="mt-0.5">{countLabel(resources, "integração externa", "integrações externas")}</p>}
    </>
  );
}
