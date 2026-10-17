---
description: "A tela Pessoas e acesso do Rizoma: decidir solicitações de acesso, convidar por e-mail, mudar papéis, suspender e reativar, gerar links de nova senha e consultar o histórico de decisões."
---

# Pessoas e acesso

Esta tela é onde você decide quem entra no Rizoma e com qual papel. Ela reúne as solicitações de acesso aguardando decisão, o convite por e-mail, a lista de todas as pessoas e o histórico de decisões. É para quem administra o acesso ao hub.

## Para que serve

Quem comprova vínculo com a empresa entra sozinho, se a liberação automática estiver ligada. Todo o resto passa por aqui: terceiros e consultorias que pedem acesso, pessoas convidadas por e-mail, suspensões, mudanças de papel. Como o fluxo de entrada funciona do ponto de vista de quem pede está em [Primeiro acesso e tour](/uso/primeiro-acesso).

## Quem vê

O item **Pessoas e acesso** do menu (grupo **Pessoas**) abre `/admin/people`. A tela aparece para quem tem a permissão de aprovar e recusar solicitações de acesso **ou** a de convidar pessoas, mudar papéis e suspender. O Administrador e o Proprietário têm as duas por padrão. Quem não tem nenhuma das duas recebe "não encontrada".

Dentro da tela, cada parte pede a sua permissão:

| Parte | Permissão |
|---|---|
| Decidir solicitações de acesso | Aprovar e recusar solicitações de acesso (`access:decide`) |
| Convidar pessoa, mudar papéis, suspender e reativar, gerar link de nova senha | Convidar pessoas, mudar papéis e suspender (`user:manage`) |

Essas duas permissões são administrativas e só podem ser dadas ao papel Administrador (RN-28). Quem só tem a primeira vê a lista e as fichas, mas sem os botões de convidar, mudar papel e suspender.

## O que aparece na tela

![Tela Pessoas e acesso](/prints/08-pessoas-e-acesso.png)

*A tela Pessoas e acesso. Captura de uma versão anterior da interface: hoje a lista mostra foto e nome em vez do e-mail, os filtros se chamam Solicitações de acesso e Histórico, e a coluna Papel aparece na tabela.*

O título é **Pessoas e acesso**, com a frase "Quem entra no hub. Abra uma pessoa para mudar o papel e o acesso." Quando há solicitações aguardando, o item **Pessoas e acesso** do menu mostra um número com a contagem.

Quem pode convidar vê o botão **Convidar pessoa** no canto, mesmo se o login por e-mail ainda estiver desligado: nesse caso o modal explica e leva a **Configurações → Conexões**. O mesmo modal abre pelo botão **+ Novo** da barra lateral e pela busca (Ctrl+K ou ⌘K), em **Criar → Convidar pessoa**.

A busca "Buscar nome, e-mail ou time" (`?q=`) fica acima dos filtros **Todos**, **Ativos** e **Suspensos** (`?f=active` e `?f=suspended`), **Solicitações de acesso** (`?v=requests`) e **Histórico** (`?v=history`). Cada filtro mostra a contagem entre parênteses, e só uma dessas visões aparece por vez. A busca existe só na lista de pessoas. Clicar no nome de uma pessoa (`?person=`) substitui a lista pela ficha dela. O caminho **Pessoas e acesso › nome** no alto da ficha volta, com a busca e o filtro que estavam ativos. Os endereços antigos em português (`?v=pedidos`, `?pessoa=`) continuam funcionando e redirecionam.

### Solicitações de acesso

O filtro **Solicitações de acesso** lista quem pediu acesso e ainda não teve uma decisão, da solicitação mais antiga para a mais nova. Cada solicitação é um cartão com:

- a foto, o nome, o e-mail (quando há nome) e "solicitou há 2 h", com a data completa ao passar o mouse;
- um selo: **vínculo comprovado** (a pessoa pertence à organização ou ao domínio aceito, mas a liberação automática está desligada) ou **sem vínculo comprovado**;
- a justificativa escrita pela pessoa, ou "Sem justificativa.";
- o formulário de decisão: um seletor de **Papel**, um seletor de **Prazo do acesso**, o campo **Observação (opcional)** e os botões **Aprovar acesso** e **Recusar**.

As solicitações expiram no prazo configurado (14 dias, por padrão). As expiradas saem da lista, e a pessoa pode entrar de novo para abrir outra. Sem solicitações, a seção mostra "Nenhuma solicitação aberta".

### Convidar pessoa

O botão **Convidar pessoa** abre um modal com a frase "A pessoa recebe um link para criar a senha." Ele só gera o convite quando o login por **E-mail e senha** está ativo. Com SMTP salvo, o hub envia o link e ainda o mostra para copiar. Sem SMTP, você copia o link e o manda por um canal da empresa.

Os campos obrigatórios, marcados com `*`, são **E-mail** e **Papel** (que já vem em **Leitor**). Em **Detalhes opcionais** fica o **Nome**, que aparece na lista de pessoas até a pessoa entrar. O botão é **Gerar convite**. Depois de gerar, o modal continua aberto, com o link à vista e o botão **Copiar**: o link não aparece de novo.

### Pessoas

A tabela lista quem já teve o acesso decidido (quem ainda aguarda fica em **Solicitações de acesso**), em ordem de papel e depois de e-mail, com 10 por página.

| Coluna | O que mostra |
|---|---|
| **Pessoa** | A foto (ou a inicial) e o nome, com o e-mail logo abaixo. Quem ainda não tem nome aparece pelo `@usuário` ou pelo e-mail. A sua própria linha tem o selo **você**. O clique abre a ficha. |
| **Status** | **ativo**, **suspenso** ou **recusado**. Quando o acesso tem prazo, aparece "até *data*" embaixo. |
| **Origem** | **da empresa** (vínculo comprovado), **aprovado ou convidado** (decisão de um administrador ou convite) ou **externo**. Some em telas estreitas. |
| **Papel** | **Proprietário**, **Administrador**, **Mantenedor** ou **Leitor**. |

### A ficha da pessoa

A ficha começa com a foto, o nome, o e-mail e o `@usuário`, e o selo de status. Abaixo vêm quatro blocos:

| Bloco | O que mostra |
|---|---|
| **Acesso** | **Origem**, **Times** (ou "Nenhum") e **Prazo do acesso** ("até *data*" ou "sem prazo"). |
| **Papel** | O seletor de papel e o botão **Salvar papel**. O seletor só lista os papéis que **você** pode conceder a essa pessoa. Quando você não pode mudar o papel, o bloco mostra só o nome do papel e o motivo ("Você não pode mudar o próprio papel.", "Só quem gerencia pessoas muda o papel." ou "Você não pode mudar o papel desta pessoa."). |
| **Eventos de acesso** | Os últimos 20 eventos de acesso dela, em frases (veja o histórico, abaixo). |
| **Segurança** | O **Link de nova senha** e **Suspender acesso** (ou **Reativar acesso**, se ela já está suspensa). Só aparece para quem tem a permissão de gerenciar pessoas, e nunca na sua própria ficha. |

### Histórico de decisões

O filtro **Histórico** mostra o **Histórico de decisões**: os eventos de acesso, do mais recente ao mais antigo, com 10 por página (`?hpage=` e `?hsize=`) e a barra "Mostrando 1–10 de 34 eventos". São duas colunas: **Quando** ("há 2 h", "ontem, 13:39"; a data completa aparece ao passar o mouse) e **O que aconteceu**, que é uma frase com o autor em destaque. Sem autor (um evento automático), aparece **Sistema**. Sem eventos, a tela diz "Nenhuma decisão ainda".

| Evento | Frase no histórico |
|---|---|
| Solicitação aberta | **Carla Nunes** pediu acesso |
| Solicitação aprovada | **Marina Costa** aprovou o acesso de Carla Nunes como Mantenedor |
| Solicitação recusada | **Marina Costa** recusou a solicitação de acesso de Carla Nunes |
| Login barrado | **Carla Nunes** teve o login recusado (não faz parte da empresa) |
| Mudança automática de status | **Sistema** teve o status mudado de aguardando para ativo automaticamente (Carla Nunes) |
| Justificativa enviada | **Carla Nunes** atualizou a justificativa da solicitação de acesso |

As frases são as mesmas da [Auditoria](/admin/auditoria). Para filtrar por pessoa e período, e ver os detalhes técnicos, use a Auditoria.

## O que dá para fazer

### Aprovar uma solicitação

1. No filtro **Solicitações de acesso**, leia a justificativa.
2. Escolha o **Papel**. **Leitor** e **Mantenedor** estão sempre disponíveis; **Administrador** só aparece para o Proprietário.
3. Escolha o **Prazo do acesso**: **Sem prazo**, **Por 30 dias**, **Por 90 dias** ou **Por 180 dias**. Para quem tem vínculo comprovado, o padrão é **Sem prazo**; para quem não tem, **Por 90 dias**.
4. Se quiser, escreva uma **Observação (opcional)** (até 300 caracteres).
5. Clique em **Aprovar acesso**.

A pessoa fica ativa com o papel escolhido, na próxima página que abrir. Quando o prazo de um acesso aprovado manualmente vence, a conta é suspensa (RN-07).

### Recusar uma solicitação

Nos campos de decisão, clique em **Recusar** (a observação é opcional). A conta da pessoa fica com o status **recusado**, e o login dela passa a mostrar "Seu pedido de acesso foi recusado. Fale com um administrador." Uma conta recusada continua recusada até que alguém da administração a reabra (RN-09).

### Convidar uma pessoa

1. Clique em **Convidar pessoa** e preencha o **E-mail**, o **Papel** (**Administrador** só aparece para o Proprietário) e, se quiser, o **Nome**, em **Detalhes opcionais**.
2. Clique em **Gerar convite**.
3. O hub mostra "Envie este link para fulano@suaempresa.com. Vale até 06/10/2026 e só pode ser usado uma vez." e uma caixa com o link. Clique em **Copiar**. Com SMTP salvo, a mensagem diz "E-mail enviado para fulano@suaempresa.com. O link também está aqui…".
4. Envie o link à pessoa pelo canal que a sua empresa usa. Para convidar outra pessoa em seguida, clique em **Convidar outra pessoa**. Quando terminar, **Fechar**.

O link vale 7 dias e só funciona uma vez. Gerar um convite novo para o mesmo e-mail invalida os anteriores. A pessoa cria a senha e entra com o papel do convite, mesmo se a política do hub for bloquear quem não comprova vínculo. O passo a passo dela está em [Primeiro acesso e tour](/uso/primeiro-acesso), e o seu, em [Convidar por e-mail](/receitas/convidar-por-email).

::: tip Convite também libera quem já existe
Se a pessoa já tem conta mas não está ativa (aguardando, suspensa ou recusada), o convite serve para liberá-la: ao criar a senha, ela fica ativa com o papel do convite. O hub só recusa o convite se a pessoa já tiver acesso ativo ("Essa pessoa já tem acesso.").
:::

### Mudar o papel de alguém

1. Abra a pessoa e, no bloco **Papel**, escolha o novo papel.
2. Clique em **Salvar papel**. O botão só habilita quando o papel escolhido é outro.

A tela responde "Papel salvo: Mantenedor. Vale na próxima página que a pessoa abrir." Ao mudar o papel, as sessões abertas da pessoa são encerradas: ela precisa entrar de novo para valer. As regras (RN-13, RN-24 e RN-25):

- ninguém altera o próprio papel;
- só um Proprietário concede ou retira o papel de Proprietário ou de Administrador;
- quem não é Proprietário não altera alguém do mesmo nível ou acima, nem dá um papel do seu nível ou acima;
- a instalação precisa manter pelo menos um Proprietário, então o último não pode ser rebaixado.

Quando uma dessas regras é violada, a mudança é recusada, o motivo aparece no próprio bloco e nada é alterado.

### Suspender e reativar

No bloco **Segurança** da ficha, clique em **Suspender acesso**. É uma ação destrutiva: um modal confirma ("A pessoa perde o acesso agora e as sessões abertas dela são encerradas. Você pode reativar depois."). O acesso cai na próxima página que ela abrir, porque as sessões são invalidadas (RN-14). A suspensão manual só é desfeita por alguém da administração: clique em **Reativar acesso** no mesmo bloco, que não pede confirmação. Você não pode suspender a si mesmo, e só um Proprietário suspende outro Proprietário.

A suspensão automática é diferente: quem perde o vínculo com a empresa (por exemplo, sai da organização do GitHub) é suspenso sozinho e volta sozinho quando recupera o vínculo (RN-06 e RN-08).

### Gerar um link de nova senha

Para quem entra com e-mail e senha, o bloco **Segurança** tem o **Link de nova senha**. Não existe "esqueci minha senha" automático.

1. Na ficha da pessoa, no bloco **Segurança**, clique em **Gerar link de nova senha**.
2. No modal, clique em **Gerar link**. Copie o link com **Copiar** (a mensagem diz "Link válido por 1 hora, uso único. Ao usar, as sessões da pessoa são encerradas."). Com SMTP salvo, o hub também envia o link por e-mail.
3. Envie a pessoa por um canal seguro e clique em **Fechar**.

Só um Proprietário gera o link de outro Proprietário. Se a pessoa não entra com senha, o bloco não mostra o link; se o login por e-mail e senha estiver desligado, também não.

## Regras importantes

| Regra | Resumo |
|---|---|
| RN-04 | Com liberação automática ligada, quem comprova vínculo entra direto como Leitor. |
| RN-07 | Acesso aprovado manualmente pode ter prazo; vencido, a conta é suspensa. |
| RN-09 | Solicitação recusada deixa a conta recusada; só a administração reabre. |
| RN-11 e RN-12 | Solicitações expiram em N dias; existe no máximo uma solicitação aberta por pessoa. |
| RN-13 | Quem decide solicitações aprova até Mantenedor; Administrador e Proprietário só um Proprietário concede. Ninguém decide a própria solicitação. |
| RN-14 | Suspender invalida a sessão na próxima requisição. |
| RN-15 | A justificativa tem de 10 a 500 caracteres e é vista por quem decide. |
| RN-16 e RN-17 | Convite e redefinição são de uso único e expiram; o cadastro aberto sempre cria uma solicitação pendente e não revela se o e-mail existe. |
| RN-24 e RN-25 | Ninguém altera o próprio papel; sempre resta pelo menos um Proprietário. |

O prazo da solicitação, a política para quem não comprova vínculo e a liberação automática se configuram em [Configurações](/admin/configuracoes), na aba **Organização e acesso** (`?s=organization`), no painel **Regras de acesso**. Toda decisão fica na [Auditoria](/admin/auditoria). Os códigos completos estão em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Configurações](/admin/configuracoes): liberação automática, política para quem não comprova vínculo e prazo das solicitações.
- [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros): aprovar uma consultoria com prazo.
- [Permissões](/admin/permissoes): o que cada papel pode fazer.
- [Times](/admin/times): coloque as pessoas nos times certos.
