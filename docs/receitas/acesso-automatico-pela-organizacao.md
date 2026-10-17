---
description: Libere direto quem é da empresa, pela organização do GitHub ou pelo domínio de e-mail (Google, Microsoft, GitLab, OIDC), com suspensão automática ao sair.
---

# Acesso automático para a empresa

Por padrão, todo mundo que entra no hub pede acesso e espera um administrador. Esta receita configura o que "ser da empresa" significa (organização do GitHub ou domínio de e-mail) e liga a liberação automática: quem comprova vínculo entra direto, como **Leitor**, e é suspenso sozinho se perder o vínculo. É para quem administra o hub.

## Antes de começar

- Você enxerga **Configurações** no menu (grupo **Sistema**). Com os papéis padrão, só o Proprietário tem essa permissão (`settings:manage`). Para promover papéis no fim, você também precisa de `user:manage` (Administrador e Proprietário têm).
- A forma de login que você vai usar já está criada no provedor: um OAuth App no GitHub, um cliente OAuth no Google ou na Microsoft, ou um cliente OIDC. Veja [Provedores de login](/instalacao/provedores-de-login) e, para o Keycloak, [Login com Keycloak (OIDC)](/receitas/login-com-keycloak).
- O `AUTH_URL` do hub aponta para o endereço público, porque as URLs de retorno (callback) são montadas com ele. Veja [Variáveis de ambiente](/instalacao/variaveis-de-ambiente).
- Você sabe o nome da organização no GitHub (por exemplo, `acme`) ou os domínios de e-mail da empresa (por exemplo, `suaempresa.com`).

### Como o hub decide

A cada login, e de novo a cada revalidação, o hub aplica esta regra:

```mermaid
flowchart TD
  A["Pessoa entra no hub"] --> B{"Comprova vínculo?"}
  B -- "sim" --> C{"Liberar automaticamente?"}
  C -- "sim" --> D["Ativa como Leitor"]
  C -- "não" --> E["Pendente: aguarda aprovação"]
  B -- "não" --> F{"Política para quem não comprova"}
  F -- "pedir acesso" --> E
  F -- "bloquear" --> G["Login recusado"]
```

## Passo a passo

### 1. Ligue a forma de login

Abra **Configurações → Conexões** (`?s=connections`) e vá até a seção **Formas de login**. Na linha de um provedor (por exemplo, **GitHub**), clique em **Ligar**, preencha **Client ID** e **Client secret** e clique em **Ligar forma de login**. O modal mostra a **URL de retorno (callback)** que você deve cadastrar no provedor, no formato `<AUTH_URL>/api/auth/callback/<id>`. Quando a forma já está ligada, o botão da linha é **Configurar**, e o do modal, **Salvar alterações**.

O GitHub e o OIDC são testados antes de salvar. O GitHub pede só os escopos `read:user`, `user:email` e `read:org`; o `read:org` é o que permite ao hub conferir a organização.

### 2. Diga o que conta como vínculo

Abra a aba **Organização e acesso** (`?s=organization`) e, no painel **Organização**, preencha:

- **Organizações do GitHub aceitas**: digite o nome de uma organização e clique em **+** (até 10). O campo só aparece depois que o GitHub está ligado como forma de login.
- **Domínios de e-mail da empresa**: digite um domínio, como `suaempresa.com`, e clique em **+** (até 20). Subdomínios contam: `time.suaempresa.com` casa com `suaempresa.com`.

Clique em **Salvar organização**. Cada forma de login comprova o vínculo de um jeito:

| Forma de login | O que comprova o vínculo |
|---|---|
| GitHub | Ser **membro ativo** de uma das organizações aceitas |
| Google | E-mail **verificado** de um domínio aceito (Google Workspace) |
| Microsoft | Conta do diretório informado em **Tenant (ID do diretório)** ou e-mail de um domínio aceito |
| GitLab | E-mail de um domínio aceito |
| OIDC (Keycloak, Okta, Auth0) | E-mail **verificado** de um domínio aceito |
| Facebook | Nunca comprova: todo acesso passa por aprovação |
| E-mail e senha | Nunca comprova: entra por convite ou por aprovação |

Enquanto o provedor estiver ligado sem organização ou domínio, um aviso no alto da aba **Organização e acesso** e da seção **Formas de login** lembra que "todos pedem acesso".

### 3. Aprove o app na organização do GitHub, se ela restringe OAuth Apps

Algumas organizações bloqueiam OAuth Apps que não foram aprovados. Nesse caso o GitHub não deixa o hub enxergar a organização, e todo mundo aparece como "sem vínculo comprovado", mesmo sendo membro. Peça a um **owner da organização** no GitHub para aprovar o app nas configurações de acesso de terceiros (OAuth apps) da organização.

### 4. Ligue "Liberar automaticamente"

Ainda na aba **Organização e acesso**, no painel **Regras de acesso**, marque **Liberar automaticamente quem comprova vínculo com a empresa**. Ela já vem marcada em instalações novas. Desmarcada, todo mundo passa pela aprovação, inclusive quem é da empresa.

### 5. Escolha a política para quem não comprova

Em **Quem não comprova vínculo**, escolha uma opção:

- **Pode pedir acesso e aguardar aprovação**: a pessoa vira "aguardando", escreve uma justificativa e um administrador decide. É o que você quer para consultorias (veja [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros)).
- **Não pode entrar (convites e aprovações manuais continuam valendo)**: o login é recusado. Convites por e-mail continuam funcionando.

### 6. Ajuste a revalidação

Ainda em **Regras de acesso**, em **Prazos**, defina **Conferir vínculo a cada (horas)**, de 1 a 72 (padrão 12), e clique em **Salvar regras**. É o intervalo com que o hub confere se a pessoa continua na empresa (RN-10):

- **GitHub**: o hub pergunta ao GitHub de novo, sem exigir novo login.
- **Google, Microsoft, GitLab e OIDC**: valem os dados do último login. A conferência acontece quando a pessoa entra de novo, e a sessão dura o tempo de **Sessão (horas)** (padrão 8).

Quem entrou por vínculo e depois o perde (saiu da organização do GitHub, por exemplo) é **suspenso automaticamente** (RN-06). Se ele voltar a comprovar o vínculo, entra de novo sozinho, com o mesmo papel que tinha (RN-08). Suspensão feita por um administrador nunca é desfeita sozinha.

Se você mudar a lista de organizações ou domínios, o hub confere todo mundo no próximo acesso. Para forçar agora, abra a aba **Ambientes e sessões** (`?s=environments`), seção **Sessões e recuperação**, e clique em **Conferir todas as pessoas**, no painel **Conferir vínculos com a empresa**.

### 7. Teste com uma conta da empresa

Numa janela anônima, abra o hub e entre com uma conta que pertença à organização. A pessoa deve cair direto no catálogo (depois do tour guiado do primeiro acesso), sem tela de "Pedido de acesso enviado". Faça também um teste negativo com uma conta de fora, para ver o comportamento da política do passo 5.

### 8. Promova quem precisa de mais

Todo mundo entra como **Leitor**. Em **Pessoas e acesso**, clique no nome da pessoa e, no bloco **Papel**, escolha o novo papel e clique em **Salvar papel**:

- **Mantenedor** para quem publica specs e mantém serviços do próprio time.
- **Administrador** só pode ser dado por um Proprietário. Um Administrador promove até Mantenedor.

Mudar o papel encerra a sessão da pessoa; ela entra de novo com o papel novo. Nada disso altera a matriz de permissões: para isso, veja [Papel com permissões sob medida](/receitas/papel-personalizado).

## Como saber que deu certo

- Na tabela **Pessoas**, a conta de teste aparece como **ativo**, com origem **da empresa** e papel **Leitor**.
- Em **Auditoria**, o tipo de evento **Acesso** mostra "Sistema teve o status mudado de aguardando para ativo automaticamente (nome da pessoa)", sem que ninguém tenha decidido.
- O número de solicitações pendentes no item **Pessoas e acesso** do menu não sobe quando alguém da empresa entra.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Todos caem em "Pedido de acesso enviado" | Faltam organizações ou domínios (o aviso aparece na aba **Organização e acesso** e na seção **Formas de login**), ou **Liberar automaticamente** está desmarcado. |
| Membros do GitHub aparecem como "sem vínculo comprovado" | A organização restringe OAuth Apps e o app não foi aprovado (passo 3), ou o nome da organização está errado. |
| Uma pessoa recém-convidada para a organização não entra | O convite do GitHub precisa estar **aceito**: só o vínculo em estado "ativo" conta. |
| Pessoas do Google ou do Keycloak não comprovam vínculo | O e-mail não está verificado no provedor ou o domínio não está em **Domínios de e-mail da empresa**. |
| Uma pessoa que saiu da organização continua entrando | Ela ainda está dentro do intervalo de revalidação (padrão 12 h). Use **Conferir todas as pessoas** ou suspenda a pessoa em **Pessoas e acesso**. |
| Tirei um domínio da lista e quem usa Google ainda entra | Nesses provedores o vínculo só é reavaliado no próximo login. |
| "Precisamos confirmar seu vínculo com a empresa. Entre de novo." | O token do GitHub da pessoa expirou ou foi revogado. Basta entrar de novo. |
| A pessoa saiu da organização e não foi suspensa | Só quem entrou pelo vínculo é suspenso. Quem foi **aprovado manualmente sem vínculo comprovado**, ou convidado por e-mail, mantém o acesso até um administrador suspender. |
| "Sua conta não comprova vínculo com a empresa, e esta instalação não aceita pedidos de fora." | A política está em **Não pode entrar** e a conta não comprova vínculo. Mude a política ou use um convite. |

## Veja também

- [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros): quem não comprova vínculo, com prazo.
- [Onboarding de uma pessoa nova](/receitas/onboarding-de-pessoa-nova): o que fazer depois que ela entra.
- [Pessoas e acesso](/admin/pessoas-e-acesso): a tela de solicitações, papéis e suspensões.
- [Autenticação e acesso](/arquitetura/autenticacao-e-acesso): a decisão de acesso por dentro.
