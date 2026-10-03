import { LIFECYCLE_LABEL } from "@api-hub/core/schemas";
import { Badge } from "@/components/ui";

/**
 * Selo de situação do serviço. Só aparece fora de "produção" — produção é o padrão silencioso,
 * o resto é que precisa chamar atenção. A regra de cor mora aqui; o formato vem do Badge.
 */
export function LifecycleBadge({ lifecycle }: { lifecycle: string }) {
  if (lifecycle === "production") return null;
  return <Badge tone={lifecycle === "deprecated" ? "danger" : "wait"}>{LIFECYCLE_LABEL[lifecycle] ?? lifecycle}</Badge>;
}
