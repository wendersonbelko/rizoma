---
description: "Roteiro para receber uma pessoa nova no time: garantir o acesso, definir o papel, adicionar ao time, explicar o tour guiado e mostrar o que importa primeiro."
---

# Onboarding de uma pessoa nova

Chegou alguém novo no time e você quer que ela abra o hub, encontre as APIs certas e comece a contribuir no primeiro dia. Esta receita é um roteiro para quem recebe a pessoa (líder do time ou administrador): garantir o acesso, dar o papel certo, colocá-la no time, avisar do tour guiado obrigatório e mostrar o que vale ver primeiro.

```mermaid
flowchart LR
  A["1. Acesso"] --> B["2. Papel"] --> C["3. Time"] --> D["4. Tour"] --> E["5. Primeiros passos"]
```

## Antes de começar

- Você sabe o **usuário do GitHub** ou o **e-mail** da pessoa, o **time** dela e o **papel** que ela terá (na dúvida, VIEWER).
- Cada etapa exige uma permissão diferente. Com os papéis padrão, o ADMIN e o OWNER fazem tudo abaixo:
  - decidir pedidos de acesso: `access:decide`;
  - mudar papéis e convidar: `user:manage`;
  - montar times: `team:manage`.
- Se você é líder de um time mas não é administrador, faça o roteiro em parceria com quem administra: os passos 1 a 3 precisam dessas permissões.

## Passo a passo

### 1. Garanta o acesso

O caminho depende de como a sua empresa configurou o hub:

| Situação | O que fazer |
|---|---|
| **A empresa libera automaticamente** (organização do GitHub ou domínio de e-mail) | Nada. Mande o endereço do hub (`https://apihub.suaempresa.com`). Ao entrar, ela já fica ativa como **VIEWER**. Veja [Acesso automático para a empresa](/receitas/acesso-automatico-pela-organizacao). |
| **Todo acesso passa por aprovação** | Peça que ela entre. Em **Pessoas e acesso**, em **Pedidos aguardando**, escolha o papel e o prazo e clique em **Aprovar**. |
| **A pessoa não tem conta que o hub reconheça** | Clique em **Convidar usuário** em **Pessoas e acesso**, copie o link e envie pelo canal da empresa. Veja [Convidar por e-mail](/receitas/convidar-por-email). |

Enquanto o pedido não é decidido, a pessoa vê a tela "Pedido de acesso enviado" e pode escrever quem é e por que precisa (10 a 500 caracteres). O número no menu **Pessoas e acesso** mostra quantos pedidos esperam decisão.

### 2. Ajuste o papel

Em **Pessoas e acesso**, na tabela **Pessoas**, escolha o papel no seletor da linha e clique em **Salvar**:

- **VIEWER** (padrão): lê o catálogo, o mapa e as variáveis (segredos ocultos).
- **MAINTAINER**: para quem vai publicar specs, editar serviços, mexer em variáveis e gerar tokens de CI, **nos serviços dos times de que participa**.
- **ADMIN** só pode ser dado por um OWNER.

Mudar o papel encerra a sessão da pessoa, e ela entra de novo com o papel novo. Faça isso antes de ela começar a usar o hub. Se a sua empresa personalizou as permissões, confira o resultado em [Papel com permissões sob medida](/receitas/papel-personalizado).

### 3. Adicione a pessoa ao time

O papel diz **o que** ela pode fazer; o time diz **em quais serviços**.

1. Abra **Times** e vá até a seção do time.
2. No rodapé da tabela de membros, digite o usuário do GitHub ou o e-mail em **Usuário do GitHub ou e-mail** (`@fulano` ou `fulano@suaempresa.com`).
3. Escolha **Membro** ou **Líder** e clique em **Adicionar membro**.

Só pessoas com acesso **ativo** entram em times. Se ela ainda não entrou ou o pedido não foi aprovado, o hub responde que ela "ainda não tem acesso ativo ao hub".

Ser do time muda três coisas:

- Ela vê os serviços marcados como **Só o time responsável** desse time.
- Se for MAINTAINER, ela edita, publica e gera tokens **só** nos serviços do time.
- Para revelar segredos, ela precisa de `envvars:reveal` **e** ser do time do serviço.

::: info Líder é um rótulo
Hoje **Líder** aparece como selo e ordena a lista, mas não dá permissões extras. As permissões vêm só do papel e da participação no time.
:::

### 4. Avise sobre o tour guiado obrigatório

No primeiro acesso, o hub **bloqueia o uso** até a pessoa concluir um panorama no Catálogo: o menu inteiro, a parte de consulta, a parte de administração (se o papel dela mostrar) e a interrogação. **Concluir tour** libera o hub. Cada tela depois se ensina sozinha, pelo botão **?** dela.

Combine com ela reservar uns 10 minutos. Depois do tour, o botão **?** no canto da tela explica a tela atual e oferece **Iniciar tour desta tela** sempre que ela quiser rever. A conclusão fica na **Auditoria** ("Concluiu o tour guiado"). Veja [Primeiro acesso e tour](/uso/primeiro-acesso).

### 5. Mostre o que importa primeiro

Uma visita de 20 a 30 minutos, na ordem:

1. **Catálogo.** Mostre a busca ("Buscar por nome, slug ou descrição") e clique numa tag para filtrar. A coluna **Time** diz quem é dono de cada serviço, e a coluna **Ambientes** mostra a versão publicada em cada um. Comece pelos serviços do time dela.
2. **Página de um serviço do time.** Percorra as abas: **Documentação da API**, **Regras de negócio**, **Integrações**, **Variáveis de ambiente** e **Configurações**. Mostre o seletor de ambiente (a página abre em produção, com o escudo).
3. **Regras de negócio.** Abra a aba e mostre as páginas em Markdown que o time escreveu. É onde está o "porquê" da API.
4. **Mapa de ligações.** Clique no nó do time para focar nos serviços dele e ajuste **Distância** para ver quem depende de quem. **Mostrar tudo** volta à visão completa.
5. **Variáveis e segredos.** Explique que os valores comuns ficam visíveis, que os segredos só aparecem sob pedido e que cada revelação é registrada. Veja [Segredos, .env e cópia entre ambientes](/receitas/segredos-e-env).
6. **Como publicar.** Se ela é MAINTAINER, mostre a aba **Tokens** de **Serviços e repositórios** e a receita [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions).

### 6. Feche com o checklist

- [ ] A pessoa entrou e está **ativa** em **Pessoas e acesso**.
- [ ] O papel está correto (e ela entrou de novo depois da mudança).
- [ ] Ela aparece no time certo, em **Times**.
- [ ] Ela concluiu o tour guiado.
- [ ] Ela achou, no **Catálogo**, os três serviços que mais vai usar.
- [ ] Ela abriu o **Mapa de ligações** focado no time.
- [ ] Ela sabe onde pedir ajuda: o botão **?** e o time.
- [ ] Se for publicar specs: ela tem um token de CI (ou sabe quem gera) e conhece a receita de publicação.

## Como saber que deu certo

- Na tabela **Pessoas**, ela aparece como **ativo**, com o papel escolhido.
- Na seção do time, em **Times**, ela está na lista de membros.
- Em **Auditoria**, aparecem "Acesso aprovado…" (ou o login automático), "Papel alterado…" e "Concluiu o tour guiado".
- No catálogo, ela vê os serviços do time, inclusive os **Só o time responsável**.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| "… ainda não tem acesso ativo ao hub." ao adicionar ao time | A pessoa ainda não entrou ou o pedido não foi aprovado. Faça o passo 1 antes. |
| A pessoa vê "Pedido de acesso enviado" | O pedido está esperando decisão em **Pedidos aguardando**, ou a empresa não libera automaticamente. |
| Ela não vê um serviço que o time usa | O serviço é **Só o time responsável** e ela não está no time (passo 3). |
| Ela não consegue editar ou publicar | O papel é VIEWER, ou ela não é do time responsável pelo serviço. |
| Ela caiu na tela de login depois da mudança de papel | É esperado: mudar o papel encerra a sessão. Basta entrar de novo. |
| Ela não consegue fechar o tour | O panorama do primeiro acesso é obrigatório. Só **Concluir tour** libera o hub. |
| Ela não vê **Mapa de ligações** no menu | O papel dela não tem `graph:read` (matriz personalizada). |

## Veja também

- [Primeiro acesso e tour](/uso/primeiro-acesso): a experiência dela, do ponto de vista dela.
- [Times](/admin/times): montar e manter times.
- [Pessoas e acesso](/admin/pessoas-e-acesso): pedidos, papéis e suspensões.
- [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros): quando a pessoa nova é de fora.
