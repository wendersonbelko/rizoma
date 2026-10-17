import { notFound, redirect } from "next/navigation";
import { can } from "@api-hub/core";
import { requireUser } from "@/lib/guards";
import { TabNav } from "@/components/tab-nav";
import { InstallationSummary } from "./installation-summary";
import { resolveSettingsSection, visibleSettingsSections } from "./sections";
import { AppearanceTab } from "./tabs/appearance-tab";
import { ConnectionsTab } from "./tabs/connections-tab";
import { EnvironmentsTab } from "./tabs/environments-tab";
import { OrganizationTab } from "./tabs/organization-tab";

/**
 * Configurações do sistema, em quatro abas (achado N3 da auditoria de UX de 02/10/2026). A página abre para quem tem
 * `settings:manage` OU `appearance:manage`, e cada aba confere a permissão dela (a Aparência é a única de `appearance:manage`).
 * Falta de permissão é 404 (RN-23), então não dá para usar o `requirePermission` de uma permissão só.
 */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ s?: string | string[] }> }) {
  const user = await requireUser();
  const { s } = await searchParams;
  const route = resolveSettingsSection(Array.isArray(s) ? s[0] : s, user);
  if (route.kind === "forbidden") notFound();
  // Valores antigos de ?s= (login, email, repositories, access, sessions…) levam à aba nova, já no bloco certo.
  if (route.kind === "redirect") redirect(`/admin/settings?s=${route.section}${route.anchor ? `#${route.anchor}` : ""}`);
  const active = route.section;

  return (
    <div className="max-w-6xl space-y-6">
      <header data-tour="settings-header" className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <InstallationSummary canManage={can(user, "settings:manage")} />
      </header>

      <TabNav
        label="Seções"
        tour="settings-tabs"
        active={active}
        items={visibleSettingsSections(user).map(({ id, label }) => ({ id, label, href: `?s=${id}` }))}
      />

      <div data-tour="settings-section" className="min-w-0">
        {active === "organization" && <OrganizationTab />}
        {active === "connections" && <ConnectionsTab />}
        {active === "environments" && <EnvironmentsTab />}
        {active === "appearance" && <AppearanceTab />}
      </div>
    </div>
  );
}
