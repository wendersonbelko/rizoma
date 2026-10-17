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

/**
 * Nome de uma pessoa para a tela: nome, senão @login, senão e-mail. Nunca devolve "null",
 * "undefined" nem vazio (achado V1 da auditoria de UX: "Entrou no sistema: @null").
 */
export function personLabel(p: { name?: string | null; githubLogin?: string | null; email?: string | null } | null | undefined, fallback = "Alguém"): string {
  const name = p?.name?.trim();
  if (name) return name;
  if (p?.githubLogin?.trim()) return `@${p.githubLogin.trim()}`;
  return p?.email?.trim() || fallback;
}

const two = (n: number) => String(n).padStart(2, "0");
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Quando algo aconteceu, do jeito que se fala: "agora", "há 5 min", "há 2 h", "ontem, 13:39",
 * "01/10, 10:45" e, de outro ano, "01/10/2025". Usa o fuso do processo, como o resto da tela.
 */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  const time = `${two(date.getHours())}:${two(date.getMinutes())}`;
  if (minutes < 1) return "agora";
  if (minutes < 60 && sameDay(date, now)) return `há ${minutes} min`;
  if (sameDay(date, now)) return `há ${Math.floor(minutes / 60)} h`;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameDay(date, yesterday)) return `ontem, ${time}`;
  const day = `${two(date.getDate())}/${two(date.getMonth() + 1)}`;
  return date.getFullYear() === now.getFullYear() ? `${day}, ${time}` : `${day}/${date.getFullYear()}`;
}
