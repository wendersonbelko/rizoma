/**
 * Busca da paleta de comandos ⌘K (p. 13 e p. 17 da auditoria de UX de 02/10/2026): decide quais
 * itens casam com o que a pessoa digitou e em que ordem aparecem. Sem I/O: a mesma regra serve ao
 * filtro de "Ir para" e "Criar" (no navegador) e à ordenação dos serviços achados (no servidor).
 */

export type Searchable = { label: string; keywords?: readonly string[] };

/** Minúsculas, sem acento e com espaços únicos: "  Integração  Externa " vira "integracao externa". */
export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  return text.split(/[^a-z0-9]+/).filter(Boolean);
}

/** Quanto o termo casa com o texto já normalizado: começo do texto > começo de uma palavra > meio. */
function tokenScore(token: string, text: string): number {
  if (text.startsWith(token)) return 3;
  if (words(text).some((w) => w.startsWith(token))) return 2;
  return text.includes(token) ? 1 : 0;
}

/**
 * Relevância de um item para a busca; 0 = não casa. Todos os termos digitados precisam aparecer no
 * rótulo ou nas palavras-chave (ordem livre). O rótulo pesa mais que a palavra-chave, e o começo
 * do rótulo mais que o meio. Busca vazia casa com tudo, com a mesma nota, para manter a ordem original.
 */
export function scoreSearch(query: string, item: Searchable): number {
  const q = normalizeSearchText(query);
  if (!q) return 1;
  const label = normalizeSearchText(item.label);
  const keywords = (item.keywords ?? []).map(normalizeSearchText);
  let total = 0;
  for (const token of q.split(" ")) {
    const inLabel = tokenScore(token, label);
    const inKeyword = Math.max(0, ...keywords.map((k) => tokenScore(token, k)));
    // Rótulo vale 10 por degrau, palavra-chave 1: um acerto no rótulo sempre ganha de um na palavra-chave.
    const best = inLabel > 0 ? 10 * inLabel : inKeyword;
    if (best === 0) return 0;
    total += best;
  }
  if (label === q) total += 100;
  else if (label.startsWith(q)) total += 50;
  return total;
}

/** Só os itens que casam, do mais relevante ao menos; empates mantêm a ordem em que vieram. */
export function rankCommands<T extends Searchable>(items: readonly T[], query: string): T[] {
  return items
    .map((item, index) => ({ item, index, score: scoreSearch(query, item) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((x) => x.item);
}

/**
 * Ordena sem descartar ninguém: serve ao resultado que o banco já filtrou (um serviço pode ter
 * entrado só pela descrição ou por um endpoint, e não por isso deixa de ser mostrado, só vem depois).
 */
export function sortByRelevance<T extends Searchable>(items: readonly T[], query: string): T[] {
  return items
    .map((item, index) => ({ item, index, score: scoreSearch(query, item) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((x) => x.item);
}

const HTTP_METHODS = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE)\s+(\S+)$/i;

/**
 * "GET /pedidos" → { method: "GET", path: "/pedidos" }. Quem digita só um caminho (ou uma palavra)
 * não tem método: devolve null e a busca olha o caminho de qualquer operação.
 */
export function parseEndpointQuery(query: string): { method: string; path: string } | null {
  const m = query.trim().match(HTTP_METHODS);
  return m ? { method: m[1]!.toUpperCase(), path: m[2]! } : null;
}
