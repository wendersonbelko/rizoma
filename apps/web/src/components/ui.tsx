import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Tone = "primary" | "quiet" | "danger";
const tones: Record<Tone, string> = {
  primary: "bg-accent text-accent-ink shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_16%,transparent)] hover:brightness-110",
  quiet: "border border-line bg-sheet text-ink hover:border-accent/40 hover:bg-paper",
  danger: "border border-danger bg-sheet text-danger hover:bg-danger hover:text-paper",
};
const buttonBase = "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm font-semibold tracking-tight transition disabled:opacity-50";

export function Button({ tone = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return <button {...props} className={`${buttonBase} ${tones[tone]} ${className}`} />;
}

/** Link com cara de botão (CTA de estado vazio, "+ Nova…"), com os mesmos tons do Button. `external` abre em nova aba. */
export function LinkButton({ href, tone = "primary", external, className = "", children }: { href: string; tone?: Tone; external?: boolean; className?: string; children: ReactNode }) {
  const cls = `${buttonBase} ${tones[tone]} ${className}`;
  if (external) return <a href={href} target="_blank" rel="noreferrer" className={cls}>{children} ↗</a>;
  return <Link href={href} className={cls}>{children}</Link>;
}

export type BadgeTone = "neutral" | "accent" | "wait" | "danger";
// Achado da p. 11 da auditoria de UX de 02/10/2026: pílula preenchida suave, com o texto na cor forte
// do próprio status. O texto é a cor do status misturada com 18% de tinta (escurece no claro e
// clareia no escuro), o que mantém ≥ 4,5:1 sobre o fundo suave, no painel, no papel e no modal, nos dois temas.
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-muted/14 text-[color-mix(in_srgb,var(--color-muted)_82%,var(--color-ink))] ring-muted/25",
  accent: "bg-accent/14 text-[color-mix(in_srgb,var(--color-accent)_82%,var(--color-ink))] ring-accent/25",
  wait: "bg-wait/14 text-[color-mix(in_srgb,var(--color-wait)_82%,var(--color-ink))] ring-wait/25",
  danger: "bg-danger/14 text-[color-mix(in_srgb,var(--color-danger)_82%,var(--color-ink))] ring-danger/25",
};

/** Selo de status/categoria — o mesmo formato em qualquer tela (situação do serviço, segredo, papel, status…). */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none ring-1 ring-inset ${badgeTones[tone]}`}>{children}</span>;
}

const noticeTones: Record<"wait" | "danger" | "info", string> = {
  wait: "border-l-wait",
  danger: "border-l-danger",
  info: "border-l-accent",
};

/** Aviso em faixa (divergência de configuração, pré-requisito faltando…) — mesmo formato em qualquer tela. */
export function Notice({ tone = "info", title, children }: { tone?: "wait" | "danger" | "info"; title?: ReactNode; children: ReactNode }) {
  return (
    <div role={tone === "info" ? "status" : "alert"} className={`rounded-panel border border-line border-l-4 bg-sheet px-4 py-3 text-sm shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_5%,transparent)] ${noticeTones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1 text-muted" : undefined}>{children}</div>
    </div>
  );
}

/**
 * Seção de página sem moldura: título, descrição e ação à direita. Usada quando o conteúdo já
 * é um card (tabela, estado vazio) — evita card dentro de card. Para formulários, use Panel.
 */
export function Section({ title, description, action, children, id, tour }: {
  title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; id?: string; tour?: string;
}) {
  return (
    <section id={id} data-tour={tour} className="scroll-mt-6 space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Field({ label, hint, error, children }: { label: ReactNode; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="block text-sm text-muted">{hint}</span>}
      {error && <span className="block text-sm text-danger">{error}</span>}
    </label>
  );
}

// Borda de campo ≥ 3:1 contra o fundo do campo (WCAG 1.4.11, p. 11 da auditoria de UX de 02/10/2026).
// O token line-strong vem do tema (themes.ts), claro e escuro.
const fieldBase = "rounded-control border border-line-strong bg-field px-3 text-[15px] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_5%,transparent)] outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15";
// :read-only também casa com <select> (ele não é editável como texto): por isso o visual de "somente leitura" fica só no Input e no Textarea.
const readOnlyStyle = "read-only:bg-paper read-only:text-muted";
const control = `h-11 ${fieldBase}`;
// Largura total por padrão; um w-* passado em className substitui (evita conflito de classes).
const width = (className?: string) => (className && /(^|\s)w-/.test(className) ? "" : "w-full");

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${readOnlyStyle} ${width(props.className)} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldBase} ${readOnlyStyle} min-h-24 resize-y py-2.5 leading-relaxed ${width(props.className)} ${props.className ?? ""}`} />;
}

/**
 * `placeholder` (achado M3 da auditoria): campo obrigatório começa vazio, sem uma opção já escolhida.
 * Vira uma primeira opção desativada com value="" — a pessoa precisa escolher, e a opção não é enviável.
 * Sem `value` nem `defaultValue`, o campo abre nela; com um dos dois, vale o que o formulário passou.
 */
export function Select({ placeholder, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  const hasPlaceholder = placeholder !== undefined;
  const startsEmpty = hasPlaceholder && props.value === undefined && props.defaultValue === undefined;
  const placeholderStyle = hasPlaceholder ? " has-[option[value='']:checked]:text-muted [&>option]:text-ink" : "";
  return (
    <select {...props} defaultValue={startsEmpty ? "" : props.defaultValue} className={`${control} ${width(props.className)} ${props.className ?? ""}${placeholderStyle}`}>
      {hasPlaceholder && <option value="" disabled>{placeholder}</option>}
      {children}
    </select>
  );
}

export function Panel({ title, children, action, id, tour }: { title?: string; children: ReactNode; action?: ReactNode; id?: string; tour?: string }) {
  return (
    <section id={id} data-tour={tour} className={`rounded-panel border border-line bg-sheet p-6 shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow,var(--color-ink))_6%,transparent)]${id ? " scroll-mt-6" : ""}`}>
      {(title || action) && (
        <header className="mb-5 flex items-baseline justify-between gap-4">
          {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
