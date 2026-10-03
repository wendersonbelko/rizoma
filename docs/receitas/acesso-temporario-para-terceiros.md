---
description: Dê acesso ao hub a consultorias e freelancers por tempo limitado, decida o que a pessoa enxerga e revogue antes do prazo, se precisar.
---

# Acesso temporário para terceiros

Uma consultoria ou um freelancer precisa ler a documentação de algumas APIs por alguns meses, e não deve ficar com acesso para sempre nem ver o que não é da conta dela. Esta receita cobre o ciclo inteiro: a pessoa pede acesso, você aprova com papel e prazo, ajusta o que ela enxerga e, no fim, o acesso vence ou é revogado. É para quem aprova pedidos de acesso.

```mermaid
sequenceDiagram
  participant P as Consultoria
  participant H as Rizoma
  participant A as Administrador
  P->>H: Entra com a conta dela
  H-->>P: Pedido de acesso enviado
  P->>H: Escreve a justificativa
  A->>H: Aprova com papel e prazo
  H-->>P: Acesso ativo até a data
  H-->>P: Vencido o prazo, acesso suspenso
```

## Antes de começar

- Você enxerga **Pessoas e acesso** no menu. Precisa de `access:decide` (ADMIN e OWNER têm). Para suspender antes do prazo, precisa de `user:manage`.
- A política **Quem não comprova vínculo** (**Configurações → Regras de acesso**) está em **Pode pedir acesso e aguardar aprovação**. Com **Não pode entrar**, o pedido de quem é de fora nem chega a você; nesse caso use um [convite por e-mail](/receitas/convidar-por-email), lembrando que o convite não tem prazo.
- Você sabe qual papel e quantos dias a pessoa precisa. O papel **ADMIN** só pode ser concedido por um OWNER.
- A pessoa tem um jeito de entrar: uma forma de login que você habilitou (GitHub pessoal, Google, e-mail e senha…). Ela não precisa comprovar vínculo, e a conta dela vai justamente para a fila de aprovação.

## Passo a passo

### 1. A pessoa entra e pede acesso

Mande para ela o endereço do hub (`https://apihub.suaempresa.com`). Ao entrar com uma conta que não comprova vínculo, ela cai em **Pedido de acesso enviado**. Nessa tela, peça que ela preencha **Quem é você e por que precisa de acesso?** (de 10 a 500 caracteres) e clique em **Enviar justificativa**. Um bom texto diz a empresa, o motivo e até quando: "Consultoria X, integração com o serviço de pedidos, até dezembro".

![Tela que a pessoa vê enquanto o pedido espera uma decisão](/prints/13-aguardando-aprovacao.png)
*A pessoa vê esta tela até alguém decidir. Captura de uma versão anterior da interface.*

O pedido vale por N dias (padrão 14, ajustável em **Pedido expira (dias)**). Se ninguém decidir, ele expira, e a pessoa pode entrar de novo para abrir outro. Se você habilitou o cadastro aberto, ela também pode usar `/signup`, que sempre gera um pedido pendente (veja [Convidar por e-mail](/receitas/convidar-por-email)).

### 2. Aprove com papel e prazo

Abra **Pessoas e acesso**. O número no menu conta os pedidos pendentes. Em **Pedidos aguardando**, cada pedido mostra quem é, a data, um selo **sem vínculo comprovado** e a justificativa.

![Pedidos aguardando na tela Pessoas e acesso](/prints/08-pessoas-e-acesso.png)
*Pedidos aguardando, com papel, prazo e observação. Captura de uma versão anterior da interface.*

1. Escolha o **papel**: **VIEWER** para ler; **MAINTAINER** se ela vai publicar specs e editar serviços de um time (só nos serviços dos times de que participa).
2. Escolha o **prazo**: **Sem prazo**, **Por 30 dias**, **Por 90 dias** ou **Por 180 dias**. Para quem não comprova vínculo, o padrão da tela é 90 dias.
3. Escreva uma **Observação (opcional)**. Ela fica no registro da decisão.
4. Clique em **Aprovar** (ou **Recusar**).

Você não decide o próprio pedido. O acesso vale a partir de agora, e a tabela **Pessoas** passa a mostrar "até *data*" abaixo do status da pessoa.

### 3. Restrinja o que a pessoa vê

Não existe uma lista de serviços permitidos por pessoa. A visibilidade é decidida **por serviço**: **Toda a empresa** ou **Só o time responsável** (RN-30). Um VIEWER de fora vê todos os serviços "Toda a empresa" e, dos restritos, só os de times de que participa.

Por padrão, o que essa pessoa enxerga:

| Tela | O que aparece para ela |
|---|---|
| **Catálogo** e **página do serviço** | Serviços "Toda a empresa" e os "Só o time responsável" dos times dela. |
| Aba **Variáveis de ambiente** | Os valores das variáveis comuns aparecem (só os segredos ficam ocultos). |
| **Mapa de ligações** | Serviços conforme a visibilidade, mais times, pessoas que estão em times, repositórios e integrações. |
| **Integrações externas** | Todas as integrações e o endereço de cada ambiente. Elas não têm visibilidade por time. |

Para reduzir o que ela enxerga:

1. Em **Times**, crie um time para o trabalho (por exemplo, `Consultoria X`) com **Novo time** → **Criar time**. Adicione a pessoa com **Adicionar membro** (só pessoas com acesso ativo entram em times; por isso este passo vem depois da aprovação).
2. Nos serviços que ela **não** deve ver, abra **Editar serviço**, troque **Quem pode ver** para **Só o time responsável** e clique em **Salvar alterações**.
3. Para o serviço em que ela vai trabalhar, deixe-o visível (ou restrito ao time da consultoria) e coloque a pessoa nesse time.
4. Se variáveis comuns e o mapa não devem aparecer para nenhum VIEWER, ajuste o papel em [Papel com permissões sob medida](/receitas/papel-personalizado). A mudança vale para todas as pessoas com aquele papel.

::: warning Integrações externas são da empresa inteira
Nomes e endereços de bancos, filas e APIs de terceiros aparecem para qualquer pessoa com acesso ao catálogo. Se algum não pode ser visto por terceiros, não o cadastre no hub.
:::

### 4. O que acontece no vencimento

Na primeira vez que a pessoa abrir o hub depois da data (RN-07), o acesso é suspenso: a sessão cai, ela volta ao login com "Seu acesso está suspenso. Fale com um administrador." e o status vira **suspenso**. Até lá, a tabela pode mostrar **ativo** com a data "até" já passada. Nada é apagado: o time, os registros e o histórico permanecem.

::: info O prazo vale para acesso aprovado manualmente
Ele vale para quem foi aprovado sem vínculo comprovado (o caso da consultoria). Se a pessoa já comprova vínculo (o selo diz **vínculo comprovado**), o acesso segue o vínculo, e o prazo não se aplica. Convites por e-mail também não têm prazo.
:::

Hoje não existe um botão para prorrogar. **Reativar** uma conta vencida não muda a data, e a conta volta a ser suspensa no acesso seguinte. Se o trabalho pode se estender, aprove já com um prazo maior.

### 5. Revogue antes do prazo, se precisar

1. Em **Pessoas e acesso**, na linha da pessoa, clique em **Suspender**. As sessões dela caem na próxima requisição (RN-14), e só um administrador desfaz a suspensão, com **Reativar**.
2. Em **Times**, clique em **Remover** na linha da pessoa, em cada time dela. Aparece **Desfazer** por alguns segundos.
3. Se ela era MAINTAINER e gerou tokens de CI, revogue-os na aba **Tokens** de **Serviços e repositórios**. Suspender a pessoa não revoga tokens. Para descobrir quais foram criados por ela, use a **Auditoria** ("Token de publicação criado").
4. Se ela revelou segredos, confira na **Auditoria** ("Segredo revelado") e troque o que for necessário.

## Como saber que deu certo

- Na tabela **Pessoas**, a pessoa aparece como **ativo**, com origem **aprovado/convidado**, o papel escolhido e "até *data*".
- Em **Histórico**, o evento "aprovou um acesso" aparece, e a **Auditoria** guarda o papel e o prazo no registro aberto.
- Peça que ela confirme o que enxerga: só os serviços que você quis, e nenhuma tela de administração.
- Depois do prazo, o status vira **suspenso** e o login recusa.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| O pedido não chega a **Pedidos aguardando** | A política está em **Não pode entrar**, ou o pedido expirou. Mude a política ou peça que ela entre de novo. |
| "Só um OWNER concede o papel ADMIN." | O papel **ADMIN** só aparece para OWNER. |
| "Você não pode decidir o próprio pedido." | Peça a outra pessoa com `access:decide`. |
| A pessoa vê 404 ao abrir um serviço | O serviço é **Só o time responsável** e ela não é do time. Foi o pretendido, ou adicione-a ao time. |
| O prazo não expirou o acesso | Ela foi aprovada com **vínculo comprovado**, ou por convite. O prazo só vale para aprovação manual sem vínculo. |
| Não consigo adicionar a pessoa ao time | "… ainda não tem acesso ativo ao hub." Aprove o pedido antes. |

## Veja também

- [Pessoas e acesso](/admin/pessoas-e-acesso): a tela de pedidos, papéis e suspensões.
- [Convidar por e-mail](/receitas/convidar-por-email): quando o pedido de fora está bloqueado.
- [Papel com permissões sob medida](/receitas/papel-personalizado): ajustar o que um Leitor enxerga.
- [Times](/admin/times): montar o time da consultoria.
