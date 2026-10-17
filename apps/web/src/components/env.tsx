import Link from "next/link";

type Env = { slug: string; name: string; color: string; isProduction?: boolean };

/**
 * Marca do ambiente, a mesma no selo e no seletor: um ponto na cor do ambiente e, só em produção,
 * um escudo no lugar dele. A cor sozinha não basta (bolinhas de brilho parecido no tema escuro são
 * difíceis de distinguir rápido, e um problema para quem tem daltonismo), então o ambiente que mais
 * importa também tem uma forma própria.
 */
function EnvMark({ env }: { env: Env }) {
  if (env.isProduction) {
    return (
      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 shrink-0" style={{ color: env.color }}>
        <path d="M8 1.25 2.5 3.4v4.2c0 3.2 2.3 5.9 5.5 7.15 3.2-1.25 5.5-3.95 5.5-7.15V3.4L8 1.25Z" fill="currentColor" />
        <path d="m5.6 8.1 1.7 1.7 3.1-3.4" fill="none" stroke="var(--color-sheet)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: env.color }} />;
}

/**
 * Selo de ambiente (achado D4 da auditoria de UX de 02/10/2026): pílula preenchida suave na cor do
 * ambiente. O texto mistura a cor com o tom do texto do tema, para continuar legível sobre o
 * fundo claro e sobre o escuro, seja qual for a cor que o admin escolheu.
 */
export function EnvBadge({ env, small }: { env: Env; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 font-medium leading-none ${small ? "py-1 text-xs" : "py-1 text-sm"}`}
      style={{ background: `color-mix(in srgb, ${env.color} 16%, transparent)`, color: `color-mix(in srgb, ${env.color} 50%, var(--color-ink))` }}
    >
      <EnvMark env={env} />
      {env.slug}
    </span>
  );
}

/** Ambiente + versão publicada, como um chip clicável — usado na listagem do catálogo. */
export function EnvVersionChip({ env, version, href }: { env: Env; version: string; href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper px-2 py-1 hover:border-line-strong">
      <EnvBadge env={env} small /> <span className="font-mono text-[11px] text-muted">{version}</span>
    </Link>
  );
}

/**
 * Troca de ambiente: mantém a aba atual (RN-94). Trilho no fundo da página e o ambiente ativo
 * como um botão elevado com borda de controle, para o ativo se distinguir sem depender da cor
 * nos dois temas.
 */
export function EnvSwitch({ envs, current, hrefFor }: { envs: Env[]; current: string; hrefFor: (slug: string) => string }) {
  return (
    <nav aria-label="Ambiente" className="inline-flex flex-wrap gap-1 rounded-control border border-line bg-paper p-1">
      {envs.map((e) => {
        const active = e.slug === current;
        return (
          <Link key={e.slug} href={hrefFor(e.slug)} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-[7px] border px-3 py-1.5 text-sm transition ${active ? "border-line-strong bg-sheet font-semibold text-ink shadow-sm" : "border-transparent text-muted hover:bg-sheet/60 hover:text-ink"}`}>
            <EnvMark env={e} />
            {e.name}
            {e.isProduction && <span className="text-xs text-muted">prod</span>}
          </Link>
        );
      })}
    </nav>
  );
}
