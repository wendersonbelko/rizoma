import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { mandatoryTourTarget, visibleHubNav } from "@api-hub/core";
import { prisma } from "@api-hub/db";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/guards";
import { getInstallation } from "@/lib/install";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { HubLogo } from "@/components/hub-logo";
import { TourProvider } from "@/components/tour/TourProvider";
import { HelpButton } from "@/components/tour/HelpButton";

export const dynamic = "force-dynamic";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const inst = await getInstallation();
  const pendingCount = visibleHubNav(user).some((e) => e.badge === "pendingAccess")
    ? await prisma.accessRequest.count({ where: { status: "PENDING", expiresAt: { gt: new Date() } } })
    : 0;

  // Fonte única do menu e do tour obrigatório: apps/web só decide rótulos e o badge de pedidos
  // pendentes; quais telas aparecem (e em que ordem) vem de packages/core/src/hub-nav.ts.
  const nav: NavItem[] = visibleHubNav(user).map((e) => ({ href: e.href, label: e.label, group: e.group, ...(e.badge === "pendingAccess" ? { badge: pendingCount } : {}) }));
  const who = user.githubLogin ? `@${user.githubLogin}` : user.email ?? user.name ?? "";

  // Tour guiado obrigatório: todo mundo tem que passar por todas as telas que vê no primeiro
  // acesso. O gate abaixo cobre carga completa (F5, URL digitada); navegação pelo cliente é
  // coberta pela guarda dentro do TourProvider, porque este layout não roda de novo nela.
  const mandatory = mandatoryTourTarget(user, user);
  const pathname = (await headers()).get("x-pathname");
  if (mandatory && pathname && pathname !== mandatory.route) redirect(mandatory.route);

  return (
    <TourProvider mandatory={mandatory}>
      <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col border-b border-line bg-sheet p-4 md:sticky md:top-0 md:h-dvh md:overflow-y-auto md:border-b-0 md:border-r">
          <Link href="/" className="mb-6 flex items-center gap-3 rounded-control px-2 py-1">
            <HubLogo />
            <span className="min-w-0">
              <span className="block truncate text-xs text-muted">{inst.orgName}</span>
              <span className="block truncate text-lg font-bold tracking-tight">{inst.appName}</span>
            </span>
          </Link>
          <NavLinks items={nav} />
          <div className="mt-4 md:mt-auto">
            <p className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold tracking-wide text-muted">
              <HubLogo className="size-4" />
              Rizoma
            </p>
            <div data-tour="user-menu" className="rounded-panel border border-line bg-paper p-3 text-sm">
            <div className="flex min-w-0 items-center gap-3">
              {user.image ? <img src={user.image} alt="" className="size-9 rounded-full" /> : <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">{who.slice(0, 1).toUpperCase()}</span>}
              <div className="min-w-0">
                <p className="truncate font-semibold">{who}</p>
                <p className="text-xs capitalize text-muted">{user.role.toLowerCase()}</p>
              </div>
            </div>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }} className="mt-3 text-center">
              <button className="text-sm font-medium text-danger underline-offset-2 hover:underline">Sair</button>
            </form>
          </div>
          </div>
        </aside>
        <main className="min-w-0 p-5 md:p-8 lg:p-10">{children}</main>
      </div>
      <HelpButton />
    </TourProvider>
  );
}
