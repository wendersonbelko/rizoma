import { EnvVersionChip } from "@/components/env";
import { Badge } from "@/components/ui";

type Env = { id: string; slug: string; name: string; color: string; isProduction?: boolean };
type Spec = { version: string; environmentId: string };

/** Um chip por ambiente com spec publicada, ou o aviso "sem spec" quando não há nenhuma. */
export function ServiceEnvChips({ envs, specs, serviceSlug }: { envs: Env[]; specs: Spec[]; serviceSlug: string }) {
  const chips = envs
    .map((env) => ({ env, spec: specs.find((x) => x.environmentId === env.id) }))
    .filter((x): x is { env: Env; spec: Spec } => !!x.spec);

  if (chips.length === 0) return <Badge tone="wait">sem spec</Badge>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(({ env, spec }) => (
        <EnvVersionChip key={env.id} env={env} version={spec.version} href={`/services/${serviceSlug}?env=${env.slug}`} />
      ))}
    </div>
  );
}
