import { TabNav } from "@/components/tab-nav";
import { TABS, type HrefFor, type Tab } from "./types";

/** Abas da página do serviço, sobre o TabNav padrão. */
export function ServiceTabsNav({ active, hrefFor }: { active: Tab; hrefFor: HrefFor }) {
  return (
    <TabNav
      label="Seções do serviço"
      active={active}
      items={TABS.map((t) => ({ id: t.id, label: t.label, href: hrefFor({ tab: t.id, v: "", doc: "", edit: "" }), tour: `service-tab-${t.id}` }))}
    />
  );
}
