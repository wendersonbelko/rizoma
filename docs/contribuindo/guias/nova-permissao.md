---
description: Como acrescentar uma permissão ao Rizoma sem quebrar a matriz de quem já personalizou os papéis.
---

# Criar uma permissão

Permissões vivem em `packages/core/src/rbac.ts`, na lista `PERMISSION_DEFS`. A tela [Permissões](/admin/permissoes) e a função `buildMatrix` leem essa lista. Não espalhe strings soltas.

## 1. Declare

Cada item tem `id` no formato `recurso:acao`, `group` (Catálogo, Variáveis de ambiente, Serviços ou Administração) e `label` em português, como a pessoa vê na matriz.

- `required: true` só para o que ninguém pode desmarcar. Hoje é apenas `catalog:read`.
- `sensitive: true` para o que só o Administrador (`ADMIN`) pode receber, além do Proprietário (`OWNER`), que tem tudo. A validação recusa dar isso ao Mantenedor (`MAINTAINER`) ou ao Leitor (`VIEWER`).

## 2. Dê o padrão

Inclua o id em `DEFAULT_MATRIX` nos papéis que devem nascer com ela. O Proprietário (`OWNER`) recebe todas via `ALL_PERMISSIONS`; não precisa listar.

Quem **já salvou** uma matriz no banco não herda a permissão nova: `buildMatrix` usa as linhas gravadas e só força OWNER e as obrigatórias. Diga isso nas notas da versão. Se a permissão tiver de valer para instalações já personalizadas, uma migração insere a linha em `RolePermission`. Caso contrário, a pessoa administradora marca na tela.

## 3. Use no servidor

Na página e na action, `requirePermission("recurso:acao")`. Esconder o botão é cortesia, não controle. Rota administrativa sem a permissão responde como inexistente.

Se a ação vale só para o time do serviço, use `canManageService` em vez de checar a permissão sozinha (RN-22).

Se a permissão abre uma tela, use-a também no `visible` do item de `HUB_NAV` (`packages/core/src/hub-nav.ts`): a página lê a mesma regra, então o menu nunca mostra um item que leva a um 404. Se ela libera um cadastro que aparece no **+ Novo** e na busca **⌘K**, use-a no `visible` do atalho em `CREATE_SHORTCUTS` (`create-shortcuts.ts`). Esconder o item ou o atalho não é autorização: a Server Action confere de novo. Veja [Criar uma tela nova](/contribuindo/guias/nova-tela).

## 4. Teste e documente

Um caso em `packages/core/test` para a matriz padrão e para a validação (`validateMatrixChange`), se a permissão for obrigatória ou administrativa. Se ela mexe na visibilidade do menu ou dos atalhos, acrescente o caso em `hub-nav.test.ts` ou em `create-shortcuts.test.ts`. Atualize [Papéis e permissões](/referencia/permissoes) com a linha nova. Cite o código RN no comentário, se a regra for nova, e registre o código em [Regras de negócio](/referencia/regras-de-negocio).

## Veja também

- [Papéis e permissões](/referencia/permissoes)
- [Pull requests](/contribuindo/pull-requests): o checklist lembra a matriz personalizada.
