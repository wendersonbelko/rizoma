import { redirect } from "next/navigation";
import { legacyCatalogAdminHref, type QueryParams } from "@api-hub/core";

/**
 * Achado N1 da auditoria de UX de 02/10/2026: esta página tinha 4 abas (?t=services|repositories|links|tokens)
 * e virou 4 páginas, uma por item do menu. O endereço antigo continua valendo: manda para a página nova,
 * com os valores antigos de ?t= (inclusive os em português) e os outros parâmetros. Sem checar permissão aqui:
 * a página de destino já responde 404 a quem não pode abri-la.
 */
export default async function LegacyCatalogAdminPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  redirect(legacyCatalogAdminHref(await searchParams));
}
