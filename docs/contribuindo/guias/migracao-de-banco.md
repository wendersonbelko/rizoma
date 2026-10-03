---
description: Como alterar o schema Prisma do Rizoma, gerar a migração em desenvolvimento e aplicá-la com segurança em quem já instalou.
---

# Mudar o banco (migração)

O schema está em `packages/db/prisma/schema.prisma`. As migrações versionadas ficam em `packages/db/prisma/migrations`. Quem instala aplica essa pasta com `pnpm db:deploy` (ou o container `migrate`, em produção). Você não pede para a pessoa editar o banco à mão.

## Em desenvolvimento

1. Suba o Postgres: `pnpm db:up`.
2. Altere o `schema.prisma`.
3. Na raiz, `pnpm db:migrate`. Isso roda `prisma migrate dev` no pacote `@api-hub/db`, compara o schema com o banco, pede um nome e grava a pasta da migração.
4. Confira o SQL gerado. Ajuste se ele apaga dado que você quer manter.
5. Rode `pnpm typecheck`. O client é gerado no fluxo do migrate; se os tipos não aparecerem, `pnpm --filter @api-hub/db generate`.

`pnpm db:migrate` é para **criar** migração. `pnpm db:deploy` só aplica as que já existem. Não use `migrate dev` contra um banco de produção: se o histórico divergir, o Prisma pode propor recriar o schema.

## O que a migração pode e não pode

- Coluna nova com default ou anulável não exige passo manual de quem já instalou.
- Renomear ou apagar coluna é perda de dado. Se o dado importa, migre em dois passos: criar o novo, copiar, e só numa versão seguinte remover o antigo.
- Enum novo no Postgres precisa de um valor que o código antigo tolere, se a versão anterior ainda estiver no ar durante o deploy. O hub é uma instância só, mas o container `migrate` roda **antes** do `web` novo.
- `String[]` e `Json` são do PostgreSQL. Não introduza um tipo que feche a porta descrita no [roadmap](/arquitetura/roadmap) sem dizer isso na migração.

Os enums usados pelo `core` são copiados em `packages/core/src/types.ts`. Se você adicionar um valor, atualize os dois lados: o `core` não importa o client do Prisma.

## Em quem já tem o hub

O deploy aplica `prisma migrate deploy`. Não há comando interativo. A migração tem de ser idempotente em relação ao histórico: uma pasta nova, nunca editar uma migração que já foi publicada.

Antes de uma migração que mexe em dado, o caminho de [backup](/instalacao/atualizacao-e-backup) precisa estar nas notas da versão.

## Teste

Se a regra que usa a coluna nova é pura, teste no `core`. Se a action ou a rota passam a gravar a coluna, cubra em `apps/web/test/integration` com `TEST_DATABASE_URL`. Esse banco é truncado. Veja [Testes](/contribuindo/testes).

## Veja também

- [Modelo de dados](/arquitetura/modelo-de-dados)
- [Comandos (CLI)](/referencia/cli)
- [Atualização e backup](/instalacao/atualizacao-e-backup)
