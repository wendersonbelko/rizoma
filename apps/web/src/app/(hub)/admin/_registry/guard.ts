import { notFound } from "next/navigation";
import { HUB_NAV } from "@api-hub/core";
import { requireUser } from "@/lib/guards";

/**
 * Guarda das páginas de cadastro (achado N1 da auditoria de UX de 02/10/2026): a página exige
 * exatamente o que o item do menu exige (`visible` em packages/core/src/hub-nav.ts). Quem vê o item
 * abre a tela; quem não tem permissão recebe 404, como em requirePermission (RN-23).
 */
export async function requireNavAccess(href: string) {
  const user = await requireUser();
  const entry = HUB_NAV.find((e) => e.href === href);
  if (!entry || !entry.visible(user)) notFound();
  return user;
}
