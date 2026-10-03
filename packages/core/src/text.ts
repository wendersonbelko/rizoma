/** Slug compatível com slugSchema: ^[a-z0-9][a-z0-9-]{1,62}$ */
export function slugify(input: string, max = 63): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

/** Escolhe a forma pela contagem. Em pt-BR, 0 vai para o plural. */
export function plural(n: number, one: string, many: string): string {
  return Math.abs(n) === 1 ? one : many;
}

/** "1 serviço", "3 serviços", "1.234 registros" */
export function countLabel(n: number, one: string, many: string): string {
  return `${n.toLocaleString("pt-BR")} ${plural(n, one, many)}`;
}
