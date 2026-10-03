# packages/core

Pure rules only. This package must not import Prisma, Next.js, or React.

## Put a decision here when

- It answers "who may", "what matches", or "how to format" without I/O.
- A unit test can call it with plain values.

Shared Zod schemas live in `packages/core/src/schemas.ts`. Validation messages are pt-BR and tell the person how to fix the field. Cap size with `.max()`. Trim and normalize at the schema, not later.

`types.ts` mirrors Prisma enums by hand. If you add an enum value, update both the schema and this file.

## Permissions and nav

- A new permission is an entry in `rbac.ts` plus a core test. Do not special-case "is admin" in a screen.
- Menu visibility is `hub-nav.ts`. The mandatory first-access tour is one overview on `/`, not a walk through every screen.

## Tests

Tests live in `packages/core/test`. Describe the behavior in pt-BR (`it("editar serviço exige o time", ...)`). Identifiers in the test code stay English.

Do not change theme palette colors to make `themes.test.ts` pass unless the task is the theme.
