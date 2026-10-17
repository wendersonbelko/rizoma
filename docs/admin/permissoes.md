---
description: "A matriz de permissões do Rizoma: o que cada papel pode fazer, as travas que não dá para mudar, como revisar e salvar as mudanças, como restaurar o padrão e quando as mudanças valem."
---

# Permissões

A tela **Permissões** mostra, numa matriz, o que cada papel pode fazer no Rizoma, e permite ajustar isso para a sua empresa. Esta página explica cada coluna, as travas que o hub impõe e o efeito de salvar. É para quem administra o hub.

## Para que serve

Os papéis padrão (Administrador, Mantenedor e Leitor) atendem a maioria das empresas. Quando não servem, você muda a matriz sem mexer no código: por exemplo, deixar os mantenedores arquivarem serviços, ou tirar deles a permissão de revelar segredos. O papel de cada **pessoa** continua sendo definido em [Pessoas e acesso](/admin/pessoas-e-acesso); aqui você define o que cada **papel** permite.

## Quem vê

O item **Permissões** do menu (grupo **Pessoas**) abre `/admin/permissions`. A tela exige a permissão de editar a matriz de permissões, que, por padrão, só o **Proprietário** tem. Como é uma permissão administrativa, só pode ser dada ao papel Administrador (RN-28). Quem não a tem recebe "não encontrada".

Um Administrador que recebeu essa permissão não consegue removê-la do próprio papel: o hub responde "Você não pode remover do seu próprio papel a permissão de editar a matriz.", para não trancar a tela.

## O que aparece na tela

O título é **Permissões**, com a frase "O Proprietário sempre tem tudo. Ver o catálogo é obrigatório. Administração só no Administrador." e o botão **Recolher grupos** (que vira **Expandir grupos**). Depois da matriz, no fim da página, fica a zona de perigo com **Restaurar padrão**.

### A matriz

A página rola inteira, como as outras: o cabeçalho da matriz gruda no alto enquanto você desce. As linhas se agrupam em quatro áreas: **Catálogo**, **Variáveis de ambiente**, **Serviços** e **Administração**. Cada **coluna** é um papel, com a contagem de pessoas ativas ao lado do nome ("Administrador 3"; o número de pessoas por extenso aparece ao passar o mouse): **Proprietário**, **Administrador**, **Mantenedor** e **Leitor**. Cada **linha** é uma permissão, escrita em linguagem simples. O código técnico (`catalog:read`) não aparece na matriz; ele está na tabela mais abaixo.

Ao passar o mouse, a **linha** e a **coluna** da célula ganham destaque, para você não se perder numa matriz de 21 linhas. Cada grupo é um título que se recolhe e se expande com um clique (**▸**), com a quantidade de permissões entre parênteses. Um grupo recolhido que tem mudanças não salvas mostra "N mudanças" ao lado do nome, para você não esquecê-las.

Cada célula tem um de três aspectos:

| Aspecto | O que significa |
|---|---|
| Caixa de seleção comum | Você pode marcar ou desmarcar. Se o valor for diferente do que está salvo, a caixa ganha um halo âmbar. |
| Quadrado preenchido, com um visto | **Sempre ativo**: não pode ser desmarcado. É o caso de toda a coluna Proprietário e de `catalog:read`. |
| Contorno esmaecido, com um traço (—) | **Não se aplica a este papel**: não pode ser marcada. É o caso das permissões administrativas nos papéis Mantenedor e Leitor. |

Ao passar o mouse sobre uma célula travada, uma dica explica o motivo (por exemplo, "Não se aplica: permissão administrativa, só o Administrador pode recebê-la."). A coluna **Proprietário** é somente leitura: o Proprietário tem tudo, sempre.

### As 21 permissões e os padrões

As permissões marcadas com "próprio time" só valem nos serviços dos times de que a pessoa participa, a menos que ela tenha a permissão **Editar qualquer serviço** (veja a [visão geral](/admin/)). A coluna **Permissão** repete o texto da matriz.

| Área | Permissão | Código | Padrão |
|---|---|---|---|
| Catálogo | Ver catálogo, documentação e regras de negócio | `catalog:read` | Todos (obrigatória) |
| Catálogo | Ver serviços restritos de outros times | `catalog:read_private` | Administrador |
| Catálogo | Ver o mapa de ligações | `graph:read` | Todos |
| Variáveis de ambiente | Ver variáveis (valores de segredos ficam ocultos) | `envvars:read` | Todos |
| Variáveis de ambiente | Revelar segredos dos serviços do próprio time | `envvars:reveal` | Administrador, Mantenedor |
| Variáveis de ambiente | Editar variáveis dos serviços do próprio time | `envvars:edit` | Administrador, Mantenedor |
| Serviços | Editar regras de negócio dos serviços do próprio time | `docs:edit` | Administrador, Mantenedor |
| Serviços | Cadastrar serviços para o próprio time | `service:create` | Administrador, Mantenedor |
| Serviços | Editar serviços do próprio time (dados, ligações e integrações) | `service:edit` | Administrador, Mantenedor |
| Serviços | Editar qualquer serviço, inclusive variáveis, segredos e regras | `service:edit_any` | Administrador |
| Serviços | Arquivar e restaurar serviços | `service:archive` | Administrador |
| Serviços | Importar spec manualmente e sincronizar (próprio time) | `spec:publish` | Administrador, Mantenedor |
| Serviços | Gerar e revogar tokens de CI (próprio time) | `token:manage` | Administrador, Mantenedor |
| Serviços | Cadastrar repositórios e integrações externas compartilhadas | `link:edit` | Administrador, Mantenedor |
| Administração | Criar times e gerenciar membros | `team:manage` | Administrador |
| Administração | Aprovar e recusar pedidos de acesso | `access:decide` | Administrador |
| Administração | Convidar pessoas, mudar papéis e suspender | `user:manage` | Administrador |
| Administração | Ver e exportar a auditoria | `audit:read` | Administrador |
| Administração | Mudar título e tema do sistema | `appearance:manage` | Administrador |
| Administração | Configurações: login, ambientes, repositórios e regras de acesso | `settings:manage` | Só o Proprietário |
| Administração | Editar esta matriz de permissões | `roles:manage` | Só o Proprietário |

O Proprietário tem todas, em qualquer configuração. A referência completa, com o efeito de cada uma e os itens de menu que dependem delas, está em [Papéis e permissões](/referencia/permissoes).

::: info Dois textos da matriz que ficaram para trás
Na matriz, `access:decide` ainda se chama "Aprovar e recusar pedidos de acesso": ela decide as **Solicitações de acesso** de [Pessoas e acesso](/admin/pessoas-e-acesso). E `appearance:manage` ainda se chama "Mudar título e tema do sistema": hoje ela abre a aba **Aparência** de [Configurações](/admin/configuracoes), onde se define o nome do sistema e a cor de destaque. O tema Claro, Escuro ou Sistema é escolha de cada pessoa, pelo menu do avatar, e não depende de permissão.
:::

### As travas

A frase ao lado do título resume as regras fixas. Permissões marcadas como "próprio time" só valem nos serviços dos times da pessoa.

- **O Proprietário sempre tem tudo (RN-26).** A coluna não é editável.
- **Ver o catálogo é obrigatório (RN-27).** `catalog:read` não pode ser desmarcada em nenhum papel.
- **Permissões administrativas só para o Administrador (RN-28).** As sete permissões da área **Administração** (`team:manage`, `access:decide`, `user:manage`, `audit:read`, `appearance:manage`, `settings:manage` e `roles:manage`) só podem ser marcadas na coluna **Administrador**. Nas colunas **Mantenedor** e **Leitor**, aparecem com o traço (—).

Se você tentar salvar uma combinação inválida, o hub mostra o motivo, por exemplo "Ver o catálogo é obrigatório para todos os papéis."

### Revisar e salvar

Marcar ou desmarcar uma caixa **não grava nada**. Assim que existe uma mudança, uma barra fixa aparece no rodapé da tela:

| Elemento | O que faz |
|---|---|
| "3 mudanças não salvas" | O contador de caixas diferentes do que está salvo ("1 mudança não salva", no singular). |
| **Descartar** | Volta a matriz ao que estava salvo, sem pedir confirmação. |
| **Revisar e salvar** | Abre o modal **Revisar mudanças**, com o resumo por papel. |

O modal mostra, para cada papel que mudou, o que ele ganha e o que perde, na ordem da matriz:

> **Leitor**
>
> Leitor ganha:
> - Editar regras de negócio dos serviços do próprio time
>
> **Mantenedor**
>
> Mantenedor perde:
> - Revelar segredos dos serviços do próprio time

Confira e clique em **Salvar 2 mudanças** (o botão traz o total). **Cancelar** fecha o modal e deixa as mudanças na tela. Se o hub recusar a combinação, o motivo aparece no rodapé do modal e nada é gravado.

### Restaurar padrão

**Restaurar padrão** fica numa **Zona de perigo** no fim da página, de propósito, longe do caminho de quem só vai salvar uma mudança. O botão abre uma confirmação ("Volta a matriz ao padrão de cada papel e descarta tudo o que foi personalizado…") com **Cancelar** e **Restaurar padrão**. Não é preciso digitar nada.

## O que dá para fazer

### Alterar as permissões de um papel

1. Abra **Permissões** no menu.
2. Marque ou desmarque as caixas dos papéis Administrador, Mantenedor e Leitor. Recolha os grupos que você não vai mexer, se ajudar.
3. Confira o contador na barra do rodapé e clique em **Revisar e salvar**.
4. Leia "ganha" e "perde" de cada papel e clique em **Salvar N mudanças**.
5. Aguarde a mensagem "Permissões salvas. Valem a partir da próxima página que cada pessoa abrir." no alto da tela.

A matriz inteira é gravada de uma vez, e a mudança **vale a partir da próxima página** que cada pessoa abrir, sem que ninguém precise sair e entrar de novo (RN-29). Os itens de menu e os botões se ajustam sozinhos.

Alguns exemplos:

- **Deixar os mantenedores arquivarem serviços.** Marque "Arquivar e restaurar serviços" (`service:archive`) na coluna **Mantenedor**.
- **Impedir mantenedores de revelar segredos.** Desmarque "Revelar segredos dos serviços do próprio time" (`envvars:reveal`) na coluna **Mantenedor**.
- **Deixar o Administrador mexer em Configurações.** Marque "Configurações: login, ambientes, repositórios e regras de acesso" (`settings:manage`) na coluna **Administrador**.
- **Um Leitor que edita a documentação.** Marque "Editar regras de negócio dos serviços do próprio time" (`docs:edit`) na coluna **Leitor** (vale só nos serviços do time dele).

Para um passo a passo com um cenário completo, veja [Papel com permissões sob medida](/receitas/papel-personalizado).

### Voltar ao padrão

1. Role até o fim da página, até a **Zona de perigo**.
2. Clique em **Restaurar padrão** e confirme no modal.

O hub apaga a matriz personalizada, o modal fecha e a tela recarrega com a matriz original. Vale a partir da próxima página que cada pessoa abrir, como qualquer outra mudança.

## Regras importantes

- **Toda checagem é no servidor (RN-20).** A matriz vale mesmo para quem monta endereços ou formulários à mão.
- **Auditoria (RN-29).** Salvar e restaurar ficam na [Auditoria](/admin/auditoria), no tipo de evento **Permissões**, como "alterou a matriz de permissões (N mudanças)" ou "restaurou a matriz de permissões ao padrão". Abra **Detalhes** para ver, por papel, o que foi adicionado e removido.
- **Pessoas por papel.** A contagem no cabeçalho de cada coluna considera só pessoas ativas.
- **Alterações valem para todos.** Não existe permissão por pessoa: você muda o papel dela em [Pessoas e acesso](/admin/pessoas-e-acesso).

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Papéis e permissões](/referencia/permissoes): o efeito de cada permissão, em detalhe.
- [Papel com permissões sob medida](/receitas/papel-personalizado): um passo a passo.
- [Pessoas e acesso](/admin/pessoas-e-acesso): mude o papel de uma pessoa.
