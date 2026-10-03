---
description: Rode o Rizoma na sua máquina em poucos minutos, com Docker para avaliar ou com pnpm para desenvolver, e veja o hub cheio de dados de demonstração.
---

# Início rápido

Esta página leva você de zero a um Rizoma funcionando em `http://localhost:3000`. Há dois caminhos: **A**, para avaliar o produto com Docker em cerca de 5 minutos, e **B**, para rodar o código e desenvolver. Escolha um, depois popule o hub com dados de demonstração.

::: warning Só para avaliar
Estes passos usam senhas e URLs de exemplo e não colocam o hub atrás de HTTPS. Para uma instalação de verdade, siga [Produção com Docker](/instalacao/docker).
:::

## Antes de começar

| Caminho | Você precisa de |
|---|---|
| **A. Avaliar com Docker** | Git, Docker com Compose v2 e Node 22 ou superior (só para gerar as chaves) |
| **B. Desenvolver** | Git, Node 22 ou superior, pnpm 10 e Docker (para o PostgreSQL) |

Mais detalhes, como recursos e portas, em [Requisitos](/instalacao/requisitos).

## A. Avaliar com Docker (5 minutos)

### 1. Baixe o código

```bash
git clone https://github.com/wendersonbelko/rizoma.git
cd rizoma
```

### 2. Crie o arquivo `.env`

::: code-group

```bash [Linux / macOS / Git Bash]
cp .env.example .env
```

```powershell [PowerShell]
Copy-Item .env.example .env
```

:::

### 3. Gere as chaves e cole no `.env`

```bash
node scripts/generate-keys.mjs
```

O comando imprime duas linhas. Copie os valores para as variáveis de mesmo nome no `.env`, entre aspas:

```bash
ENCRYPTION_KEY="valor-gerado-aqui"
AUTH_SECRET="valor-gerado-aqui"
```

Deixe `AUTH_URL="http://localhost:3000"` como está. Guarde essas duas chaves: sem a `ENCRYPTION_KEY`, os segredos salvos no banco não podem ser lidos.

### 4. Suba o hub

```bash
docker compose --profile app up -d --build
```

A primeira execução constrói a imagem e leva alguns minutos. O Compose sobe o PostgreSQL, aplica as migrações num container que termina sozinho (`migrate`) e só então inicia o app (`web`).

Confira se está tudo de pé:

```bash
docker compose --profile app ps
curl http://localhost:3000/api/health
```

O `web` deve aparecer como `healthy` e o `curl` deve responder `{"ok":true}`.

### 5. Abra o assistente

Abra `http://localhost:3000`. Como o hub ainda não está instalado, você cai no assistente de instalação. Para testar localmente, o caminho mais curto é o login por **E-mail e senha**, que não exige criar um aplicativo no GitHub, Google ou outro provedor.

| Etapa | O que fazer |
|---|---|
| 1. Bem-vindo | Leia o que ter em mãos e clique em **Continuar**. |
| 2. Banco de dados | O banco do Compose já está conectado. Clique em **Continuar**. |
| 3. Formas de login | Marque só **E-mail e senha** e clique em **Salvar e continuar**. |
| 4. E-mail | Clique em **Pular por enquanto**. Dá para configurar o SMTP depois. |
| 5. Organização | Informe o nome da empresa (por exemplo, `Acme`), um identificador (`acme`) e o título do sistema. |
| 6. Repositórios | Clique em **Continuar sem integração (CI, URL ou importação manual)**. |
| 7. Regras de acesso | Mantenha os valores padrão. |
| 8. Ambientes | Mantenha `dev`, `hml` e `prod`. |
| 9. Primeiro administrador | Em **Criar com e-mail e senha**, informe nome, e-mail e uma senha de pelo menos 12 caracteres. |
| 10. Revisar e concluir | Clique em **Concluir instalação**. |

Você vira o OWNER do hub. Como criou o administrador por e-mail e senha, o hub leva à tela de login: entre com o e-mail e a senha que acabou de criar. No primeiro acesso, o hub abre um tour obrigatório com a visão geral do menu. Cada tela depois se ensina pelo botão de interrogação.

Detalhes de cada etapa em [Assistente de instalação](/instalacao/assistente).

::: tip Comandos úteis
Ver os logs do app: `docker compose --profile app logs -f web`. Parar tudo, mantendo os dados: `docker compose --profile app down`. Apagar também os dados: `docker compose --profile app down -v`.
:::

## B. Rodar para desenvolver (pnpm)

Este caminho roda o Next.js na sua máquina, com recarga automática, e usa o Docker só para o PostgreSQL.

### 1. Instale as dependências

```bash
git clone https://github.com/wendersonbelko/rizoma.git
cd rizoma
corepack enable
pnpm install
```

### 2. Configure o ambiente

::: code-group

```bash [Linux / macOS / Git Bash]
cp .env.example .env
pnpm setup:keys            # cole ENCRYPTION_KEY e AUTH_SECRET no .env
cp .env apps/web/.env      # o Next lê o .env da pasta do app
cp .env packages/db/.env   # o Prisma lê o .env da pasta do pacote
```

```powershell [PowerShell]
Copy-Item .env.example .env
pnpm setup:keys            # cole ENCRYPTION_KEY e AUTH_SECRET no .env
Copy-Item .env apps/web/.env
Copy-Item .env packages/db/.env
```

:::

Cole as chaves no `.env` **antes** de copiá-lo para `apps/web` e `packages/db`. Se você mudar o `.env` depois, copie de novo.

### 3. Suba o banco, aplique as migrações e inicie o app

```bash
pnpm db:up       # PostgreSQL 16 e Mailpit no Docker, só em 127.0.0.1
pnpm db:deploy   # aplica as migrações que já vêm no repositório
pnpm dev         # http://localhost:3000
```

Abra `http://localhost:3000` e siga o assistente, como na tabela do caminho A. Passo a passo completo, portas, Prisma Studio e erros comuns em [Desenvolvimento local](/instalacao/desenvolvimento-local).

## Popular com dados de demonstração

Um hub vazio não mostra do que o produto é capaz. O comando de demonstração cria serviços, ambientes, integrações, variáveis e pedidos de acesso de exemplo.

### O que é criado

- 5 serviços com specs reais em vários ambientes (Pedidos, Pagamentos, Estoque, Frete legado e Notificações).
- 6 repositórios e 7 integrações externas, com endereço por ambiente.
- Variáveis de ambiente (com segredos cifrados) e páginas de regras de negócio em Markdown.
- 3 times (Pagamentos, Logística e Plataforma), 5 pessoas e 2 pedidos de acesso pendentes.

As pessoas de demonstração não têm senha nem conta vinculada, então **não conseguem entrar**. Você continua sendo a única pessoa com login.

### Antes de rodar

O comando recusa rodar se alguma destas condições falhar:

- A instalação precisa estar **concluída** pelo assistente.
- O hub precisa estar **sem nenhum serviço** cadastrado.
- `NODE_ENV` não pode ser `production`.
- A `ENCRYPTION_KEY` precisa estar disponível, porque os segredos de exemplo são cifrados como os reais.

Entre no hub pelo menos uma vez antes de rodar. O parâmetro `--me` procura uma pessoa que já existe, pelo usuário do GitHub ou pelo e-mail, e a coloca como líder do time Pagamentos. Se ninguém com esse login ou e-mail existir, o parâmetro é ignorado sem aviso.

### Rodar

::: code-group

```bash [Caminho A (Docker)]
docker compose --profile app run --rm migrate pnpm demo:seed --me fulano@suaempresa.com
```

```bash [Caminho B (pnpm)]
pnpm demo:seed --me fulano@suaempresa.com
```

:::

No caminho A, o comando roda dentro do container `migrate`, a mesma imagem que serve para o `admin:recover`: ela contém o código do repositório e as dependências, e recebe o `.env` e o banco do Compose.

Ao terminar, você vê:

```text
Demonstração criada: 5 serviços, 7 integrações externas, specs em vários ambientes, variáveis, regras de negócio, 3 times e 7 pessoas.
```

Atualize o catálogo e explore. O menu **Pessoas e acesso** mostra o selo com os 2 pedidos pendentes.

::: warning Nunca rode isto num hub de verdade
A demonstração só recusa `NODE_ENV=production` e hubs que já têm serviços. O container `migrate` do Docker não define `NODE_ENV=production`, então essa primeira trava **não** protege um hub de produção instalado com Compose. Use o comando apenas em instalações de avaliação.
:::

::: details O que acontece se eu quiser rodar de novo?
O comando recusa ("Já existem serviços cadastrados"). Para recomeçar, apague o banco e reinstale: no caminho A, `docker compose --profile app down -v`; no caminho B, veja [Desenvolvimento local](/instalacao/desenvolvimento-local).
:::

::: details Renomeei os ambientes no assistente
A demonstração procura os ambientes `dev`, `hml` e `prod`. Se você mudou esses identificadores, ela usa o último ambiente da lista como reserva, e as specs ficam todas nele.
:::

## Próximos passos

- [Primeiro acesso e tour](/uso/primeiro-acesso): o que você vê quando entra no hub.
- [Do zero ao primeiro serviço](/receitas/primeiro-servico): cadastre e publique o seu próprio serviço.
- [Provedores de login](/instalacao/provedores-de-login): troque o e-mail e senha por GitHub, Google ou o SSO da empresa.
- [Produção com Docker](/instalacao/docker): coloque o hub no ar de verdade, com HTTPS.
