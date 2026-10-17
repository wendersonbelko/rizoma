import { getTheme } from "@/lib/install";
import { AppearanceEditor } from "@/app/(hub)/admin/appearance/editor";

/** Aba "Aparência": a marca do sistema (nome e cor de destaque). O tema Claro/Escuro é de cada pessoa, no menu do usuário (achado F5). */
export async function AppearanceTab() {
  const theme = await getTheme();
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Nome do sistema e cor de destaque, iguais para todas as pessoas. Claro, Escuro ou Sistema cada pessoa escolhe no próprio menu, no pé do menu lateral.
      </p>
      <AppearanceEditor appName={theme.appName} accent={theme.accent} />
    </div>
  );
}
