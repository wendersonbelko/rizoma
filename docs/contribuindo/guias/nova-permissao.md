---
description: Como acrescentar uma permissão ao Rizoma sem quebrar a matriz de quem já personalizou os papéis.
---

# Criar uma permissão

Permissões vivem em `packages/core/src/rbac.ts`, na lista `PERMISSION_DEFS`. A tela [Permissões](/admin/permissoes) e a função `buildMatrix` leem essa lista. Não espalhe strings soltas.

## 1. Declare

Cada item tem `id` no formato `recurso:acao`, `group` (Catálogo, Variáveis de ambiente, Serviços ou Administração) e `label` em português, como a pessoa vê na matriz.

- `required: true` só para o que ninguém pode desmarcar. Hoje é apenas `catalog:read`.
- `sensitive: true` para o que só ADMIN pode receber (além do OWNER, que tem tudo). A validação recusa dar isso a MAINTAINER ou VIEWER.

## 2. Dê o padrão

Inclua o id em `DEFAULT_MATRIX` nos papéis que devem nascer com ela. OWNER recebe todas via `ALL_PERMISSIONS`; não precisa listar.

Quem **já salvou** uma matriz no banco não herda a permissão nova: `buildMatrix` usa as linhas gravadas e só força OWNER e as obrigatórias. Diga isso nas notas da versão. Se a permissão tiver de valer para instalações já personalizadas, uma migração insere a linha em `RolePermission`. Caso contrário, a pessoa administradora marca na tela.

## 3. Use no servidor

Na página e na action, `requirePermission("recurso:acao")`. Esconder o botão é cortesia, não controle. Rota administrativa sem a permissão responde como inexistente.

Se a ação vale só para o time do serviço, use `canManageService` em vez de checar a permissão sozinha (RN-22).

## 4. Teste e documente

Um caso em `packages/core/test` para a matriz padrão e para a validação (`validateMatrixChange`), se a permissão for obrigatória ou administrativa. Atualize [Papéis e permissões](/referencia/permissoes) com a linha nova. Cite o código RN no comentário, se a regra for nova, e registre o código em [Regras de negócio](/referencia/regras-de-negocio).

## Veja também

- [Papéis e permissões](/referencia/permissoes)
- [Pull requests](/contribuindo/pull-requests): o checklist lembra a matriz personalizada.
