---
description: "Configure o SMTP na instalação ou em Configurações, convide por e-mail e senha e cuide de senhas esquecidas. Sem SMTP, o link continua só para copiar."
---

# Convidar por e-mail

Nem todo mundo tem uma conta que o hub reconhece: pode ser alguém sem GitHub, uma pessoa de um parceiro, ou uma instalação sem login corporativo. O login por **e-mail e senha** resolve isso com convites. Esta receita mostra como ativá-lo, gerar e entregar o convite, redefinir senhas e, se quiser, abrir o cadastro. É para quem administra pessoas.

::: warning Sem SMTP, o hub só mostra o link
Com o servidor SMTP preenchido no assistente ou em **Configurações → E-mail**, o convite e o link de nova senha são enviados e ainda aparecem na tela para copiar. Sem essa configuração, você entrega o link pelo canal da empresa. A senha do SMTP fica cifrada e não volta para a tela.
:::

## Antes de começar

- Para ativar a forma de login, você precisa de **Configurações** (`settings:manage`, por padrão só o OWNER). Para convidar e gerar links de senha, precisa de `user:manage` (ADMIN e OWNER têm).
- O endereço público usado nos links é o campo **Endereço público do hub** da seção **E-mail**. Sem SMTP, o link usa `AUTH_URL`. Veja [Variáveis de ambiente](/instalacao/variaveis-de-ambiente).
- Você sabe o e-mail da pessoa e o papel que ela terá. **ADMIN** só pode ser dado por um OWNER.

## Passo a passo

### 1. Ative E-mail e senha

1. Abra **Configurações** e a seção **Formas de login**.
2. Em **E-mail e senha**, clique em **Ligar** (ou **Configurar**, se já estiver ligado).
3. Deixe desmarcada a caixa "Permitir que pessoas criem conta e peçam acesso (sempre com aprovação)". Desmarcada, só entra quem recebe convite. O passo 6 fala do cadastro aberto.
4. Clique em **Salvar**.

A mudança vale a partir do próximo login. O hub exige que você mantenha uma forma de login que você mesmo usa: se a ideia era trocar de método, ligue o novo antes de desligar o antigo.

### 2. Gere o convite

1. No menu, abra **Pessoas e acesso** e clique em **Convidar usuário**. O botão aparece para quem tem `user:manage`. Se E-mail e senha ainda não está ativo, o modal pede para ligar essa forma em **Configurações**.
2. Preencha **E-mail**, **Nome (opcional)** e **Papel**.
3. Clique em **Gerar convite**. O modal permanece aberto para você copiar o link.

A tela mostra o link e, se o SMTP estiver salvo, avisa que o e-mail saiu. Se o envio falhar, a mensagem diz isso e o link continua copiável. O link **não** volta a aparecer depois: o banco guarda só o hash. Se perder, gere outro.

O convite vale por **7 dias** e é de **uso único** (RN-16). Gerar um novo para o mesmo e-mail invalida os anteriores. Se a pessoa já tem acesso ativo, o hub responde "Essa pessoa já tem acesso."

### 3. Entregue o link

Mande o link pelo canal da empresa, com algumas palavras de contexto. Por exemplo:

> Oi, Fulano. Este é o convite para o Rizoma da Suaempresa. Ele vale por 7 dias e só funciona uma vez: https://apihub.suaempresa.com/invite/… Você vai criar sua senha e depois entrar com o e-mail fulano@suaempresa.com.

### 4. A pessoa define a senha

Ao abrir o link, a pessoa vê **Criar sua senha**, com o e-mail do convite:

1. Confere **Seu nome** (vem preenchido com o que você digitou em **Nome (opcional)**).
2. Digita a **Senha** e a **Confirmar senha**. A senha precisa ter de 12 a 128 caracteres, misturar pelo menos três tipos (minúsculas, maiúsculas, números e símbolos), evitar sequências óbvias (`123456`, `senha`, `qwerty`…) e não conter a parte do e-mail antes do `@`.
3. Clica em **Salvar senha**.

Ela cai no login com a mensagem "Senha salva. Entre com seu e-mail." Entra com **E-mail** e **Senha**. O acesso já está **ativo** com o papel do convite, sem etapa de aprovação, porque o convite é a aprovação. Mesmo com a política **Não pode entrar**, convites continuam valendo (RN-05). No primeiro acesso ela faz o tour guiado obrigatório.

::: info Convite não tem prazo de acesso
O convite expira em 7 dias, mas o **acesso** que ele dá não tem data final. Para acessos com prazo, veja [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros).
:::

### 5. Atenda quem esqueceu a senha

A tela de login diz "Esqueceu a senha? Peça um link de redefinição ao administrador." Não existe redefinição automática por e-mail.

1. Em **Pessoas e acesso**, na tabela **Pessoas**, clique em **Link de nova senha** na linha da pessoa. O botão aparece só para quem entra com senha.
2. Copie o link (`…/reset-password/…`) e entregue pelo canal da empresa.

O link vale **1 hora** e é de uso único. Ao usá-lo, a pessoa cria a senha na tela **Nova senha**, as sessões dela são encerradas e um bloqueio por tentativas erradas é desfeito. Só um OWNER redefine a senha de outro OWNER.

Depois de **5 tentativas erradas seguidas**, a conta fica bloqueada por **15 minutos** (RN-16), com a mensagem "Muitas tentativas erradas. A conta fica bloqueada por 15 minutos." O bloqueio acaba sozinho, ou antes se você gerar um link de nova senha.

### 6. (Opcional) Abra o cadastro

Se quiser que as pessoas peçam acesso por conta própria, marque, em **Configurações → Formas de login**, a caixa "Permitir que pessoas criem conta e peçam acesso (sempre com aprovação)" e salve. Duas condições:

- A política **Quem não comprova vínculo**, em **Regras de acesso**, precisa estar em **Pode pedir acesso e aguardar aprovação**. Com **Não pode entrar**, o cadastro fica fechado e o link some do login.
- O link **Pedir acesso** aparece na tela de login, e a página é `/signup`. A pessoa informa **Nome**, **E-mail**, **Senha**, **Confirmar senha** e **Por que precisa de acesso?** (de 10 a 500 caracteres).

Todo cadastro cria um pedido **pendente**, decidido em **Pessoas e acesso → Pedidos aguardando**, e a resposta é a mesma quando o e-mail já existe, para não revelar quem tem conta (RN-17). Há um limite de 5 cadastros por hora por endereço de origem.

::: warning Cadastro aberto exposto à internet
Qualquer pessoa que alcance o endereço do hub consegue abrir pedidos. Mantenha o cadastro fechado se o hub está aberto na internet, ou coloque-o atrás de VPN.
:::

## Como saber que deu certo

- O modal mostra o link e a mensagem de validade.
- Depois que a pessoa salva a senha, ela aparece na tabela **Pessoas** como **ativo**, com origem **aprovado/convidado** e o papel do convite.
- Em **Auditoria**, o tipo **Pessoas** registra o convite e o aceite, e o tipo **Login e saída** registra o primeiro login.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Não vejo **Convidar usuário** | Você não tem `user:manage`. |
| "Ative o login por e-mail e senha em Configurações para convidar." | Mesmo motivo: ative a forma de login. |
| "Só um OWNER convida ADMIN." | A opção **ADMIN** só aparece para OWNER. |
| "Link inválido ou expirado. Peça um novo ao administrador." | Passaram 7 dias (ou 1 hora, na redefinição), o link já foi usado ou foi substituído por outro mais novo. Gere um novo. |
| O link abre um endereço errado | O `AUTH_URL` do hub está incorreto. Corrija e gere outro convite. |
| A senha é recusada | Confira as regras do passo 4. A mensagem diz qual falhou. |
| "Muitas tentativas. Aguarde alguns minutos." | Limite de tentativas por e-mail. Aguarde, ou gere um link de nova senha. |
| "E-mail ou senha incorretos." logo depois de criar a senha | O login precisa usar o mesmo e-mail do convite. Confira se o convite não foi gerado para outro endereço. |

## Veja também

- [Pessoas e acesso](/admin/pessoas-e-acesso): a tela de convites, papéis e suspensões.
- [Acesso temporário para terceiros](/receitas/acesso-temporario-para-terceiros): aprovação com prazo.
- [Provedores de login](/instalacao/provedores-de-login): as outras formas de entrar.
- [Segurança](/referencia/seguranca): senhas, bloqueios e tokens de convite.
