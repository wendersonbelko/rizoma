"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@api-hub/db";
import { getMandatoryTourRoutes, mandatoryTourTarget } from "@api-hub/core";
import { requireUser } from "@/lib/guards";
import { audit } from "@/lib/audit";

export type AdvanceTourResult =
  | { status: "next"; route: string; index: number; total: number; isLast: boolean }
  | { status: "done" };

/**
 * Avança o tour obrigatório depois que a pessoa terminou o tour da tela `finishedRoute`.
 * Não fica em `requireUser()`: essa função é chamada por TODA server action do app, e o gate
 * do tour vive só no layout do hub — colocá-lo aqui redirecionaria qualquer ação no meio do tour.
 *
 * Idempotente: se `finishedRoute` não bate com a tela atual (clique duplicado, aba antiga),
 * só devolve a tela certa sem avançar de novo. O `updateMany` com `tourStep` no `where` evita
 * corrida entre duas chamadas simultâneas avançando duas vezes.
 */
export async function advanceMandatoryTour(finishedRoute: string): Promise<AdvanceTourResult> {
  const user = await requireUser();
  const current = mandatoryTourTarget(user, user);
  if (!current) return { status: "done" };
  if (current.route !== finishedRoute) return { status: "next", ...current };

  const routes = getMandatoryTourRoutes(user);
  const nextIndex = current.index + 1;
  const done = nextIndex >= routes.length;

  const { count } = await prisma.user.updateMany({
    where: { id: user.id, tourStep: user.tourStep, tourCompletedAt: null },
    data: done ? { tourStep: nextIndex, tourCompletedAt: new Date() } : { tourStep: nextIndex },
  });

  if (count === 0) {
    // Outra requisição já avançou (duplo clique). Recarrega o estado real e devolve a tela certa.
    const fresh = await requireUser();
    const target = mandatoryTourTarget(fresh, fresh);
    return target ? { status: "next", ...target } : { status: "done" };
  }

  if (done) {
    await audit({ actorId: user.id, action: "user.tour_completed", targetType: "user", targetId: user.id });
    revalidatePath("/", "layout");
    return { status: "done" };
  }
  return { status: "next", route: routes[nextIndex]!, index: nextIndex, total: routes.length, isLast: nextIndex === routes.length - 1 };
}
