---
description: Os três níveis de teste do Rizoma, como rodar um arquivo só, o que os testes-guarda verificam e o que o CI e a revisão esperam de um PR.
---

# Testes

O Rizoma usa o Vitest em três níveis: regras puras no `core`, testes-guarda de padrões no `web` e testes de integração contra um PostgreSQL real. Esta página é para quem vai escrever ou consertar código e precisa saber qual teste escrever, como rodá-lo e o que fazer quando um guarda falha.

## Os três níveis

| Nível | Onde | Precisa de banco | O que cobre |
|---|---|---|---|
| Unitários do `core` | `packages/core/test/*.test.ts` | Não | Regras puras: permissões, política de acesso, specs, ambientes, paginação, textos, temas, menu. |
| Unitários do `web` e guardas | `apps/web/test/unit/*.test.ts` | Não | `design-system.test.ts` e `tours.test.ts`: garantem que o código segue os padrões da interface. |
| Integração | `apps/web/test/integration/*.test.ts` | Sim (`TEST_DATABASE_URL`) | Server Actions e rotas de API com o Prisma real: acesso, administração, funcionalidades, publicação de specs. |

Quanto mais embaixo na lista, mais barato e rápido o teste. Coloque a verificação no nível mais barato que a alcança: uma regra de permissão testa-se no `core`, não subindo o banco.

```bash
pnpm typecheck            # tipos, inclusive dos testes
pnpm test                 # unitários do core e do web
pnpm test:integration     # integração (precisa de TEST_DATABASE_URL)
```

Para configurar o banco de teste, veja [Preparar o ambiente](/contribuindo/ambiente) (seção "Testes de integração e o banco separado").

## Testes do `core`

O `core` não importa Prisma, Next.js nem React, então o teste é só entrada e saída. Os nomes dos casos descrevem o comportamento, em pt-BR:

```ts
import { describe, expect, it } from "vitest";
import { canManageService, defaultSubject } from "../src/rbac";

describe("permissões", () => {
  it("editar serviço exige o time, salvo service:edit_any", () => {
    const dev = defaultSubject("MAINTAINER", ["t1"]);
    expect(canManageService(dev, { ownerTeamId: "t1" })).toBe(true);
    expect(canManageService(dev, { ownerTeamId: "t2" })).toBe(false);
    expect(canManageService(defaultSubject("ADMIN"), { ownerTeamId: "t2" })).toBe(true);
  });
});
```

Boas práticas que os testes existentes seguem:

- Um `describe` por função ou assunto, um `it` por comportamento.
- Cubra o caminho feliz **e** os limites: entrada inválida, lista vazia, valor na borda (`pageInfo(0, …)`, uma página além da última).
- Sem relógio nem aleatoriedade escondidos: passe datas e valores como argumento.
- Use os atalhos do próprio `core`, como `defaultSubject(role, teamIds)`, para montar uma pessoa com as permissões padrão.

## Guardas do `web`

Dois testes do `web` não verificam uma função: verificam o **código-fonte** de `apps/web/src`. Eles existem para que um padrão combinado não se perca com o tempo. Se um deles falhar, a mensagem lista os arquivos ou telas culpados.

### `design-system.test.ts`

Percorre todos os `.ts` e `.tsx` de `apps/web/src` (exceto `components/table.tsx` e `components/card-list.tsx`, que definem os padrões) e verifica três coisas:

| Verificação | Como satisfazer |
|---|---|
| Nenhuma tela monta `<table>`, `<thead>` ou `<tbody>` à mão | Use `DataTable`, `THead`, `Th`, `TBody`, `Tr` e `Td` de `components/table.tsx`. |
| Nenhuma tela usa a classe `divide-y divide-line` à mão | Use `DataTable` (linhas de tabela) ou `CardList` (itens ricos). |
| Toda `DataTable` recebe `pagination={...}` | Passe `<Pagination …/>` (dados do servidor) ou `<ClientPagination …/>` (lista em memória). |

O terceiro caso tem uma exceção para tabelas de **tamanho fixo**: a matriz de permissões (uma linha por permissão do sistema), os endereços de uma integração (uma linha por ambiente) e as migrações mostradas no assistente. Elas ficam registradas em `FIXED_SIZE_TABLES`, com o motivo num comentário. Só acrescente uma exceção se a lista realmente não cresce com o uso, e explique o motivo no comentário, porque a revisão vai perguntar.

### `tours.test.ts`

Garante que toda tela do menu tem um tour guiado que funciona. Quatro verificações:

| Verificação | Como satisfazer |
|---|---|
| Toda tela de `HUB_NAV` tem um tour com **pelo menos 3 passos** | Acrescente a tela em `TOURS`, em `apps/web/src/lib/tours.ts`, usando o mesmo `href` como chave. |
| `resolveTourKey` resolve a rota dinâmica do serviço e recusa a de edição | Se você mexer em `DYNAMIC_TOURS`, mantenha o comportamento coberto. |
| `getTour` devolve `null` para chave desconhecida, sem lançar erro | Não mude o contrato de `getTour`. |
| Todo seletor `[data-tour="..."]` usado nos tours existe no código de `src/` | Ponha `data-tour="id"` (ou a prop `tour="id"` dos componentes padrão) no elemento. Um passo sem `selector` é aceito. |

O guia [Criar uma tela nova](/contribuindo/guias/nova-tela) mostra o caminho completo.

### O guarda do menu, no `core`

O teste `packages/core/test/hub-nav.test.ts` tem um mapa `PAGE_GUARD` que replica a permissão que cada página exige. Ele confere que o tour obrigatório nunca leva alguém para uma tela que a própria página recusaria. **Ao acrescentar uma tela ao `HUB_NAV`, acrescente a linha correspondente em `PAGE_GUARD`** e atualize as listas fixas de rotas por papel (Leitor, Mantenedor, Admin) se a tela aparecer para eles.

## Testes de integração

Rodam as Server Actions e as rotas de API de verdade, contra um PostgreSQL com as migrações aplicadas. Cada arquivo em `apps/web/test/integration/` cobre uma área: `access`, `admin`, `features` e `ingest`.

### O que o `setup.ts` faz

O arquivo `apps/web/test/integration/setup.ts` roda antes de tudo:

- **Exige `TEST_DATABASE_URL`** e se recusa a rodar se a URL contiver "prod".
- Copia a URL para `DATABASE_URL`, gera uma `ENCRYPTION_KEY` aleatória e define `AUTH_URL`.
- Substitui o que só existe dentro de uma requisição do Next: `revalidatePath` vira um `vi.fn()`, `redirect` lança `NEXT_REDIRECT:<destino>`, `notFound` lança `NEXT_NOT_FOUND` e `headers()` devolve um IP fixo.
- **Antes de cada teste, faz `TRUNCATE` de todas as tabelas** listadas em `TABLES`, com `CASCADE`. Por isso o banco de teste é descartável.

::: warning Tabela nova, lista nova
Se você criar um modelo no Prisma, acrescente o nome da tabela na lista `TABLES` do `setup.ts`. Sem isso, os dados vazam de um teste para o outro.
:::

Os arquivos rodam um de cada vez (`fileParallelism: false`), com limite de 20 segundos por teste.

### O que o `helpers.ts` oferece

| Função | O que faz |
|---|---|
| `install(data?)` | Cria os ambientes `dev`, `hml` e `prod` e uma instalação concluída da organização "Acme". |
| `makeUser(login, data?)` | Cria uma pessoa ativa com o papel `VIEWER` (ou o que você passar). |
| `asCurrent(userId)` | Monta o `CurrentUser` com as permissões do papel, como o `requireUser` faria. |
| `fakeGithub({ members, revoked })` | Simula a API de organizações do GitHub para os testes de vínculo. |

### Como testar uma ação

Os testes trocam o módulo `@/lib/guards` por uma versão que usa a pessoa "logada" da vez, mas com a mesma regra `can()` do produto. Depois importam a ação e a chamam com um `FormData`:

```ts
let current: CurrentUser | null = null;
vi.mock("@/lib/guards", () => ({
  requireUser: async () => { if (!current) throw new Error("NEXT_REDIRECT:/login"); return current; },
  requirePermission: async (p: Parameters<typeof can>[1]) => {
    if (!current) throw new Error("NEXT_REDIRECT:/login");
    if (!can(current, p)) throw new Error("NEXT_NOT_FOUND");
    return current;
  },
}));

const { decideAccessRequest } = await import("@/app/(hub)/admin/people/actions");

it("VIEWER não chega na ação", async () => {
  await install();
  current = await asCurrent((await makeUser("leitor")).id);
  await expect(decideAccessRequest(form({ requestId: "x", decision: "approve" }))).rejects.toThrow("NEXT_NOT_FOUND");
});
```

Num bom teste de integração de uma ação administrativa você confere quatro coisas: que quem pode consegue, que quem não pode recebe `NEXT_NOT_FOUND`, que o **banco** ficou como esperado e que a **auditoria** registrou a ação (e não guardou nenhum segredo). Rotas de API são chamadas direto: `POST(new Request("http://hub.test/api/v1/specs", { … }))`.

## Rodar um arquivo só

Os comandos abaixo rodam na raiz. O `exec` executa o Vitest do pacote escolhido.

```bash
# um arquivo do core
pnpm --filter @api-hub/core exec vitest run test/rbac.test.ts

# um arquivo unitário do web
pnpm --filter @api-hub/web exec vitest run --config vitest.unit.config.ts test/unit/tours.test.ts

# um arquivo de integração (com TEST_DATABASE_URL definida)
pnpm --filter @api-hub/web exec vitest run --config vitest.integration.config.ts test/integration/access.test.ts

# só os testes cujo nome contém um trecho
pnpm --filter @api-hub/core exec vitest run test/rbac.test.ts -t "editar serviço"

# modo observação: reroda ao salvar
pnpm --filter @api-hub/core exec vitest
```

::: tip No web, passe sempre o --config
Os testes unitários e os de integração têm configurações diferentes (`vitest.unit.config.ts` e `vitest.integration.config.ts`). Sem a opção, o Vitest usa a configuração padrão, sem o alias `@/` e sem o `setup.ts` da integração, e os testes quebram.
:::

## O que o CI roda

O workflow `.github/workflows/ci.yml` roda em todo pull request e em todo push na `main`, com um PostgreSQL 16 como serviço:

1. `pnpm install --frozen-lockfile`
2. `pnpm --filter @api-hub/db generate`
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm test`
6. `pnpm db:deploy` (as mesmas migrações da produção)
7. `pnpm test:integration`

O CI **não** roda `pnpm build` nem o build da documentação. Rode os dois na sua máquina quando a mudança tocar rotas, configuração do Next ou `docs/`.

## O que esperamos num pull request

- **Regra nova, teste novo.** Uma regra de negócio entra com teste no nível mais barato possível. Se ela envolve banco ou permissão numa ação, cubra também na integração.
- **Bug corrigido, teste que o pegue.** O teste falha antes da correção e passa depois.
- **Atualize os guardas quando o padrão muda de propósito.** Nova tela no menu: tour e `PAGE_GUARD`. Nova tabela no banco: `TABLES`. Nova permissão: teste em `rbac.test.ts`.
- **Não desligue um teste para o PR passar.** Nada de `it.skip` ou de apagar uma verificação incômoda. Se o teste está errado, corrija-o e explique no PR.
- **Rode tudo antes de abrir:** `pnpm lint`, `pnpm typecheck`, `pnpm test` e, se mexeu em banco, acesso ou publicação de specs, `pnpm test:integration`.

Veja o checklist completo em [Pull requests e releases](/contribuindo/pull-requests).

## Veja também

- [Preparar o ambiente](/contribuindo/ambiente)
- [Padrões de código](/contribuindo/padroes-de-codigo)
- [Criar uma tela nova](/contribuindo/guias/nova-tela)
- [Criar uma permissão](/contribuindo/guias/nova-permissao)
