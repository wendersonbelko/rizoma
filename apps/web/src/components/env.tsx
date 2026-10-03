import Link from "next/link";

type Env = { slug: string; name: string; color: string; isProduction?: boolean };

/**
 * Além da cor (achado da revisão de UX: bolinhas coloridas de brilho parecido no tema escuro
 * são difíceis de distinguir rápido, e um problema para quem tem daltonismo), produção sempre
 * leva um escudo — o ambiente que mais importa não depender de acertar uma cor.
 */
export function EnvBadge({ env, small }: { env: Env; small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 ${small ? "text-xs" : "py-0.5 text-sm"}`} style={{ borderColor: env.color, color: env.color }}>
      {env.isProduction ? <span aria-hidden>🛡</span> : <span className="size-1.5 rounded-full" style={{ background: env.color }} />}
      {env.slug}
    </span>
  );
}

/** Ambiente + versão publicada, como um chip clicável — usado na listagem do catálogo. */
export function EnvVersionChip({ env, version, href }: { env: Env; version: string; href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper px-2 py-1 hover:border-ink">
      <EnvBadge env={env} small /> <span className="font-mono text-[11px] text-muted">{version}</span>
    </Link>
  );
}

/** Troca de ambiente: mantém a aba atual (RN-94). */
export function EnvSwitch({ envs, current, hrefFor }: { envs: Env[]; current: string; hrefFor: (slug: string) => string }) {
  return (
    <nav aria-label="Ambiente" className="inline-flex flex-wrap gap-1 rounded-control border border-line bg-sheet p-1">
      {envs.map((e) => {
        const active = e.slug === current;
        return (
          <Link key={e.slug} href={hrefFor(e.slug)} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-control px-3 py-1.5 text-sm ${active ? "bg-paper font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
            {e.isProduction ? <span aria-hidden>🛡</span> : <span className="size-2 rounded-full" style={{ background: e.color }} />}
            {e.name}
            {e.isProduction && <span className="text-xs text-muted">prod</span>}
          </Link>
        );
      })}
    </nav>
  );
}
