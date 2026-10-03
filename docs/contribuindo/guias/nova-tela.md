---
description: Passo a passo para acrescentar uma tela ao hub — pasta, permissão, consulta, tabela padronizada, ação e tour.
---

# Criar uma tela nova

Uma tela do hub é uma pasta em `apps/web/src/app/(hub)/`. A `page.tsx` busca dados e monta peças. Ela não desenha tabela, não pagina e não decide permissão no cliente. O desenho completo está em [Padrões de código](/contribuindo/padroes-de-codigo) e em [Interface](/arquitetura/interface).

## 1. Decida quem pode abrir

Se a tela é administrativa, a permissão já existe ou você cria uma em [Criar uma permissão](/contribuindo/guias/nova-permissao). A página começa com `requirePermission(...)`. Sem a permissão, a resposta é "não encontrada".

Inclua o item em `packages/core/src/hub-nav.ts` só para quem tem a permissão. O menu é a mesma lista que o tour percorre.

## 2. Separe os arquivos

```text
app/(hub)/admin/exemplo/
  page.tsx          # guarda, lê a URL, chama a query, compõe
  query.ts          # Prisma, filtro e visibilidade no SQL
  exemplo-table.tsx
  exemplo-row.tsx
  actions.ts        # "use server", se houver mutação
```

Pasta com `_` não vira rota. Componente usado só aqui fica na pasta. Componente de várias telas vai para `apps/web/src/components`.

## 3. Use as peças prontas

Listagem tabular usa `DataTable`. Lista que não cabe em linha usa `CardList`. Vazio usa `EmptyState`, com a ação que tira do vazio. Paginação de dados do servidor usa `Pagination` e deixa `page` e `size` na URL. O teste `design-system.test.ts` falha se a tabela for HTML cru ou se a listagem não paginar.

Texto em português, maiúscula só no início do botão, datas com `pt-BR`.

## 4. Mutação

Formulário chama uma função de `actions.ts`. A função valida com Zod (esquema no `core` se a API também usar), chama `requirePermission` de novo, escreve no banco e registra com `audit()` quando a ação importa. Não confie no botão escondido.

Client Component não recebe função vinda de uma página de servidor. Passe dados. O estado do formulário fica no cliente; a ação fica no servidor.

## 5. Tour

Se a tela entra no menu, marque os elementos que o tour destaca (`tour="..."`) e cubra o roteiro em `apps/web/test/unit/tours.test.ts`. O primeiro acesso percorre o que a pessoa enxerga. Veja [Testes](/contribuindo/testes).

## 6. Documentação

Se a tela muda o que uma pessoa administradora faz, acrescente ou ajuste a página em `docs/admin/` ou `docs/uso/` e rode `pnpm docs:build`. O nome na documentação é o nome do título na tela.

## Veja também

- [Padrões de código](/contribuindo/padroes-de-codigo)
- [Testes](/contribuindo/testes)
- [Esta documentação](/contribuindo/documentacao)
