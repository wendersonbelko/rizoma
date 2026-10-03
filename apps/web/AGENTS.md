<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rizoma web

Reply to the user in Brazilian Portuguese. The block above is maintained by Next.js; do not edit it. These rules are the project rules for `apps/web`.

## Screens

A `page.tsx` loads data and composes pieces. It does not own table markup, filter chips, or pagination logic.

| File | Role |
|---|---|
| `page.tsx` | Permission guard, URL params, call `query.ts`, compose |
| `query.ts` | Prisma. Filter and visibility in SQL so pagination totals are real |
| `actions.ts` | Server Actions (`"use server"`) |
| `*-table.tsx` / `*-row.tsx` | `DataTable` and one row |
| `forms/` | Client forms |
| `tabs/` | One piece per tab; each tab loads its own data |
| `_folder/` | Private pieces. The leading `_` keeps them out of the router |

One component does one thing. A file whose name needs "and" should be split.

Creating or editing an entity opens `FormModal`. Do not leave the form on the list. A modal that reveals a token, invite link, or webhook secret stays open after save so the person can copy it.

## Design system

Use the shared components. `apps/web/test/unit/design-system.test.ts` fails on a hand-built `<table>`, a hand-built divided list, or a growing list with no pagination.

- Lists: `DataTable` (`components/table.tsx`). Rich cards: `CardList`.
- Empty lists: `EmptyState`, not a table row that says "none".
- Lists that grow with use are paginated. Every listing defaults to 10 (`DEFAULT_PAGE_SIZE`). The size selector still offers 10, 20, 50, and 100. A table that cannot grow is an entry in `FIXED_SIZE_TABLES` in that test, with a reason.
- Colors come from theme tokens: `bg-paper`, `bg-sheet`, `bg-field`, `text-ink`, `text-muted`, `border-line`, `text-accent`, `text-wait`, `text-danger`, `rounded-panel`, `rounded-control`. No raw hex in a screen.
- Tour targets need a literal `tour="id"` or `data-tour="id"` in JSX. A variable attribute does not satisfy `tours.test.ts`. A per-screen tour has at least three steps and only highlights elements that exist on the default view.
- On the link map, print and add-link render only when the mode is `map`.

## Server and client

Server Components are the default. Add `"use client"` on the deepest component that needs state or browser events.

- A client file never imports `@api-hub/db` or `@/lib/guards`.
- A client file imports core by subpath (`@api-hub/core/rbac`, `@api-hub/core/pagination`). The package index pulls in `node:crypto`.
- A server file imports `@api-hub/core`.

## Server Actions

Order inside `actions.ts`:

1. `requirePermission(...)` or `requireUser()` on the first line.
2. Validate with Zod. Use `safeParse` when the person can fix the form, and return `{ ok: false, message }` in pt-BR. Use `.parse()` for hidden ids that only fail if the request was tampered with.
3. Check scope on a record loaded from the database, not on an id taken from the form.
4. Write. Use `$transaction` when more than one write must succeed together.
5. `audit(...)`. Metadata may include keys and slugs, never secret values.
6. `revalidatePath` for every screen that shows the change.

Call `redirect()` outside `try/catch`. Next.js implements it by throwing.

A new audit action needs a Portuguese sentence in `describeAuditEvent`.

## Copy

UI text is pt-BR, direct, second person ("você"). Buttons say the effect ("Salvar", "Criar time"), not "OK". Dates use `toLocaleDateString("pt-BR")`. Plurals use `countLabel()`.

