# packages/db

Prisma schema, migrations, the database client, and admin scripts (`packages/db/scripts`).

## Schema changes

- Edit `prisma/schema.prisma`, then add a new migration. Do not rename, move, or rewrite a migration folder that has already been applied.
- Enum values that `packages/core/src/types.ts` mirrors must be updated there in the same change.
- Scripts may use `packages/core`. The Prisma client does not import `apps/web`.

## Secrets

Do not write database passwords, API tokens, or generated recovery links into source or into a committed env file. Scripts may print a one-time link to the terminal. They must not persist the raw token; only the hash is stored.
