import type { BadgeTone } from "@/components/ui";

/** Rótulos compartilhados pelas telas de Pessoas e acesso. */
export const STATUS_LABEL = { ACTIVE: "ativo", PENDING: "aguardando", SUSPENDED: "suspenso", REJECTED: "recusado" } as const;
export type PersonStatus = keyof typeof STATUS_LABEL;
export const STATUS_TONE: Record<PersonStatus, BadgeTone> = { ACTIVE: "accent", PENDING: "wait", SUSPENDED: "danger", REJECTED: "danger" };

/** De onde veio o acesso da pessoa, em palavras. */
export function accessOrigin(p: { isOrgMember: boolean; accessGrant: string | null }): string {
  if (p.isOrgMember) return "da empresa";
  if (p.accessGrant === "OWNER_SETUP") return "instalação";
  return p.accessGrant === "MANUAL_APPROVAL" ? "aprovado ou convidado" : "externo";
}

const ROLE_WORDS: Record<string, string> = { OWNER: "Proprietário", ADMIN: "Administrador", MAINTAINER: "Mantenedor", VIEWER: "Leitor" };

/**
 * Mensagens que vêm das regras do core ("Somente um OWNER pode…") citam o código do papel. Na tela
 * o código não aparece (achado V2 da auditoria de UX de 02/10/2026): troca pelo nome do papel.
 */
export function plainRoles(message: string): string {
  return message.replace(/\b(OWNER|ADMIN|MAINTAINER|VIEWER)\b/g, (code) => ROLE_WORDS[code] ?? code);
}
