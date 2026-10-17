import { Field, Input } from "@/components/ui";

/** Campo do nome do sistema — aparece no menu, na aba do navegador, no login e nos convites. */
export function TitleSection({ appName, onChange }: { appName: string; onChange: (name: string) => void }) {
  return (
    <section data-tour="appearance-title" className="space-y-3">
      <h2 className="text-lg font-semibold">Nome do sistema</h2>
      <Field label="Nome *" hint="Aparece no topo do menu, na aba do navegador, no login e nos convites.">
        <Input name="appName" value={appName} maxLength={40} onChange={(e) => onChange(e.target.value)} />
      </Field>
    </section>
  );
}
