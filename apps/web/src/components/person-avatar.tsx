import { personLabel } from "@api-hub/core/text";

type Person = { name?: string | null; githubLogin?: string | null; email?: string | null; image?: string | null };

const SIZE = { sm: "size-7 text-xs", md: "size-9 text-sm" } as const;

/**
 * Foto da pessoa ou, sem foto, a inicial do nome numa pílula com a cor de destaque. Decorativo
 * (`alt=""`): o nome sempre vem escrito ao lado. Achado da p. 12 da auditoria de UX de 02/10/2026:
 * Times e Pessoas mostram avatar + nome no lugar do e-mail.
 */
export function PersonAvatar({ person, size = "md" }: { person: Person; size?: keyof typeof SIZE }) {
  if (person.image) return <img src={person.image} alt="" className={`${SIZE[size]} shrink-0 rounded-full`} />;
  const initial = personLabel(person, "?").replace(/^@/, "").slice(0, 1).toUpperCase();
  return (
    <span aria-hidden="true" className={`${SIZE[size]} grid shrink-0 place-items-center rounded-full bg-accent/15 font-semibold text-accent`}>
      {initial}
    </span>
  );
}
