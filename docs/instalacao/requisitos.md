---
description: Versões de Node, pnpm, Docker e PostgreSQL, recursos sugeridos, regras de rede, domínio, HTTPS e as contas que você vai precisar criar.
---

# Requisitos

Esta página lista o que você precisa ter antes de instalar o Rizoma: software, banco de dados, servidor, rede, domínio e as contas nos provedores de login. Ela serve a quem vai instalar em produção e a quem vai desenvolver.

## Software

| Item | Versão | Para quê | Quando é necessário |
|---|---|---|---|
| Node.js | 22 ou superior | Rodar o app, os scripts e o Prisma | Desenvolvimento e geração das chaves. A imagem Docker já traz o seu próprio Node 22. |
| pnpm | 10 | Gerenciar o monorepo | Desenvolvimento |
| Docker Engine e Compose v2 | Recentes | Subir PostgreSQL, migração e app | Avaliação, produção e o banco do desenvolvimento |
| Git | Qualquer recente | Baixar o código e atualizar | Sempre |
| PostgreSQL | 16 ou superior | Banco de dados | Sempre (pelo Compose ou gerenciado) |

### Node.js e pnpm

O repositório declara `"node": ">=22"` e `pnpm@10.18.0` no `package.json`. A forma mais simples de ter o pnpm certo é o Corepack, que já vem com o Node:

```bash
node -v            # deve mostrar v22 ou superior
corepack enable
pnpm -v            # deve mostrar 10.x
```

O Corepack lê o campo `packageManager` do `package.json` e usa a versão do pnpm que o projeto pede. No Windows, o `corepack enable` pode exigir um terminal aberto como administrador.

::: tip Só vai rodar com Docker?
Para uma instalação em produção com Docker você não precisa do pnpm no servidor. O Node só é necessário para rodar `node scripts/generate-keys.mjs` e gerar as chaves, e essas chaves podem ser geradas em qualquer máquina.
:::

### Docker

Use o Docker Engine com o plugin Compose v2, ou seja, o comando `docker compose` (com espaço). O comando antigo `docker-compose` não é o alvo da documentação. Em Windows e macOS, use o Docker Desktop. No Windows, prefira o backend WSL 2.

## Banco de dados

O Rizoma usa **somente PostgreSQL** hoje, versão 16 ou superior. O compose e a integração contínua do projeto usam `postgres:16-alpine`.

O motivo é técnico: o modelo de dados usa arrays e JSON nativos do PostgreSQL. A etapa **Banco de dados** do assistente já lista MySQL, SQLite e SQL Server, mas como "Em breve". Veja o [roadmap](/arquitetura/roadmap).

Você pode usar:

- **O PostgreSQL do Compose** (`postgres:16-alpine`, volume `pgdata`): é o padrão e o mais simples.
- **Um PostgreSQL gerenciado** (RDS, Cloud SQL, Azure Database e semelhantes): veja [Usar um PostgreSQL gerenciado](/instalacao/docker) na página de Docker.

O usuário do banco precisa poder criar tabelas no schema `public`, porque as migrações rodam com ele.

## Recursos do servidor

::: warning Estimativa, não benchmark
Os números abaixo são um **ponto de partida** baseado no que o app precisa para funcionar. O projeto ainda não tem medições de carga. Comece pequeno, observe o uso real e ajuste.
:::

| Cenário | CPU | Memória | Disco |
|---|---|---|---|
| Avaliação na sua máquina | 2 vCPU | 4 GB | 5 GB livres |
| Produção pequena (dezenas de serviços, dezenas de pessoas), app e banco no mesmo servidor | 2 vCPU | 2 a 4 GB | 10 GB, mais o crescimento do banco |

Pontos que ajudam a dimensionar:

- **Construir a imagem consome mais memória** que rodar o app, porque o build do Next.js roda dentro do Docker. Se o servidor for pequeno, construa em outra máquina.
- **O disco cresce com as versões das specs.** Cada versão fica no banco, por serviço e por ambiente, com até 5 MB. Exemplo hipotético: 100 serviços, 3 ambientes, 50 versões cada e 300 KB por spec dão cerca de 4,5 GB. Faça a conta com os seus números e some o espaço dos backups.
- **O limite de requisições é em memória**, então o hub roda em **uma instância**. Escalar horizontalmente pede um armazenamento compartilhado para esse limite, que está no [roadmap](/arquitetura/roadmap).

## Rede

**Saída (do servidor para a internet), por HTTPS:**

| Destino | Para quê |
|---|---|
| `github.com` e `api.github.com` | Login com GitHub, checagem de organização, credenciais do OAuth App e leitura de repositórios |
| Endpoints do Google, da Microsoft, do GitLab e do Facebook | Login com cada provedor que você ativar |
| O emissor do seu OIDC (Keycloak, Okta, Auth0) | Login por OIDC. O hub lê `/.well-known/openid-configuration` |
| `gitlab.com` (ou o seu GitLab), `api.bitbucket.org` | Leitura de arquivos de repositório e validação de tokens |
| URLs das suas APIs | Só se você usar a origem "URL" para ler specs |

O hub só fala com o que você configurar. Não há chamada para um serviço do projeto.

**Entrada (da internet ou da rede da empresa para o servidor):**

| Porta | Quem acessa | Observação |
|---|---|---|
| `443` (HTTPS) | Pessoas da empresa e o CI | É a única porta que precisa ser alcançável. Fica no proxy reverso. |
| `80` (HTTP) | Redirecionamento para HTTPS | Necessária também para a emissão de certificados por HTTP-01, se você usar Let's Encrypt. |
| `3000` | Só o proxy | **Não** exponha o app diretamente. |
| `5432` | Só o app | **Não** exponha o PostgreSQL. No Compose ele já escuta só em `127.0.0.1`. |

Se o CI publica specs no hub, o servidor de CI precisa alcançar o seu domínio. Se o hub fica numa rede privada, o CI precisa estar nessa rede ou ter uma rota até ela.

A política de segurança do app (CSP) só permite imagens do próprio hub e de `avatars.githubusercontent.com`. Por isso, o navegador de cada pessoa precisa alcançar esse endereço para mostrar a foto do GitHub, e fotos de perfil de outros provedores não aparecem.

## Domínio e HTTPS

Em produção você precisa de:

- um **domínio ou subdomínio** só para o hub, por exemplo `apihub.suaempresa.com`;
- um **certificado HTTPS válido**, com renovação automática (Caddy e Traefik fazem isso sozinhos; com Nginx, use o Certbot);
- o `AUTH_URL` com essa URL pública.

O HTTPS não é opcional na prática: a maioria dos provedores de login só aceita URLs de callback `https://` (exceto `localhost`), e o hub envia o cabeçalho `Strict-Transport-Security`. Veja [HTTPS com proxy reverso](/instalacao/proxy-https).

## Contas e aplicativos que você vai criar

Cada forma de login que você ativar exige um aplicativo OAuth (ou um cliente OIDC) criado no provedor. O login por e-mail e senha não exige nada externo.

| Você vai usar | O que criar | Quem costuma poder criar |
|---|---|---|
| GitHub | Um OAuth App, de preferência na organização | Owner da organização no GitHub |
| Google | Credencial "ID do cliente OAuth" num projeto do Google Cloud, mais a tela de consentimento | Quem administra o projeto no Google Cloud |
| Microsoft | Um registro de aplicativo no Entra ID | Quem administra aplicativos no diretório |
| GitLab | Um aplicativo de usuário ou de grupo | Owner do grupo, ou admin do GitLab próprio |
| Facebook | Um app na Meta for Developers, com Login do Facebook | Quem tem conta de desenvolvedor Meta |
| OIDC | Um cliente OIDC no Keycloak, Okta, Auth0 ou similar | Quem administra o provedor de identidade |
| E-mail e senha | Nada | (não se aplica) |

Se você quer que o hub **leia arquivos de repositório** ou valide repositórios ao cadastrá-los, prepare também um **token só de leitura** no GitHub, GitLab ou Bitbucket. Ele é opcional: sem ele, as specs podem chegar pelo CI, por URL ou por importação manual.

O passo a passo de cada provedor está em [Provedores de login](/instalacao/provedores-de-login).

## Para quem vai contribuir com código

Além do que está acima, você vai precisar de um banco de testes separado para a suíte de integração e de um editor com suporte a TypeScript. Veja [Preparar o ambiente](/contribuindo/ambiente).

## Próximos passos

- [Variáveis de ambiente](/instalacao/variaveis-de-ambiente): o que cada variável faz e como gerar as chaves.
- [Produção com Docker](/instalacao/docker): suba o hub no servidor.
- [Desenvolvimento local](/instalacao/desenvolvimento-local): rode o código na sua máquina.
