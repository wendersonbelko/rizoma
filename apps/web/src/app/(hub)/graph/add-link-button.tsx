import Link from "next/link";

/**
 * "+ Vínculo": abre o cadastro de vínculos (modal `new-link` em /admin/links) já com o item em
 * foco no campo De. Só aparece no modo mapa e para quem tem link:edit.
 */
export function AddLinkButton({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href} data-tour="graph-add-link"
      aria-label={title} title={title}
      className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_16%,transparent)] hover:brightness-110"
    >
      + Vínculo
    </Link>
  );
}
