type Env = { id: string; isProduction?: boolean };
type Spec = { environmentId: string };

/**
 * Saúde do serviço no catálogo (achados D2 e p. 15 da auditoria de UX de 02/10/2026): verde quando
 * há spec atual no ambiente de produção, âmbar quando não há. Sem nenhum ambiente marcado como
 * produção na instalação, vale a spec atual de qualquer ambiente — senão todo ponto ficaria âmbar.
 */
export function isServiceHealthy(specs: Spec[], envs: Env[]): boolean {
  const production = envs.filter((e) => e.isProduction).map((e) => e.id);
  return production.length > 0 ? specs.some((s) => production.includes(s.environmentId)) : specs.length > 0;
}

export function hasProductionEnv(envs: Env[]): boolean {
  return envs.some((e) => e.isProduction);
}

function healthText(healthy: boolean, production: boolean): string {
  if (production) return healthy ? "Tem spec atual em produção" : "Sem spec em produção";
  return healthy ? "Tem spec atual" : "Sem spec";
}

/**
 * Ponto de saúde à esquerda do nome. A cor sozinha não basta (daltonismo): o saudável é um ponto
 * cheio e o que pede atenção é um anel vazio, e o texto fica para leitor de tela e para o tooltip.
 */
export function HealthDot({ healthy, production }: { healthy: boolean; production: boolean }) {
  const text = healthText(healthy, production);
  return (
    <span title={text} className={`mt-[7px] inline-block size-2.5 shrink-0 rounded-full ${healthy ? "bg-accent" : "border-2 border-wait"}`}>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** Legenda curta do ponto de saúde, logo abaixo da tabela. */
export function HealthLegend({ production }: { production: boolean }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="inline-block size-2.5 rounded-full bg-accent" />
        {production ? "Tem spec atual em produção" : "Tem spec atual"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="inline-block size-2.5 rounded-full border-2 border-wait" />
        {production ? "Sem spec em produção" : "Sem spec"}
      </span>
    </p>
  );
}
