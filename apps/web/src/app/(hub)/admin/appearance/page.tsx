import { requirePermission } from "@/lib/guards";
import { getTheme } from "@/lib/install";
import { AppearanceEditor } from "./editor";

export default async function AppearancePage() {
  await requirePermission("appearance:manage");
  const theme = await getTheme();
  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Aparência</h1>
        <p className="text-muted">Título do sistema, tema e cores. Vale para todas as pessoas.</p>
      </header>
      <AppearanceEditor appName={theme.appName} themeId={theme.id} palette={theme.palette} />
    </div>
  );
}
