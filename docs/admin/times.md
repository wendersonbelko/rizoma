---
description: "A tela Times do Rizoma: criar times, ver os serviços que cada time mantém, adicionar e remover membros pelo usuário do GitHub ou pelo e-mail, sincronizar com um time do GitHub e como a paginação funciona."
---

# Times

Os times são a base da propriedade no Rizoma: cada serviço tem um time responsável, e quem faz parte de um time edita os serviços dele. Esta página mostra como criar times e cuidar de quem participa de cada um. É para quem administra o hub.

## Para que serve

O time responde a duas perguntas: "de quem é este serviço?" e "quem pode mexer nele?". Ele aparece no [Catálogo](/uso/catalogo), no cabeçalho de cada [serviço](/uso/servico) e no [Mapa de ligações](/uso/mapa). E é o que define o escopo "próprio time" das permissões: sem a permissão de editar qualquer serviço, uma pessoa só edita regras, variáveis, integrações, tokens e specs dos serviços dos times de que participa (RN-22).

## Quem vê

O item **Times** do menu (grupo **Cadastros**) abre `/admin/teams`. A tela exige a permissão de criar times e gerenciar membros, que o Administrador e o Proprietário têm por padrão. Quem não a tem recebe "não encontrada".

## O que aparece na tela

A página tem o título **Times**, a frase "Quem mantém cada serviço. Abra um time para ver e mudar as pessoas." e o botão **Novo time**. A lista e o time aberto não aparecem juntos: clicar no nome substitui a tabela pela ficha daquele time. O caminho **Times › nome do time** no alto da ficha volta para a lista, com a busca e o filtro que estavam ativos.

### Novo time

**Novo time** abre um modal com o campo **Nome do time**, a **Descrição** (em **Detalhes opcionais**) e o botão **Criar time**. O mesmo modal abre pelo botão **+ Novo** da barra lateral e pela busca (Ctrl+K ou ⌘K), em **Criar → Novo time**.

O endereço do time (o slug, usado em URLs e na API) não é um campo: aparece como texto pequeno abaixo do nome, por exemplo `/admin/teams?team=pagamentos · editar endereço`, e acompanha o que você digita. Clique em **editar endereço** só se quiser mudá-lo.

### A lista

Acima da tabela há a busca "Buscar time, serviço ou pessoa" (`?q=`) e os filtros **Todos**, **Com membros** e **Sem membros** (`?f=with` e `?f=without`), cada um com a contagem entre parênteses. A tabela tem estas colunas:

| Coluna | O que mostra |
|---|---|
| **Time** | O nome. O clique abre o time. |
| **Serviços** | Os serviços que o time mantém, ou "Nenhum serviço". Some em telas estreitas. |
| **Pessoas** | Até três pessoas do time, pelo nome, e "+N" quando há mais. |
| **Membros** | A quantidade. |

Os times aparecem em ordem alfabética, 10 por página (`?page=` e `?size=`). Sem resultado, a tela diz "Nenhum time com esse filtro".

### O time aberto

O endereço do time aberto é `/admin/teams?team=<slug>`. A ficha mostra o nome, a linha "Mantém:" com os serviços (ou "Ainda não mantém nenhum serviço."), **Adicionar membro** e **Sincronizar com o GitHub**. A tabela de membros tem:

| Coluna | O que mostra |
|---|---|
| **Pessoa** | A foto (ou a inicial do nome) e o nome. Quem ainda não tem nome aparece pelo `@usuário` do GitHub ou pelo e-mail. Quando há nome, o e-mail vem logo abaixo, em letra menor. |
| **Papel no time** | **Líder** (selo de destaque) ou **Membro**. Os líderes vêm primeiro; dentro de cada papel, a ordem é alfabética. |
| Ações | **Remover**. |

Sem membros, aparece "Nenhum membro neste time." A lista de membros também tem 10 por página, com parâmetros próprios na URL (`?backend.page=2`, onde `backend` é o slug). Essa paginação só existe enquanto o time está aberto.

## O que dá para fazer

### Criar um time

1. Clique em **Novo time** e escreva o **Nome do time** (de 2 a 60 caracteres).
2. Confira o endereço abaixo do nome. Se quiser outro, clique em **editar endereço** e use letras minúsculas, números e hífen (de 2 a 63 caracteres). Ele precisa ser único.
3. Se quiser, abra **Detalhes opcionais** e escreva uma **Descrição** (até 300 caracteres).
4. Clique em **Criar time**. O modal fecha e o time aparece na lista.

Se o endereço já existir, o modal avisa "Já existe um time com esse endereço. Mude o nome ou edite o endereço." Esc, clique fora, **×** e **Cancelar** pedem "Descartar o que você digitou?" quando há algo digitado.

O passo a passo completo, com os serviços e as pessoas, está em [Onboarding de uma pessoa nova](/receitas/onboarding-de-pessoa-nova).

### Adicionar uma pessoa a um time

1. Abra o time e clique em **Adicionar membro**. O campo é **@usuário do GitHub ou e-mail**, com a dica "A pessoa precisa ter acesso ativo ao hub." e o exemplo `@fulano ou fulano@empresa.com`.
2. Escolha o **Papel no time**: **Membro** (já vem escolhido) ou **Líder**.
3. Clique em **Adicionar membro**. O modal fecha e a pessoa entra na tabela.

Você pode escrever o usuário com ou sem o `@`, em maiúsculas ou minúsculas. Só entra quem já tem acesso **ativo** ao hub (RN-34): se a pessoa ainda não entrou, está com a solicitação pendente ou está suspensa, o hub recusa com "… ainda não tem acesso ativo ao hub. Convide a pessoa em Pessoas e acesso e tente de novo." Decida a solicitação antes, em [Pessoas e acesso](/admin/pessoas-e-acesso).

### Mudar o papel de alguém no time

Adicione a pessoa de novo, escolhendo o outro papel. Quem já é do time apenas muda de papel.

### Remover uma pessoa do time

1. Na linha da pessoa, clique em **Remover**.
2. A linha passa a mostrar "Membro removido" com o botão **Desfazer**, por cerca de 5 segundos.
3. Se você não clicar em **Desfazer**, a remoção é feita.

Remover alguém do time não mexe no acesso dela ao hub, só o escopo "próprio time". A pessoa perde, na hora, a permissão de editar os serviços daquele time (se não puder editar qualquer serviço).

### Sincronizar com um time do GitHub

Se o time já existe na organização do GitHub, o hub pode trazer quem já tem conta.

1. Abra o time e clique em **Sincronizar com o GitHub**.
2. No modal **Sincronizar** *nome do time*, preencha **Time no GitHub** com o identificador do time na organização, como aparece no endereço dele no GitHub (por exemplo, `backend`). O hub guarda o valor no time, e na próxima vez ele já vem preenchido.
3. Clique em **Sincronizar com o GitHub**. O modal mostra o resultado e o botão de saída passa a ser **Fechar**.

A sincronização só **acrescenta**: quem tem conta ativa no hub e está no time do GitHub entra como **Membro**. Ela não remove ninguém e não muda o papel de quem já está no time. O resultado diz, por exemplo, "3 pessoas vinculadas. 2 ainda não têm conta no hub." e lista "Sem conta no hub: @fulano, @ciclana", com o link **Convidar em Pessoas e acesso**.

Para funcionar, o hub precisa do **Token de leitura** do GitHub em **Configurações → Conexões** (seção **Repositórios**) e da organização do GitHub em **Configurações → Organização e acesso** (veja [Configurações](/admin/configuracoes)). Sem isso, o modal diz o que falta, e o mesmo vale quando o time não existe nas organizações configuradas.

## Regras importantes

- **Só pessoas ativas (RN-34).** Times aceitam apenas quem tem acesso ativo, identificado pelo usuário do GitHub ou pelo e-mail.
- **Propriedade (RN-22 e RN-33).** Um serviço tem no máximo um time responsável. O escopo "próprio time" vale para os times de que você participa.
- **Líder é um rótulo.** O papel **Líder** organiza e destaca a lista, mas hoje não dá permissões a mais do que o de **Membro**. As permissões vêm do papel de acesso da pessoa em [Pessoas e acesso](/admin/pessoas-e-acesso).
- **Sem edição de time.** A tela cria times e gerencia membros. Renomear ou excluir um time ainda não é possível pela interface, e a descrição é guardada com o time, mas hoje não aparece na tela.
- **Auditoria.** Criar time, adicionar e remover membros e sincronizar com o GitHub ficam registrados na [Auditoria](/admin/auditoria), no tipo de evento **Times**.

## Próximos passos

- [Serviços, repositórios, vínculos e tokens](/admin/servicos-e-vinculos): cadastre serviços para o time.
- [Pessoas e acesso](/admin/pessoas-e-acesso): libere quem ainda não tem acesso.
- [Visão geral](/admin/): o que "próprio time" significa em cada tela.
