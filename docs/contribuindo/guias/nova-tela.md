---
description: Passo a passo para acrescentar uma tela ao hub — menu, permissão, consulta, tabela padronizada, modal-padrão, ação, atalho e tour.
---

# Criar uma tela nova

Uma tela do hub é uma pasta em `apps/web/src/app/(hub)/`. A `page.tsx` busca dados e monta peças. Ela não desenha tabela, não pagina e não decide permissão no cliente. O desenho completo está em [Padrões de código](/contribuindo/padroes-de-codigo) e em [Interface](/arquitetura/interface).

## 1. Decida quem pode abrir e onde ela fica no menu

Se a tela é administrativa, a permissão já existe ou você cria uma em [Criar uma permissão](/contribuindo/guias/nova-permissao). Sem a permissão, a resposta é "não encontrada".

Uma tela que tem item no menu entra em `HUB_NAV`, em `packages/core/src/hub-nav.ts`, com quatro coisas:

- `href`, a rota da tela;
- `label`, **igual ao título da página** (o `<h1>`). A regra é uma só: item do menu é título da página;
- `group`: `explore` (**Explorar**), `registry` (**Cadastros**), `people` (**Pessoas**) ou `system` (**Sistema**);
- `visible`, a permissão que abre a tela.

A página usa a mesma regra como guarda. As páginas de cadastro chamam `requireNavAccess("/admin/exemplo")` (`admin/_registry/guard.ts`), que lê o `visible` do item; as demais começam com `requirePermission(...)`. Assim o menu nunca mostra um item que leva a um 404. O teste `packages/core/test/hub-nav.test.ts` confere os grupos, os destinos e a visibilidade por papel.

## 2. Separe os arquivos

```text
app/(hub)/admin/exemplo/
  page.tsx          # guarda, lê a URL, chama a query, compõe
  query.ts          # Prisma, filtro e visibilidade no SQL
  exemplo-table.tsx
  exemplo-row.tsx
  actions.ts        # "use server", se houver mutação
  forms/            # formulários de modal (Client Components)
```

Pasta com `_` não vira rota. Componente usado só aqui fica na pasta. Componente de várias telas vai para `apps/web/src/components`.

## 3. Use as peças prontas

Listagem tabular usa `DataTable`. Lista que não cabe em linha usa `CardList`. Vazio usa `EmptyState`, com a ação que tira do vazio. Paginação de dados do servidor usa `Pagination` e deixa `page` e `size` na URL. O teste `design-system.test.ts` falha se a tabela for HTML cru ou se a listagem não paginar.

A página tem o título e uma frase do que a tela guarda, com o botão que cria ao lado (as páginas de cadastro usam `RegistryHeader`). Página de detalhe leva um `Breadcrumb` ("Catálogo › serviço") no lugar de um link solto.

Criar ou editar uma entidade abre o modal-padrão, não um formulário na lista:

- `FormModal` envolve o formulário. O botão que abre tem o rótulo "Novo ..." e o modal tem o mesmo título. Dê um `id` ao modal (por exemplo, `new-exemplo`): é por ele que o endereço `/admin/exemplo#new-exemplo` abre o modal.
- O formulário é um Client Component e termina com `ModalActions`. O botão principal diz verbo e objeto ("Criar exemplo"), e **Cancelar** vem de graça, à esquerda. Use `useCloseOnSuccess` para fechar depois de salvar. Um modal que mostra um segredo (token, link) não fecha: chame `markClean` do `useModal()` e deixe o botão **Copiar**.
- Campos obrigatórios levam `*` no rótulo e começam vazios. Os opcionais ficam em **Detalhes opcionais**. Nome com endereço usa `NameSlugFields`, que mostra o slug em texto pequeno.
- Esc, clique fora, × e **Cancelar** já pedem confirmação se a pessoa digitou algo. Um campo que não conta como digitação leva `data-dirty-ignore`.

Edição de uma página inteira (não de um modal) usa `DirtyForm`: a barra **Alterações não salvas**, com **Descartar** e **Salvar**, só aparece quando algo mudou, e a página avisa antes de sair. Ação destrutiva vai numa `DangerZone`, no fim da página, com um `DangerAction` por ação: reversível pede confirmação simples e irreversível pede digitar o nome (`confirmText`). Remover uma linha que dá para recriar usa `UndoButton`, com **Desfazer**.

Se a tela é um cadastro que também deve aparecer no **+ Novo** e na busca **⌘K**, acrescente uma entrada em `CREATE_SHORTCUTS` (`packages/core/src/create-shortcuts.ts`) com o mesmo `id` do modal, a rota com `#id` e a permissão do botão de criar. `create-shortcuts.test.ts` confere que o destino é uma rota do hub.

Texto em português, maiúscula só no início do botão, datas com `pt-BR`.

## 4. Mutação

Formulário chama uma função de `actions.ts`. A função valida com Zod (esquema no `core` se a API também usar), chama `requirePermission` de novo, escreve no banco e registra com `audit()` quando a ação importa. Não confie no botão escondido.

Client Component não recebe função vinda de uma página de servidor. Passe dados. O estado do formulário fica no cliente; a ação fica no servidor.

## 5. Tour

O primeiro acesso é um panorama único no Catálogo e não percorre as telas do menu. Mesmo assim, toda tela do menu tem o próprio tour, aberto pelo botão **?**: acrescente uma entrada em `TOURS` (`apps/web/src/lib/tours.ts`) com pelo menos três passos, e marque no JSX os elementos que ele destaca, com `tour="..."` ou `data-tour="..."` literal (um atributo montado por variável não passa no teste). Só destaque o que existe na tela aberta por padrão. O teste `apps/web/test/unit/tours.test.ts` confere que toda tela do `HUB_NAV` tem tour e que cada seletor existe. Veja [Testes](/contribuindo/testes).

## 6. Documentação

Se a tela muda o que uma pessoa administradora faz, acrescente ou ajuste a página em `docs/admin/` ou `docs/uso/` e rode `pnpm docs:build`. O nome na documentação é o nome do título na tela, que é também o nome do item do menu.

## Veja também

- [Padrões de código](/contribuindo/padroes-de-codigo)
- [Testes](/contribuindo/testes)
- [Esta documentação](/contribuindo/documentacao)
