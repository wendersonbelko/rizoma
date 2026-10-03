---
description: "Como editar, pré-visualizar e publicar este site — VitePress, pnpm docs:dev, DOCS_REPO, DOCS_BASE e o workflow do GitHub Pages."
---

# Esta documentação

O site que você está lendo fica em `docs/` e é gerado com VitePress. O aplicativo do hub não serve estas páginas: elas vão para o GitHub Pages.

## Editar uma página

Cada página tem **Editar esta página no GitHub**. O link abre o arquivo em `docs/` na branch `main` do repositório. Correção pequena pode ir direto por lá. Mudança maior segue o fluxo de [pull request](/contribuindo/pull-requests).

O menu, a busca e o rodapé estão em `docs/.vitepress/config.mts`. Uma página nova só aparece no menu se entrar no array da seção correspondente (`guia`, `receitas`, `referencia`, `arquitetura` ou `contribuindo`). O endereço da página é o caminho do arquivo sem `.md`: `docs/referencia/faq.md` vira `/referencia/faq`.

Toda página começa com `description` no frontmatter. Esse texto alimenta a busca e o resumo. Links internos usam o caminho absoluto do site (`/guia/inicio-rapido`), sem o nome do repositório: o `base` do VitePress acrescenta o prefixo do GitHub Pages.

## Ver localmente

Na raiz do repositório:

```bash
pnpm docs:dev
```

O VitePress sobe com recarregamento. `pnpm docs:build` gera o site em `docs/.vitepress/dist` e **falha se houver link interno quebrado**. Rode o build antes de abrir o pull request: o workflow de publicação não roda no PR, só depois do merge na `main`.

`pnpm docs:preview` serve o resultado do build.

## Onde o site é publicado

O workflow `.github/workflows/docs.yml` publica a cada push na `main` que altere `docs/` ou o próprio workflow. No GitHub, em **Settings → Pages → Build and deployment**, a origem precisa ser **GitHub Actions** (uma vez só).

`DOCS_REPO` (`dono/nome`) define o link do GitHub, o "Editar esta página" e, por padrão, o caminho `https://dono.github.io/nome/`. No workflow ele vem de `github.repository`. Fora do Actions, o padrão do config é `wendersonbelko/rizoma`. Num fork, defina a variável ao gerar o site.

`DOCS_BASE` sobrescreve o caminho. Use `/` quando o site estiver num domínio próprio (`docs.suaempresa.com`). Sem a variável, o caminho é `/<nome-do-repositório>/`.

```bash
DOCS_REPO=minha-org/api-hub DOCS_BASE=/ pnpm docs:build
```

Os links "Como configurar o CI" **dentro do aplicativo** não usam estas variáveis. Eles usam `NEXT_PUBLIC_DOCS_URL`, lida no build do Next. Veja [Variáveis de ambiente](/instalacao/variaveis-de-ambiente).

## Figuras

Imagens públicas ficam em `docs/public/` e são citadas como `/logo.svg` ou `/prints/04-catalogo.png`. O Markdown não leva o `base`: o VitePress prefixa.

## O que não fazer

- Não copie trechos longos de código que vão apodrecer. Aponte o arquivo e explique a regra.
- Não documente comportamento que o código não tem. Se a página e o código divergirem, o código ganha, e a página é corrigida no mesmo PR.
- Nomes de botões e telas precisam bater com a interface. Se você renomear um, atualize a página e o tour.

## Veja também

- [Comandos (CLI)](/referencia/cli): `docs:dev`, `docs:build` e `docs:preview`.
- [Pull requests](/contribuindo/pull-requests): o checklist pede o build da documentação.
