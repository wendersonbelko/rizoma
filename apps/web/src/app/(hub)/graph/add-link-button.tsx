/** Botão flutuante "+" que abre o cadastro de vínculo — só aparece para quem tem link:edit. */
export function AddLinkButton({ href, title }: { href: string; title: string }) {
  return (
    <a
      href={href} data-tour="graph-add-link"
      aria-label="Novo vínculo" title={title}
      className="grid size-10 place-items-center rounded-full bg-accent text-xl font-bold text-accent-ink hover:brightness-110"
    >
      +
    </a>
  );
}
