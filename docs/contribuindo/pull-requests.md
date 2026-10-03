---
description: Nomes de branch, mensagens de commit, checklist do pull request, revisão, CI, merge e a proposta de versionamento e releases do Rizoma.
---

# Pull requests e releases

Esta página descreve o caminho de uma mudança até a `main`: como nomear a branch, escrever os commits, o que conferir antes de abrir o pull request, como funciona a revisão e como as versões são publicadas. É para quem vai contribuir com código ou documentação e para quem revisa.

::: info Convenção adotada a partir de agora
O projeto ainda não tinha um processo formal de commits e releases. Convenções de commit, revisão e versionamento descritas aqui são a **proposta adotada daqui para a frente**. Commits e versões anteriores não seguem necessariamente estas regras.
:::

## Antes de abrir o PR

1. **Combine antes de fazer.** Para mudanças que alteram comportamento, modelo de dados ou permissões, abra uma issue ou discussão primeiro. Correções pequenas e de documentação podem ir direto para o PR.
2. **Atualize o fork** para partir do estado atual da `main`:

```bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
```

3. **Crie a branch** com o nome `tipo/descricao-curta`, em minúsculas e com hífens. O tipo é o mesmo do commit:

| Branch | Para |
|---|---|
| `feat/filtro-por-tag` | Funcionalidade nova |
| `fix/paginacao-auditoria` | Correção de bug |
| `docs/guia-de-permissoes` | Documentação |
| `refactor/catalog-query` | Refatoração sem mudar comportamento |
| `test/regra-de-visibilidade` | Só testes |
| `chore/atualizar-vitest` | Manutenção, dependências, configuração |

Se houver uma issue, o número pode entrar no nome: `fix/123-paginacao-auditoria`.

## Mensagens de commit

Os commits seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/), com a descrição em pt-BR:

```text
tipo(escopo): descrição curta no infinitivo

Corpo opcional: explique o porquê da mudança, não o quê.

Refs #123
```

Exemplos:

```text
feat(catalog): adicionar filtro por tag na busca
fix(audit): corrigir contagem de registros com filtro de período
docs(guide): explicar o teste-guarda do design system
refactor(core): extrair a regra de visibilidade para uma função pura
test(rbac): cobrir matriz personalizada sem a permissão nova
chore(deps): atualizar o Vitest para a última versão 3.x
feat(api)!: renomear o campo environment da resposta de publicação
```

| Tipo | Quando usar |
|---|---|
| `feat` | Funcionalidade nova para quem usa o hub |
| `fix` | Correção de bug |
| `docs` | Só documentação |
| `refactor` | Mudança de código sem mudar comportamento |
| `test` | Acrescentar ou consertar testes |
| `perf` | Melhoria de desempenho |
| `build`, `ci`, `chore` | Build, pipelines e manutenção |

Escopos sugeridos, pela área do produto ou do código: `catalog`, `service`, `graph`, `integrations`, `variables`, `people`, `teams`, `permissions`, `audit`, `appearance`, `settings`, `login`, `setup`, `api`, `core`, `db`, `docs`, `ci`, `deps`.

Regras:

- Descrição em minúsculas, no infinitivo, sem ponto final, com até 72 caracteres.
- Um commit, uma ideia. Commits "wip" e "ajustes" são bem-vindos na sua branch, mas o merge é feito por *squash* (veja abaixo).
- **Mudança que quebra compatibilidade** leva `!` depois do tipo (`feat(api)!:`) e um rodapé `BREAKING CHANGE:` explicando o que muda e como migrar.
- Nunca inclua segredos, `.env` ou dados reais de clientes num commit.

O `commitlint` (`commitlint.config.mjs`) recusa a mensagem fora desse formato no hook `commit-msg`. O escopo é opcional; quando aparece, precisa ser um dos da tabela acima, mais `web` e `release`. O Husky (`.husky/pre-commit`) roda o ESLint nos arquivos que entram no commit e `pnpm test` antes de gravar o commit. Os dois também entram no CI. Sem um repositório Git, o hook ainda não dispara.

## Checklist do PR

O repositório traz um modelo de PR (`.github/PULL_REQUEST_TEMPLATE.md`) com este checklist. Marque só o que vale para a sua mudança:

- [ ] `pnpm typecheck` passa sem erros.
- [ ] `pnpm lint` passa.
- [ ] `pnpm test` passa.
- [ ] Rodei `pnpm test:integration` (obrigatório se mexi em banco, acesso, permissões ou publicação de specs).
- [ ] Escrevi ou atualizei testes para a regra nova ou o bug corrigido.
- [ ] Segui os [padrões de código](/contribuindo/padroes-de-codigo) e usei os componentes do design system.
- [ ] Se mudei uma **tela do menu**, atualizei o tour em `apps/web/src/lib/tours.ts`.
- [ ] Se mudei o **schema do banco**, criei uma migração e não editei nenhuma migração já publicada.
- [ ] Se criei uma **permissão**, pensei em quem já usa uma matriz personalizada (veja [Criar uma permissão](/contribuindo/guias/nova-permissao)).
- [ ] Atualizei a **documentação** (`docs/`) e rodei `pnpm docs:build` sem links quebrados.
- [ ] Anexei **prints** (claro e escuro, se couber) para mudanças visuais.
- [ ] Toda ação administrativa nova chama `audit()` e nenhuma mensagem, log ou auditoria expõe segredos.

::: tip Rode o build quando tocar em rotas ou configuração
O CI não roda `pnpm build`. Se sua mudança mexe em rotas, `next.config.ts` ou em algo que só quebra na compilação, rode `pnpm build` antes de abrir o PR.
:::

## Abrindo o PR

- **Título** no mesmo formato dos commits: `feat(catalog): adicionar filtro por tag`. O título vira a mensagem do commit no merge.
- **Descrição**: o que muda, por que muda, como testar e, se houver, a issue relacionada (`Closes #123`).
- **Prints** para toda mudança visual, com a tela antes e depois.
- **PR pequeno.** Um PR que faz uma coisa é revisado em minutos; um que faz dez fica parado. Se a mudança é grande, abra como *draft* cedo para receber direção.
- Não misture refatoração ampla com funcionalidade nova no mesmo PR.

## Revisão

Quem revisa olha, nesta ordem:

1. **O problema** está resolvido e o comportamento faz sentido para quem usa o hub?
2. **Segurança e acesso**: a checagem está no servidor, a entrada é validada, nada vaza para log ou auditoria?
3. **Padrões**: camadas certas, componentes do design system, textos em pt-BR num tom direto, comentários que explicam o porquê.
4. **Testes** que cobrem a regra, e guardas atualizados.
5. **Documentação** e tour em dia.

Como autor: responda a cada comentário (com uma correção ou uma explicação), envie commits novos na mesma branch e marque as conversas como resolvidas. Discordar é normal; explique seu raciocínio. Como revisor: seja específico e gentil, e distinga o que bloqueia o merge do que é sugestão. As regras do [Código de conduta](/contribuindo/codigo-de-conduta) valem aqui também.

## CI

Todo PR roda o workflow `ci` (`.github/workflows/ci.yml`) com um PostgreSQL 16: instala as dependências, gera o client do Prisma, roda `lint`, `typecheck`, `test`, aplica as migrações (`db:deploy`) e roda `test:integration`. O PR só é mesclado com o CI verde. Detalhes em [Testes](/contribuindo/testes).

Se o CI falhar, abra o log do passo que quebrou, reproduza o comando na sua máquina e corrija na mesma branch. Um CI instável (que passa e falha sem mudança) merece uma issue, não um "rerun" silencioso.

O site de documentação é publicado por outro workflow (`docs.yml`), só depois do merge na `main`. Ele **não** roda em pull requests, então links quebrados só aparecem lá. Por isso o checklist pede `pnpm docs:build` localmente. Veja [Esta documentação](/contribuindo/documentacao).

## Merge

- O merge é feito por quem mantém o projeto, com **Squash and merge**: todos os commits do PR viram um só na `main`, com o título do PR como mensagem. Por isso o título precisa seguir o formato de commit.
- Requisitos: CI verde, ao menos uma aprovação de quem mantém e conversas de revisão resolvidas.
- Depois do merge, a branch do PR pode ser apagada.

## Versionamento e releases

A partir de agora o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/) (`MAJOR.MINOR.PATCH`) e publica cada versão como uma tag `vX.Y.Z` com notas de versão no GitHub.

| Número | Sobe quando… | Exemplos |
|---|---|---|
| **MAJOR** | Algo deixa de ser compatível: a API HTTP (`/api/v1`), o formato da extensão `x-api-hub`, uma variável de ambiente, ou uma migração exige ação manual. | Renomear um campo da resposta de `POST /api/v1/specs`. |
| **MINOR** | Chega uma funcionalidade compatível. | Tela nova, permissão nova, forma de login nova, coluna nova com valor padrão. |
| **PATCH** | Correção sem mudança de comportamento previsto. | Bug de paginação, texto errado, ajuste de segurança compatível. |

Enquanto a versão for `0.x`, uma versão MINOR pode conter mudanças que quebram, desde que estejam destacadas nas notas.

### Como publicar uma versão

Quem mantém o projeto faz:

1. Confirme que a `main` está com o CI verde.
2. Suba o campo `version` para o mesmo número em `apps/web/package.json`, `packages/core/package.json`, `packages/db/package.json` e `docs/package.json`.
3. Faça o commit `chore(release): v0.2.0` e mescle-o.
4. Crie a tag anotada e envie:

```bash
git tag -a v0.2.0 -m "v0.2.0"
git push origin v0.2.0
```

5. No GitHub, crie o **Release** a partir da tag e cole as notas de versão.

### Notas de versão

Cada release traz estas seções, na ordem:

- **Destaques**: o que muda para quem usa, em duas ou três frases.
- **Novidades** e **Correções**: uma linha por item, com o número do PR.
- **Mudanças que quebram**: o que muda e como se adaptar. Vazio? Diga "Nenhuma".
- **Como atualizar**: migrações de banco (elas rodam sozinhas no container `migrate`), variáveis de ambiente novas e passos manuais.
- **Permissões novas**: se a versão traz uma permissão nova, diga a quem ela vale por padrão e que quem **personalizou a matriz** precisa habilitá-la em **Permissões**, a menos que uma migração faça isso. Veja [Criar uma permissão](/contribuindo/guias/nova-permissao).
- **Agradecimentos**: quem contribuiu.

O passo a passo de quem instala e atualiza está em [Atualização e backup](/instalacao/atualizacao-e-backup). Hoje o projeto não publica imagens nem pacotes prontos: quem instala compila a partir do código da tag. A versão mais recente é a única que recebe correções de segurança (veja [Reportar uma vulnerabilidade](/contribuindo/seguranca)).

## Veja também

- [Padrões de código](/contribuindo/padroes-de-codigo)
- [Testes](/contribuindo/testes)
- [Mudar o banco (migração)](/contribuindo/guias/migracao-de-banco)
- [Esta documentação](/contribuindo/documentacao)
