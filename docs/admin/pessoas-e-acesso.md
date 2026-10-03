---
description: "A tela Pessoas e acesso do Rizoma: decidir pedidos de acesso, convidar por e-mail, mudar papéis, suspender e reativar, gerar links de nova senha e consultar o histórico de decisões."
---

# Pessoas e acesso

Esta tela é onde você decide quem entra no Rizoma e com qual papel. Ela reúne os pedidos de acesso aguardando decisão, o convite por e-mail, a lista de todas as pessoas e o histórico de decisões. É para quem administra o acesso ao hub.

## Para que serve

Quem comprova vínculo com a empresa entra sozinho, se a liberação automática estiver ligada. Todo o resto passa por aqui: terceiros e consultorias que pedem acesso, pessoas convidadas por e-mail, suspensões, mudanças de papel. Como o fluxo de entrada funciona do ponto de vista de quem pede está em [Primeiro acesso e tour](/uso/primeiro-acesso).

## Quem vê

O item **Pessoas e acesso** do menu abre `/admin/people`. A tela aparece para quem tem a permissão de aprovar e recusar pedidos **ou** a de convidar pessoas, mudar papéis e suspender. ADMIN e OWNER têm as duas por padrão.

Dentro da tela, cada parte pede a sua permissão:

| Parte | Permissão |
|---|---|
| Decidir pedidos de acesso | Aprovar e recusar pedidos de acesso |
| Convidar por e-mail, mudar papéis, suspender e reativar, gerar link de nova senha | Convidar pessoas, mudar papéis e suspender |

Essas duas permissões são administrativas e só podem ser dadas ao papel ADMIN (RN-28).

## O que aparece na tela

![Tela Pessoas e acesso](/prints/08-pessoas-e-acesso.png)

*A tela Pessoas e acesso. A lista, os pedidos e o histórico aparecem um de cada vez.*

Quando há pedidos aguardando, o item **Pessoas e acesso** do menu mostra um número com a contagem. Quem pode convidar vê o botão **Convidar usuário** no canto, mesmo se o login por e-mail ainda estiver desligado: nesse caso o modal aponta para **Configurações → Formas de login**.

A busca "Buscar nome, e-mail ou time" fica acima dos filtros **Todos**, **Ativos**, **Suspensos**, **Pedidos** e **Histórico**. Só uma dessas visões aparece por vez. Clicar no nome de uma pessoa substitui a lista pela ficha dela. **← Pessoas** volta, com a busca e o filtro que estavam ativos.

### Pedidos

O filtro **Pedidos** lista quem pediu acesso e ainda não teve uma decisão, do pedido mais antigo para o mais novo. Cada pedido é um cartão com:

- o nome, o `@usuario` ou e-mail, e a data do pedido;
- um selo: **vínculo comprovado** (a pessoa pertence à organização ou ao domínio aceito, mas a liberação automática está desligada) ou **sem vínculo comprovado**;
- a justificativa escrita pela pessoa, ou "Sem justificativa.";
- o formulário de decisão: um seletor de **papel**, um seletor de **prazo**, o campo **Observação (opcional)** e os botões **Aprovar** e **Recusar**.

Os pedidos expiram no prazo configurado (14 dias, por padrão). Pedidos expirados saem da lista, e a pessoa pode entrar de novo para abrir outro. Sem pedidos, a seção mostra "Nenhum pedido aberto".

### Convidar usuário

O botão **Convidar usuário** abre um modal. Ele só gera o convite quando o login por **E-mail e senha** está ativo. Com SMTP salvo, o hub envia o link e ainda o mostra para copiar. Sem SMTP, você copia o link e o manda por um canal da empresa. Os campos são **E-mail**, **Nome (opcional)** e **Papel**, e o botão é **Gerar convite**. O modal permanece aberto para você copiar o link.

### Pessoas

A tabela lista quem já teve o acesso decidido (quem ainda aguarda fica em **Pedidos**), em ordem de papel e depois de e-mail, com 10 por página.

| Coluna | O que mostra |
|---|---|
| **Pessoa** | O `@usuario` do GitHub ou o e-mail. O clique abre a ficha. |
| **Status** | **ativo**, **suspenso** ou **recusado**. |
| **Origem** | **da empresa** (vínculo comprovado), **aprovado/convidado** (decisão de um admin ou convite) ou **externo**. |

### A ficha da pessoa

A ficha mostra status, origem, times, prazo de acesso e os últimos eventos de acesso. Quem administra muda o **Papel** com **Salvar papel**, **Suspende** ou **Reativa**, e, para quem entra com senha, gera o **Link de nova senha**. Nada disso aparece na sua própria ficha.

### Histórico de decisões

O **Histórico de decisões** lista os eventos de acesso, do mais recente ao mais antigo, com 10 por página e a barra "Mostrando 1–10 de 34 eventos". As colunas são **Quando**, **Quem** (quem fez, ou "sistema") e **O que aconteceu**:

| Evento | Texto no histórico |
|---|---|
| Pedido aberto | pediu acesso |
| Pedido aprovado | aprovou um acesso |
| Pedido recusado | recusou um acesso |
| Login barrado | teve o login barrado |
| Mudança automática de status | status alterado automaticamente |
| Justificativa enviada | enviou justificativa |

Para filtrar por pessoa e período, e ver os detalhes técnicos, use a [Auditoria](/admin/auditoria).

## O que dá para fazer

### Aprovar um pedido

1. No filtro **Pedidos**, leia a justificativa.
2. Escolha o **papel**. VIEWER e MAINTAINER estão sempre disponíveis; **ADMIN** só aparece para OWNER.
3. Escolha o **prazo**: **Sem prazo**, **Por 30 dias**, **Por 90 dias** ou **Por 180 dias**. Para quem tem vínculo comprovado, o padrão é **Sem prazo**; para quem não tem, **Por 90 dias**.
4. Se quiser, escreva uma **Observação** (até 300 caracteres).
5. Clique em **Aprovar**.

A pessoa fica ativa com o papel escolhido, na próxima página que abrir. Quando o prazo de um acesso aprovado manualmente vence, a conta é suspensa (RN-07).

### Recusar um pedido

Nos campos de decisão, clique em **Recusar** (a observação é opcional). A conta da pessoa fica com o status **recusado**, e o login dela passa a mostrar "Seu pedido de acesso foi recusado. Fale com um administrador." Uma conta recusada continua recusada até que alguém da administração a reabra (RN-09).

### Convidar uma pessoa

1. Clique em **Convidar usuário** e preencha o **E-mail**, o **Nome (opcional)** e o **Papel** (**ADMIN** só aparece para OWNER).
2. Clique em **Gerar convite**.
3. O hub mostra "Envie este link para fulano@suaempresa.com. Vale até 06/10/2026 e só pode ser usado uma vez." e uma caixa com o link. Clique em **copiar**.
4. Envie o link à pessoa pelo canal que a sua empresa usa.

O link vale 7 dias e só funciona uma vez. Gerar um convite novo para o mesmo e-mail invalida os anteriores. A pessoa cria a senha e entra com o papel do convite, mesmo se a política do hub for bloquear quem não comprova vínculo. O passo a passo dela está em [Primeiro acesso e tour](/uso/primeiro-acesso), e o seu, em [Convidar por e-mail](/receitas/convidar-por-email).

::: tip Convite também libera quem já existe
Se a pessoa já tem conta mas não está ativa (aguardando, suspensa ou recusada), o convite serve para liberá-la: ao criar a senha, ela fica ativa com o papel do convite. O hub só recusa o convite se a pessoa já tiver acesso ativo ("Essa pessoa já tem acesso.").
:::

### Mudar o papel de alguém

1. Abra a pessoa e escolha o novo papel.
2. Clique em **Salvar papel**.

Ao mudar o papel, as sessões abertas da pessoa são encerradas: ela precisa entrar de novo para valer. As regras (RN-13, RN-24 e RN-25):

- ninguém altera o próprio papel;
- só um OWNER concede ou retira o papel OWNER ou ADMIN;
- quem não é OWNER não altera alguém do mesmo nível ou acima, nem dá um papel do seu nível ou acima;
- a instalação precisa manter pelo menos um OWNER, então o último OWNER não pode ser rebaixado.

Quando uma dessas regras é violada, a mudança é recusada e nada é alterado.

### Suspender e reativar

Na ficha da pessoa, clique em **Suspender**. O acesso cai na próxima página que ela abrir, porque as sessões são invalidadas (RN-14). A suspensão manual só é desfeita por alguém da administração: clique em **Reativar** na mesma ficha. Você não pode suspender a si mesmo, e só um OWNER suspende outro OWNER.

A suspensão automática é diferente: quem perde o vínculo com a empresa (por exemplo, sai da organização do GitHub) é suspenso sozinho e volta sozinho quando recupera o vínculo (RN-06 e RN-08).

### Gerar um link de nova senha

Para quem entra com e-mail e senha, o botão **Link de nova senha** gera um link de redefinição. Não existe "esqueci minha senha" automático.

1. Na ficha da pessoa, clique em **Link de nova senha**.
2. Copie o link mostrado ("Link válido por 1 hora, uso único. Ao usar, as sessões da pessoa são encerradas.").
3. Envie a pessoa por um canal seguro.

Só um OWNER gera o link de outro OWNER. Quem não entra com senha vê "Essa pessoa não entra com senha."

## Regras importantes

| Regra | Resumo |
|---|---|
| RN-04 | Com liberação automática ligada, quem comprova vínculo entra direto como VIEWER. |
| RN-07 | Acesso aprovado manualmente pode ter prazo; vencido, a conta é suspensa. |
| RN-09 | Pedido recusado deixa a conta recusada; só a administração reabre. |
| RN-11 e RN-12 | Pedidos expiram em N dias; existe no máximo um pedido aberto por pessoa. |
| RN-13 | Quem decide pedidos aprova até MAINTAINER; ADMIN e OWNER só um OWNER concede. Ninguém decide o próprio pedido. |
| RN-14 | Suspender invalida a sessão na próxima requisição. |
| RN-15 | A justificativa tem de 10 a 500 caracteres e é vista por quem decide. |
| RN-16 e RN-17 | Convite e redefinição são de uso único e expiram; o cadastro aberto sempre cria um pedido pendente e não revela se o e-mail existe. |
| RN-24 e RN-25 | Ninguém altera o próprio papel; sempre resta pelo menos um OWNER. |

O prazo do pedido, a política para quem não comprova vínculo e a liberação automática se configuram em [Configurações](/admin/configuracoes), na seção **Regras de acesso**. Toda decisão fica na [Auditoria](/admin/auditoria). Os códigos completos estão em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Configurações](/admin/configuracoes): liberação automática, política para quem não comprova vínculo e prazo dos pedidos.
- [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros): aprovar uma consultoria com prazo.
- [Permissões](/admin/permissoes): o que cada papel pode fazer.
- [Times](/admin/times): coloque as pessoas nos times certos.
