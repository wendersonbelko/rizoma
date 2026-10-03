# Rizoma

These instructions are in English. Reply to the user in Brazilian Portuguese (pt-BR).

Closer instructions win. When you edit a directory that has its own `AGENTS.md`, follow that file too:

- `apps/web/AGENTS.md` — screens, design system, server actions
- `packages/core/AGENTS.md` — pure business rules
- `packages/db/AGENTS.md` — schema, migrations, admin scripts
- `docs/AGENTS.md` — the documentation site

## Language

- Chat replies, PR text, and commit descriptions are pt-BR.
- Code identifiers are English: file names, folders, variables, functions, types, route segments, query keys, setup step ids, audit action names, and commit scopes.
- User-visible product copy is pt-BR: labels, empty states, validation messages, and errors a person reads.
- Code comments are pt-BR and explain why. Cite the business-rule code when one exists (`RN-30`, `RN-S01`).
- Docs under `docs/` are pt-BR. Routes, query keys, and code identifiers quoted inside them stay English.
- Renaming a public route keeps the old URL working with a redirect. Map legacy query values the same way. Do not rename an applied Prisma migration folder.

## Product

Rizoma is a private catalog of a company's APIs. It stores relationships (services, teams, repositories, external integrations, environment variables, business-rule pages). It does not connect to a customer's Postgres or RabbitMQ.

## Layers

Dependencies point downward. Upper layers may import lower ones. Lower layers never import upper ones.

| Layer | Path | Owns |
|---|---|---|
| Web | `apps/web` | Next.js screens, Server Actions, HTTP routes, session, the only place that joins database and UI |
| Database | `packages/db` | Prisma schema, migrations, client, admin scripts |
| Rules | `packages/core` | Pure decisions: permissions, access policy, specs, pagination, Zod schemas, nav. No Prisma, Next.js, or React |

If a function can be tested as `expect(f(input)).toBe(output)` with no database, session, or React, it belongs in `packages/core`.

## Naming

| Kind | Form | Example |
|---|---|---|
| Files | kebab-case | `service-row.tsx` |
| Components, types | PascalCase | `ServiceTable` |
| Functions, variables | camelCase | `readPageRequest` |
| Constants | UPPER_SNAKE_CASE | `HUB_NAV` |
| Zod schemas | camelCase + Schema | `slugSchema` |
| Permissions | `resource:action` | `catalog:read` |
| Audit actions | `group.action_in_snake_case` | `team.member_added` |
| Tab query keys | short English | `?t=services`, `?s=organization`, `?tab=rules` |

Use named exports. `export default` is only for `page.tsx`, `layout.tsx`, and `route.ts`.

## Shape of the code

- Do not grow a large file. A file holds one responsibility. When adding to it would mix unrelated behavior, split it first.
- Files of one context live in one folder. When pieces of the same context start to spread across unrelated directories, create a folder for that context and move them there. Screens already do this (`forms/`, `tabs/`, a `_folder/` that is not a route).
- Do not add an npm dependency for a small function we can write. Before installing a package, check that the app would use a real part of it, not one helper. Prefer a function in the existing home: `packages/core` for a pure rule, `apps/web/src/lib` for web I/O, or the feature folder when only that feature needs it. Do not create a catch-all utils package, and do not add a workspace package for a single call site.
- New code follows the patterns in this file and in the `AGENTS.md` next to the area. When a change does not fit a pattern, stop. Tell the user what does not fit and ask how to proceed. Do not invent a parallel style.
- If the user chooses a path that changes one of these rules, ask whether to update the agent files so the next session follows the new rule. Update `AGENTS.md` (and `.cursor/rules/language.mdc` when the language rule changes) only after they say yes.
- Match the configured style check. `tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, and `isolatedModules`. `pnpm typecheck` must pass, including test files. Do not silence a diagnostic with `any` or a blanket ignore. `pnpm lint` runs ESLint from the root `eslint.config.mjs` and must pass. Do not disable a rule to hide a new violation.

## Commands

The shell on this machine is Windows PowerShell. Chain commands with `;`, not `&&`.

```text
pnpm dev                 # http://localhost:3000
pnpm lint
pnpm typecheck
pnpm test                # core + web unit tests
pnpm test:integration    # needs TEST_DATABASE_URL
pnpm db:up
pnpm db:deploy
```

Run the narrowest check that covers the change. `pnpm typecheck` includes test files.

## Safety

- Do not commit unless the user asks. Never commit `.env`, keys, or passwords.
- Do not commit a secret into source, client JavaScript, audit metadata, logs, or error text.
- Permission checks run on the server. Hiding a button is not authorization. A missing permission is 404, not 403.
- Do not change theme palette colors to silence a test unless the task is the theme.
