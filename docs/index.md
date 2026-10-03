---
layout: home

hero:
  name: Rizoma
  text: O catálogo fechado das APIs da sua empresa
  tagline: A documentação OpenAPI de todos os serviços num lugar só, por ambiente, com login da empresa, times, integrações, segredos e o mapa de quem depende de quem. Código aberto, gratuito e auto-hospedado.
  image:
    src: /logo.svg
    alt: Rizoma
  actions:
    - theme: brand
      text: Começar em 5 minutos
      link: /guia/inicio-rapido
    - theme: alt
      text: O que é o Rizoma?
      link: /guia/o-que-e
    - theme: alt
      text: Passo a passo
      link: /receitas/

features:
  - icon: 📚
    title: Um catálogo para todas as APIs
    details: Swagger 2.0, OpenAPI 3.0 e 3.1 renderizados num só lugar, com busca, tags, histórico de versões e o time responsável por cada serviço.
    link: /uso/catalogo
    linkText: Ver o catálogo
  - icon: 🔒
    title: Fechado para quem é de fora
    details: Login por GitHub, Google, Microsoft, GitLab, Facebook, OIDC (Keycloak, Okta…) ou e-mail e senha. Quem comprova vínculo com a empresa entra direto; o resto pede acesso.
    link: /instalacao/provedores-de-login
    linkText: Formas de login
  - icon: 🌱
    title: Um contrato por ambiente
    details: Dev, homologação, produção ou os nomes que fizerem sentido. O CI publica a spec e o hub descobre o ambiente pela branch.
    link: /receitas/ambientes-por-branch
    linkText: Ambientes por branch
  - icon: 🚀
    title: Publicação pelo CI
    details: Um passo no GitHub Actions, GitLab CI ou qualquer pipeline com curl. Também lê a spec do repositório, de uma URL interna ou por importação manual.
    link: /receitas/publicar-pelo-github-actions
    linkText: Publicar pelo CI
  - icon: 🕸️
    title: Mapa de ligações
    details: Serviços, integrações externas, repositórios e times num grafo interativo — e em tabela navegável por teclado. Descubra o impacto de uma mudança antes de fazê-la.
    link: /uso/mapa
    linkText: Explorar o mapa
  - icon: 🔑
    title: Variáveis e segredos por ambiente
    details: Segredos cifrados com AES-256-GCM, revelação registrada na auditoria, download do .env e cópia entre ambientes.
    link: /uso/variaveis
    linkText: Variáveis de ambiente
  - icon: 🛡️
    title: Papéis, permissões e auditoria
    details: OWNER, ADMIN, MAINTAINER e VIEWER com matriz de permissões editável. Toda ação administrativa fica registrada e pode ser exportada em CSV.
    link: /referencia/permissoes
    linkText: Papéis e permissões
  - icon: 🧭
    title: Instalação guiada, sem editar banco
    details: Um assistente de 10 etapas configura banco, login, e-mail, organização, repositórios, regras de acesso, ambientes e o primeiro administrador.
    link: /instalacao/assistente
    linkText: Assistente de instalação
  - icon: 🤝
    title: Aberto para contribuições
    details: Next.js, React, Prisma e PostgreSQL num monorepo TypeScript com regras de negócio puras e testadas. Veja como foi pensado e como ajudar.
    link: /contribuindo/
    linkText: Como contribuir
---

<div class="vp-doc" style="max-width: 960px; margin: 64px auto 0; padding: 0 24px;">

## Por que existe

Muitos times expõem o Swagger de cada serviço em `/docs`. Isso tem dois custos: alguém precisa apresentar serviço por serviço a cada pessoa nova, e contratos internos ficam públicos na internet. O Rizoma junta tudo num único lugar fechado, onde quem é da empresa encontra todas as APIs, entende quem é dono de cada uma e como elas se ligam. [Entenda a proposta →](/guia/o-que-e)

![Catálogo do Rizoma](/prints/04-catalogo.png)

## Rodando em 3 comandos

```bash
cp .env.example .env
node scripts/generate-keys.mjs   # cole ENCRYPTION_KEY e AUTH_SECRET no .env
docker compose --profile app up -d --build
# abra http://localhost:3000 e siga o assistente
```

Detalhes, requisitos e o caminho de desenvolvimento em [Início rápido](/guia/inicio-rapido).

</div>
