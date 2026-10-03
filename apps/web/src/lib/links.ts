/**
 * Base para links de "veja a documentação" exibidos na UI (ex.: como publicar a spec pelo CI).
 * Aponta para o site de documentação do projeto (docs/, publicado no GitHub Pages). Configurável
 * via NEXT_PUBLIC_DOCS_URL para quem hospeda a doc em outro lugar (domínio próprio, wiki interna).
 */
const DOCS_BASE = (process.env.NEXT_PUBLIC_DOCS_URL ?? "https://wendersonbelko.github.io/rizoma").replace(/\/+$/, "");

/** `page` é o caminho da página no site, sem extensão (ex.: "receitas/publicar-pelo-github-actions"). */
export const docUrl = (page: string) => `${DOCS_BASE}/${page.replace(/^\/+/, "")}`;
