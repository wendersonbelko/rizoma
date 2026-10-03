---
description: "Popule um hub de teste com serviços, times, pessoas, integrações, variáveis e pedidos de acesso de exemplo (pnpm demo:seed) para explorar todas as telas, e saiba como recomeçar do zero."
---

# Hub com dados de demonstração

Um hub recém-instalado está vazio, e isso torna difícil avaliar o catálogo, o mapa, as variáveis e a fila de aprovações. O comando `pnpm demo:seed` popula um hub de **teste** com dados de exemplo (cinco serviços, sete integrações externas, três times, sete pessoas, specs em vários ambientes e mais). Esta receita mostra como rodar, o que é criado, como explorar e, com honestidade, como recomeçar do zero. É para quem está avaliando o projeto.

::: warning Só para hubs de teste
Os dados de demonstração se misturam com os seus e **não há comando para removê-los**. Rode num banco descartável, nunca no hub que a sua equipe usa de verdade.
:::

## Antes de começar

- O hub está **instalado**: você concluiu o assistente em `/setup`. O comando recusa hubs não instalados.
- O hub **não tem nenhum serviço** (nem arquivado). O comando só roda num catálogo vazio.
- O comando não roda com `NODE_ENV=production`.
- Você tem o repositório clonado, `pnpm install` feito e o `.env` configurado (`DATABASE_URL` e `ENCRYPTION_KEY`). No desenvolvimento local, é o `.env` copiado para `packages/db`. Os segredos de exemplo são cifrados com a sua `ENCRYPTION_KEY`, como os reais. Veja [Desenvolvimento local](/instalacao/desenvolvimento-local).
- Os ambientes têm os identificadores padrão `dev`, `hml` e `prod` (os do assistente). Com outros nomes, os dados ainda são criados, mas todas as specs caem no **último** ambiente da lista.
- Você já **entrou no hub** ao menos uma vez, se quiser usar `--me`.

## Passo a passo

### 1. Prepare um banco de teste

Suba o hub de desenvolvimento ou o de avaliação com Docker e conclua a instalação. Se preferir, guarde uma cópia do banco antes de popular: o único jeito de desfazer é recomeçar (passo 5).

### 2. Rode o comando

Na raiz do repositório:

::: code-group

```bash [pnpm]
pnpm demo:seed --me seu-usuario-ou-email
```

```bash [Docker]
docker compose --profile app run --rm migrate pnpm demo:seed --me seu-usuario-ou-email
```

:::

O `--me` é opcional. Ele aceita o seu usuário do GitHub (com ou sem `@`) ou o seu e-mail, e coloca você como **líder do time Pagamentos**. A busca é exata: a pessoa precisa existir no hub. Sem `--me`, rode só `pnpm demo:seed`.

Ao terminar, o comando imprime:

```text
Demonstração criada: 5 serviços, 7 integrações externas, specs em vários ambientes, variáveis, regras de negócio, 3 times e 7 pessoas.
```

A variante Docker segue o mesmo padrão do `admin:recover`: roda dentro do contêiner de migração, que já tem o repositório e as dependências.

### 3. Conheça o que foi criado

| O que | Dados de exemplo |
|---|---|
| **Serviços** (5) | **Pedidos** (`pedidos`) e **Pagamentos** (`pagamentos`), do time Pagamentos; **Estoque** (`estoque`) e **Frete (legado)** (`frete`, descontinuado), da Logística; **Notificações** (`notificacoes`), da Plataforma. |
| **Times** (3) | **Pagamentos** (Joana líder, Lucas membro e, com `--me`, você líder), **Logística** (Pedro líder, Carla membro) e **Plataforma** (Rafael líder). |
| **Pessoas** (7) | Ativas: Rafael Souza (ADMIN), Joana Lima e Pedro Alves (MAINTAINER), Lucas Melo e Carla Nunes (VIEWER). Pendentes: Ana Prado (`@ana-consultoria`, sem vínculo, com justificativa de consultoria) e Bruno Rocha (`@bruno-estagio`, vínculo comprovado, sem justificativa). |
| **Specs** | **Pedidos** em `dev` (2.5.0-dev.14), `hml` (2.5.0-rc.1) e `prod` (2.4.0, com a 2.3.1 no histórico); **Pagamentos** em `prod` e `hml`; **Estoque** em `prod` e `dev`; **Notificações** e **Frete** em `prod`. |
| **Origens de spec** | **Estoque** lê um arquivo do repositório (`docs/openapi.yaml`); **Notificações** lê de uma URL com `{env}`; os demais são enviados pelo CI. |
| **Repositórios** (6) | `pedidos-api`, `pagamentos-api`, `estoque-api`, `notificacoes-worker`, `sdk-js` e `infra-terraform`, na sua primeira organização do GitHub aceita (ou `acme`). Os endereços são fictícios. |
| **Vínculos** | Serviço com repositório (código-fonte, SDK, infraestrutura), repositório com repositório e serviço com serviço. As dependências declaradas nas specs (`x-api-hub.dependsOn`) viram vínculos "consome": Pedidos consome Estoque, Pagamentos e Frete; Pagamentos consome Notificações. |
| **Integrações externas** (7) | Fila `pedidos-criados` (AWS SQS), Stripe, API Pix do banco, Webhook do app parceiro, PostgreSQL do checkout, Redis de reservas e SendGrid, com endereço por ambiente e ligadas aos serviços. |
| **Variáveis** | **Pedidos**: 7 em cada ambiente, incluindo os segredos `DATABASE_URL` e `PARCEIRO_WEBHOOK_SECRET`. **Pagamentos** em `prod`: 4, com `STRIPE_API_KEY` e `PIX_CLIENT_SECRET` secretos. Valores fictícios. |
| **Regras de negócio** | Duas páginas em Pedidos (**Regras de negócio** e **Glossário**) e uma em Pagamentos. |
| **Tokens e auditoria** | Dois tokens de exemplo (Pedidos e Estoque) e nove eventos de auditoria de exemplo. |
| **Repositório GitHub** | A integração de GitHub é criada sem token, só para a tela existir. |

As pessoas de exemplo **não têm senha nem conta vinculada e não conseguem entrar**. Elas existem para popular tabelas, times e o mapa.

## Completar um hub que já tem dados

O `pnpm demo:seed` recusa um catálogo que já tem serviço. Para somar pessoas que entram, frontends, workers e integrações públicas **sem apagar** o que está na tela, use:

```bash
pnpm demo:fill
```

O comando recusa produção. Ele procura o slug que já existe (por exemplo `pedidos-api` e `time-de-pedidos`) antes de criar outro. Não troca descrição de serviço nem a senha de quem não está na lista. Quem já é OWNER fica como está.

Entram 17 pessoas `nome.sobrenome@belko.com.br`, todas com a senha `Senha@Segura10`, ativas no login por e-mail. Também entram a Loja, o Painel de operação, o App do entregador, dois workers, a fila RabbitMQ `pedido.criado`, o PostgreSQL da loja, o Redis de sessão e as APIs públicas ViaCEP, BrasilAPI, Open-Meteo e IBGE. Os endereços internos não trazem senha. Rodar de novo não duplica.

### 4. Explore

Um roteiro para ver cada tela com dados:

1. **Catálogo:** os cinco serviços, com as versões de cada ambiente ao lado. Note o selo de descontinuado em **Frete (legado)** e as versões diferentes de **Pedidos** em `dev`, `hml` e `prod`.
2. **Página de Pedidos:** troque de ambiente no seletor, abra a **Documentação da API** e as versões anteriores, leia **Regras de negócio**, veja a fila e o banco em **Integrações**.
3. **Variáveis de ambiente** de Pedidos: os valores comuns aparecem e os segredos mostram **•••••• revelar**. Como OWNER, você consegue revelar. Depois abra a **Auditoria** e veja o evento "Segredo revelado". Baixe o `.env` e note os segredos em branco.
4. **Mapa de ligações:** clique em **Pedidos** para focar, aumente a **Distância** e alterne entre **Mapa** e **Lista**.
5. **Integrações externas:** as sete integrações, com o filtro por tipo.
6. **Pessoas e acesso:** decida os dois pedidos pendentes (**Aprovar** ou **Recusar**), veja o prazo em "Por 90 dias" e o **Histórico de decisões**.
7. **Times, Permissões, Auditoria e Aparência:** mexa à vontade. **Restaurar padrão** em **Permissões** desfaz o que você mudar.
8. **Papéis:** para ver o hub com outro papel, convide uma conta de teste (veja [Convidar por e-mail](/receitas/convidar-por-email)).

Dois limites: **Sincronizar agora** falha em **Estoque** e em **Notificações**, porque os endereços são fictícios. E os dois tokens de exemplo nunca tiveram o valor exibido; para testar a publicação, gere um token novo (veja [Do zero ao primeiro serviço](/receitas/primeiro-servico), usando o serviço `pedidos`).

### 5. Recomece do zero, se precisar

O comando **não roda de novo** sobre um catálogo que já tem serviços, e não existe um comando de limpeza. O único caminho é apagar o banco de teste, o que remove **tudo**: a instalação, as pessoas, as configurações e os dados.

::: danger Isto apaga o banco inteiro
Use só num banco de teste.
:::

No desenvolvimento local, com o Postgres do Docker Compose:

```bash
docker compose down -v      # remove o contêiner e o volume pgdata (todo o banco)
pnpm db:up                  # sobe um Postgres vazio
pnpm db:deploy              # aplica as migrações
```

Reinicie o `pnpm dev`, abra `http://localhost:3000` e refaça o assistente de instalação. Com o perfil `app`, use `docker compose --profile app down -v` e suba de novo com `docker compose --profile app up -d --build`. Com um Postgres próprio, apague e recrie o banco (ou aponte `DATABASE_URL` para outro) e rode `pnpm db:deploy`. Depois, `pnpm demo:seed` outra vez, se quiser.

## Como saber que deu certo

- O comando termina com a linha "Demonstração criada: …".
- O **Catálogo** mostra cinco serviços, e o **Mapa de ligações** mostra serviços, integrações, repositórios e times.
- **Pessoas e acesso** mostra dois pedidos em **Pedidos aguardando** e cinco pessoas ativas, além de você.
- **Times** lista Pagamentos, Logística e Plataforma (e você em Pagamentos, se usou `--me`).

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| "Não rode dados de demonstração em produção." | O shell tem `NODE_ENV=production`. Rode num ambiente de desenvolvimento. |
| "Conclua a instalação pelo assistente antes de popular a demonstração." | O hub ainda não está instalado. Termine o assistente. |
| "Já existem serviços cadastrados. A demonstração só roda num hub vazio." | Há ao menos um serviço, mesmo arquivado. Recomece do zero (passo 5). |
| "Nenhum ambiente configurado." | A instalação normalmente não termina sem ambientes. Se acontecer, o comando já criou pessoas, times e serviços antes de falhar: cadastre um ambiente em **Configurações → Ambientes** e recomece do zero. |
| Erro ao conectar ou ao cifrar segredos | `DATABASE_URL` ou `ENCRYPTION_KEY` não chegaram ao comando. No desenvolvimento local, confira o `.env` em `packages/db`. |
| Você não aparece como líder de Pagamentos | O `--me` não encontrou a pessoa (ela ainda não entrou, ou o texto difere do usuário ou e-mail salvo). O comando não avisa. Recomece do zero e informe o valor certo. |
| Todas as versões caíram no mesmo ambiente | Os identificadores dos ambientes não são `dev`, `hml` e `prod`. Os dados vão para o último da lista. |
| O comando falhou no meio | Pode ter criado parte dos dados. Recomece do zero. |

## Veja também

- [Início rápido](/guia/inicio-rapido): instalar e ter o hub no ar.
- [Do zero ao primeiro serviço](/receitas/primeiro-servico): o caminho com dados seus.
- [Comandos (CLI)](/referencia/cli): todos os comandos do repositório.
- [Desenvolvimento local](/instalacao/desenvolvimento-local): preparar o ambiente.
