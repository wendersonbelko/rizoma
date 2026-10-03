"use client";

import { useRouter } from "next/navigation";

/** Um único controle para comparar o contrato, em vez de botões que parecem mais ambientes. */
export function CompareSelect({ value, options }: { value: string; options: { slug: string; name: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Comparar
      <select
        aria-label="Comparar contrato com outro ambiente"
        className="h-10 rounded-control border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
        value={value}
        onChange={(e) => {
          const href = options.find((o) => o.slug === e.target.value)?.href;
          if (href) router.push(href);
        }}
      >
        {options.map((o) => <option key={o.slug || "none"} value={o.slug}>{o.name}</option>)}
      </select>
    </label>
  );
}
