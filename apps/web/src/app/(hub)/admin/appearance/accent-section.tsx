import { DEFAULT_ACCENT, HEX } from "@api-hub/core/themes";
import { Input } from "@/components/ui";

/**
 * Cor de destaque da marca (botões, links e item ativo do menu). Os dois temas nascem dela, então
 * só uma cor precisa passar no contraste do tema claro; cor ilegível é recusada com o porquê.
 */
export function AccentSection({ accent, problems, onChange }: { accent: string; problems: string[]; onChange: (accent: string) => void }) {
  const error = problems[0];
  return (
    <section data-tour="appearance-accent" className="space-y-3">
      <h2 className="text-lg font-semibold">Cor de destaque</h2>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          aria-label="Escolher a cor de destaque"
          value={HEX.test(accent) ? accent.toLowerCase() : DEFAULT_ACCENT}
          onChange={(e) => onChange(e.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-control border border-line-strong bg-field p-1"
        />
        <Input
          name="accent"
          aria-label="Cor de destaque em hexadecimal"
          aria-invalid={error ? true : undefined}
          aria-describedby="accent-help"
          value={accent}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          className="w-36 font-mono"
          onChange={(e) => onChange(e.target.value.trim())}
          // Aceita colar "0f7a68" sem o "#".
          onBlur={() => { if (/^[0-9a-f]{6}$/i.test(accent)) onChange(`#${accent}`); }}
        />
        {accent.toLowerCase() !== DEFAULT_ACCENT && (
          <button type="button" className="text-sm text-accent underline-offset-2 hover:underline" onClick={() => onChange(DEFAULT_ACCENT)}>
            Voltar ao verdete padrão
          </button>
        )}
      </div>
      <div id="accent-help" className="text-sm">
        {error
          ? <p role="alert" className="text-danger">{error}</p>
          : <p className="text-muted">Aparece em botões, links e no item ativo do menu. No tema escuro o sistema clareia essa cor sozinho para manter a leitura.</p>}
      </div>
    </section>
  );
}
