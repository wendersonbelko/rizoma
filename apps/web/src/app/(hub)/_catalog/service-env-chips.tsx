import { EnvVersionChip } from "@/components/env";
import { Badge } from "@/components/ui";

type Env = { id: string; slug: string; name: string; color: string; isProduction?: boolean };
type Spec = { version: string; environmentId: string };

/** Uma pílula por ambiente com spec atual (ambiente + versão), ou "Sem spec" quando não há nenhuma. */
export function ServiceEnvChips({ envs, specs, serviceSlug }: { envs: Env[]; specs: Spec[]; serviceSlug: string }) {
  const chips = envs
    .map((env) => ({ env, spec: specs.find((x) => x.environmentId === env.id) }))
    .filter((x): x is { env: Env; spec: Spec } => !!x.spec);

  if (chips.length === 0) return <Badge tone="wait">Sem spec</Badge>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(({ env, spec }) => (
        <EnvVersionChip key={env.id} env={env} version={spec.version} href={`/services/${serviceSlug}?env=${env.slug}`} />
      ))}
    </div>
  );
}
