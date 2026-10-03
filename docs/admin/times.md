---
description: "A tela Times do Rizoma: criar times, ver os serviços que cada time mantém, adicionar e remover membros pelo usuário do GitHub ou pelo e-mail, e como a paginação funciona."
---

# Times

Os times são a base da propriedade no Rizoma: cada serviço tem um time responsável, e quem faz parte de um time edita os serviços dele. Esta página mostra como criar times e cuidar de quem participa de cada um. É para quem administra o hub.

## Para que serve

O time responde a duas perguntas: "de quem é este serviço?" e "quem pode mexer nele?". Ele aparece no [Catálogo](/uso/catalogo), no cabeçalho de cada [serviço](/uso/servico) e no [Mapa de ligações](/uso/mapa). E é o que define o escopo "próprio time" das permissões: sem a permissão de editar qualquer serviço, uma pessoa só edita regras, variáveis, integrações, tokens e specs dos serviços dos times de que participa (RN-22).

## Quem vê

O item **Times** do menu (grupo **Administração**) abre `/admin/teams`. A tela exige a permissão de criar times e gerenciar membros, que ADMIN e OWNER têm por padrão. Quem não a tem recebe "não encontrada".

## O que aparece na tela

A página tem o título **Times**, a frase "Quem mantém cada serviço. Abra um time para ver e mudar as pessoas." e o botão **Novo time**. A lista e o time aberto não aparecem juntos: clicar no nome substitui a tabela pela ficha daquele time. **← Times** volta para a lista, com a busca e o filtro que estavam ativos.

### Novo time

**Novo time** abre um modal com **Nome**, **Slug** e **Descrição**, e o botão **Criar time**. O slug é o identificador curto, usado em URLs e na API; ele é sugerido a partir do nome, e a dica embaixo mostra como vai ficar.

### A lista

Acima da tabela há a busca "Buscar time, serviço ou pessoa" e os filtros **Todos**, **Com membros** e **Sem membros**, cada um com a contagem. A tabela tem estas colunas:

| Coluna | O que mostra |
|---|---|
| **Time** | O nome. O clique abre o time. |
| **Serviços** | Os serviços que o time mantém, ou "Nenhum serviço". Some em telas estreitas. |
| **Pessoas** | Até três pessoas do time. |
| **Membros** | A quantidade. |

Os times aparecem em ordem alfabética, 10 por página. Sem resultado, a tela diz "Nenhum time com esse filtro".

### O time aberto

A ficha mostra o nome, a linha "Mantém:" com os serviços (ou "Ainda não mantém nenhum serviço."), **Adicionar membro** e **Sincronizar com o GitHub**. A tabela de membros tem:

| Coluna | O que mostra |
|---|---|
| **Pessoa** | O usuário do GitHub (`@joana-lima`) ou, para quem entra por e-mail, o e-mail. Quem tem usuário do GitHub mostra o nome logo abaixo. |
| **Papel** | **líder** (selo de destaque) ou **membro**. Os líderes vêm primeiro; dentro de cada papel, a ordem é alfabética. |
| Ações | **Remover**. |

Sem membros, aparece "Nenhum membro neste time." A lista de membros também tem 10 por página, com parâmetros próprios na URL (`?backend.page=2`, onde `backend` é o slug). Essa paginação só existe enquanto o time está aberto.

## O que dá para fazer

### Criar um time

1. Clique em **Novo time** e escreva o **Nome** (de 2 a 60 caracteres).
2. Confira o **Slug**. Use letras minúsculas, números e hífen (de 2 a 63 caracteres). Ele precisa ser único.
3. Se quiser, escreva uma **Descrição** (até 300 caracteres).
4. Clique em **Criar time**. O time aparece na lista.

O passo a passo completo, com os serviços e as pessoas, está em [Onboarding de uma pessoa nova](/receitas/onboarding-de-pessoa-nova).

### Adicionar uma pessoa a um time

1. Abra o time e clique em **Adicionar membro**. O campo é **Usuário do GitHub ou e-mail**, com a dica `@fulano ou fulano@empresa.com`.
2. Escolha o **Papel no time**: **Membro** ou **Líder**.
3. Clique em **Adicionar membro**.

Você pode escrever o usuário com ou sem o `@`, em maiúsculas ou minúsculas. Só entra quem já tem acesso **ativo** ao hub (RN-34): se a pessoa ainda não entrou, ou está pendente ou suspensa, o hub recusa a ação, porque ele não encontra uma pessoa ativa com aquele usuário ou e-mail. Decida o pedido antes, em [Pessoas e acesso](/admin/pessoas-e-acesso).

### Mudar o papel de alguém no time

Adicione a pessoa de novo, escolhendo o outro papel. Quem já é do time apenas muda de papel.

### Remover uma pessoa do time

1. Na linha da pessoa, clique em **Remover**.
2. A linha passa a mostrar "Membro removido" com o botão **Desfazer**, por cerca de 5 segundos.
3. Se você não clicar em **Desfazer**, a remoção é feita.

Remover alguém do time não mexe no acesso dela ao hub, só o escopo "próprio time". A pessoa perde, na hora, a permissão de editar os serviços daquele time (se não puder editar qualquer serviço).

## Regras importantes

- **Só pessoas ativas (RN-34).** Times aceitam apenas quem tem acesso ativo, identificado pelo usuário do GitHub ou pelo e-mail.
- **Propriedade (RN-22 e RN-33).** Um serviço tem no máximo um time responsável. O escopo "próprio time" vale para os times de que você participa.
- **Líder é um rótulo.** O papel **líder** organiza e destaca a lista, mas hoje não dá permissões a mais do que o de **membro**. As permissões vêm do papel de acesso da pessoa em [Pessoas e acesso](/admin/pessoas-e-acesso).
- **Sem edição de time.** A tela cria times e gerencia membros. Renomear ou excluir um time ainda não é possível pela interface, e a descrição é guardada com o time, mas hoje não aparece na tela.
- **Auditoria.** Criar time, adicionar e remover membros ficam registrados na [Auditoria](/admin/auditoria).

## Próximos passos

- [Serviços e repositórios](/admin/servicos-e-vinculos): cadastre serviços para o time.
- [Pessoas e acesso](/admin/pessoas-e-acesso): libere quem ainda não tem acesso.
- [Visão geral](/admin/): o que "próprio time" significa em cada tela.
