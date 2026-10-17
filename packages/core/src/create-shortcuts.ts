import { can, type Subject } from "./rbac";

/**
 * Atalhos de criação do "+ Novo" e da seção "Criar" do ⌘K (p. 13 da auditoria de UX de 02/10/2026:
 * "Cadastros que viram atalhos"). Cada um aponta para a tela do cadastro com `#id` do modal-padrão;
 * a tela abre o FormModal desse id ao carregar (ver FormModal). Os ids são o contrato entre as telas.
 *
 * `visible` é a permissão que o botão de criar da própria tela exige. A Server Action de cada
 * cadastro revalida no servidor: esconder o atalho não é autorização.
 */
export type CreateShortcut = {
  /** Mesmo id do FormModal da tela de destino. */
  id: string;
  label: string;
  /** Rota + `#id`, pronto para navegar. */
  href: string;
  /** Palavras que também encontram o atalho na busca ("criar", "adicionar"…). */
  keywords: readonly string[];
};

type CreateShortcutEntry = CreateShortcut & { visible: (s: Subject) => boolean };

const VERBS = ["criar", "novo", "nova", "adicionar", "cadastrar"] as const;

export const CREATE_SHORTCUTS: readonly CreateShortcutEntry[] = [
  { id: "new-service", label: "Novo serviço", href: "/admin/services#new-service", keywords: [...VERBS, "api", "frontend", "worker"], visible: (s) => can(s, "service:create") },
  { id: "new-repository", label: "Novo repositório", href: "/admin/repositories#new-repository", keywords: [...VERBS, "codigo", "github", "gitlab"], visible: (s) => can(s, "link:edit") },
  { id: "new-link", label: "Novo vínculo", href: "/admin/links#new-link", keywords: [...VERBS, "ligacao", "dependencia", "relacao"], visible: (s) => can(s, "link:edit") },
  { id: "new-token", label: "Gerar token de CI", href: "/admin/tokens#new-token", keywords: [...VERBS, "gerar", "token", "pipeline", "publicacao"], visible: (s) => can(s, "token:manage") },
  { id: "new-integration", label: "Nova integração", href: "/integrations#new-integration", keywords: [...VERBS, "externa", "terceiro", "fila", "banco"], visible: (s) => can(s, "link:edit") },
  { id: "new-team", label: "Novo time", href: "/admin/teams#new-team", keywords: [...VERBS, "equipe", "squad"], visible: (s) => can(s, "team:manage") },
  { id: "invite", label: "Convidar pessoa", href: "/admin/people#invite", keywords: [...VERBS, "convidar", "usuario", "convite", "membro"], visible: (s) => can(s, "user:manage") },
];

/** Só os atalhos que a pessoa pode usar, na ordem do menu. Sem campos de função: serializável para o cliente. */
export function visibleCreateShortcuts(s: Subject): CreateShortcut[] {
  return CREATE_SHORTCUTS.filter((e) => e.visible(s)).map(({ id, label, href, keywords }) => ({ id, label, href, keywords }));
}
