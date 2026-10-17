import { can, type Permission, type Subject } from "@api-hub/core/rbac";

/**
 * Abas de Configurações (achado N3 e p. 13 da auditoria de UX de 02/10/2026): as sete seções antigas
 * viraram quatro abas. Cada aba exige a sua permissão: quem só tem `appearance:manage` (um Administrador
 * sem `settings:manage`) vê só a Aparência. Fica aqui, sem React nem banco, para a página e o teste
 * decidirem a aba pela mesma regra.
 */
export const SETTINGS_SECTIONS: readonly { id: string; label: string; permission: Permission }[] = [
  { id: "organization", label: "Organização e acesso", permission: "settings:manage" },
  { id: "connections", label: "Conexões", permission: "settings:manage" },
  { id: "environments", label: "Ambientes e sessões", permission: "settings:manage" },
  { id: "appearance", label: "Aparência", permission: "appearance:manage" },
];

export type SettingsSectionId = "organization" | "connections" | "environments" | "appearance";

/** Valores antigos de `?s=`: a aba nova e, quando existir, o bloco dentro dela (âncora `#id`). */
const LEGACY_SECTION: Record<string, { section: SettingsSectionId; anchor?: string }> = {
  login: { section: "connections", anchor: "login" },
  email: { section: "connections", anchor: "email" },
  repositories: { section: "connections", anchor: "repositories" },
  access: { section: "organization", anchor: "access" },
  sessions: { section: "environments", anchor: "sessions" },
  // Nomes em português de antes da troca para chaves em inglês.
  organizacao: { section: "organization" },
  repositorios: { section: "connections", anchor: "repositories" },
  ambientes: { section: "environments" },
  acesso: { section: "organization", anchor: "access" },
  sessoes: { section: "environments", anchor: "sessions" },
  aparencia: { section: "appearance" },
};

export type SettingsRoute =
  | { kind: "show"; section: SettingsSectionId }
  | { kind: "redirect"; section: SettingsSectionId; anchor?: string }
  /** Sem permissão para a aba pedida (ou para nenhuma): a página responde 404, como o resto do hub. */
  | { kind: "forbidden" };

/** Abas que a pessoa pode abrir, na ordem do menu. */
export function visibleSettingsSections(subject: Subject): { id: SettingsSectionId; label: string }[] {
  return SETTINGS_SECTIONS.filter((s) => can(subject, s.permission)).map((s) => ({ id: s.id as SettingsSectionId, label: s.label }));
}

/**
 * Decide o que a página faz com `?s=`: mostrar a aba, redirecionar um valor antigo ou negar.
 * Sem `s` (ou com um valor que não existe), abre a primeira aba que a pessoa pode ver.
 */
export function resolveSettingsSection(raw: string | undefined, subject: Subject): SettingsRoute {
  const visible = visibleSettingsSections(subject);
  const first = visible[0];
  if (!first) return { kind: "forbidden" };
  if (!raw) return { kind: "show", section: first.id };

  const legacy = LEGACY_SECTION[raw];
  if (legacy) return visible.some((s) => s.id === legacy.section) ? { kind: "redirect", ...legacy } : { kind: "forbidden" };

  const asked = SETTINGS_SECTIONS.find((s) => s.id === raw);
  if (!asked) return { kind: "show", section: first.id };
  return visible.some((s) => s.id === asked.id) ? { kind: "show", section: asked.id as SettingsSectionId } : { kind: "forbidden" };
}
