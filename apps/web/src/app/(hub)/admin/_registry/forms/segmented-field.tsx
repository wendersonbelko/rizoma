"use client";

type Option<T extends string> = { value: T; label: string };

/**
 * Escolha entre poucas opções, todas à vista (padrão do seletor de aparência do menu da conta): botões
 * lado a lado em vez de um select. É um grupo de botões de rádio de verdade, então vale o teclado (setas)
 * e o leitor de tela. Controlado com `value`/`onChange` ou solto com `defaultValue`.
 */
export function SegmentedField<T extends string>({ legend, name, options, value, defaultValue, onChange, hint }: {
  legend: string;
  name: string;
  options: readonly Option<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-control border border-line-strong bg-paper p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center justify-center rounded-[7px] px-3 py-2 text-center text-sm font-medium text-muted transition hover:text-ink has-[:checked]:bg-sheet has-[:checked]:text-ink has-[:checked]:shadow-sm has-[:checked]:ring-1 has-[:checked]:ring-line-strong has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              className="sr-only"
              {...(value !== undefined ? { checked: value === o.value, onChange: () => onChange?.(o.value) } : { defaultChecked: defaultValue === o.value })}
            />
            {o.label}
          </label>
        ))}
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </fieldset>
  );
}
