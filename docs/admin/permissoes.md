---
description: "A matriz de permissões do Rizoma: o que cada papel pode fazer, as travas que não dá para mudar, como salvar e restaurar o padrão e quando as mudanças valem."
---

# Permissões

A tela **Permissões** mostra, numa matriz, o que cada papel pode fazer no Rizoma, e permite ajustar isso para a sua empresa. Esta página explica cada coluna, as travas que o hub impõe e o efeito de salvar. É para quem administra o hub.

## Para que serve

Os papéis padrão (ADMIN, MAINTAINER e VIEWER) atendem a maioria das empresas. Quando não servem, você muda a matriz sem mexer no código: por exemplo, deixar os mantenedores arquivarem serviços, ou tirar deles a permissão de revelar segredos. O papel de cada **pessoa** continua sendo definido em [Pessoas e acesso](/admin/pessoas-e-acesso); aqui você define o que cada **papel** permite.

## Quem vê

O item **Permissões** do menu abre `/admin/permissions`. A tela exige a permissão de editar a matriz de permissões, que, por padrão, só o **OWNER** tem. Como é uma permissão administrativa, só pode ser dada ao papel ADMIN (RN-28).

Um ADMIN que recebeu essa permissão não consegue removê-la do próprio papel: o hub responde "Você não pode remover do seu próprio papel a permissão de editar a matriz.", para não trancar a tela.

## O que aparece na tela

O título é **Permissões**. Ao lado dele ficam **Salvar** e **Restaurar padrão**. A frase ao lado do título resume as regras fixas: "Owner sempre tem tudo. Ver o catálogo é obrigatório. Administração só no Admin."

### A matriz

A matriz cabe na tela. As linhas se agrupam em quatro áreas: **Catálogo**, **Variáveis de ambiente**, **Serviços** e **Administração**. Cada **coluna** é um papel, com a contagem de pessoas ativas ao lado do nome ("Admin 3"): **Owner**, **Admin**, **Mantenedor** (MAINTAINER) e **Leitor** (VIEWER). Cada **linha** é uma permissão, com o nome em linguagem simples. O código técnico (`catalog:read`) aparece ao passar o mouse no nome.

Cada célula tem um de três aspectos:

| Aspecto | O que significa |
|---|---|
| Caixa de seleção comum | Você pode marcar ou desmarcar. |
| Quadrado preenchido | **Sempre ativo**: não pode ser desmarcado. É o caso de todo o papel Owner e de `catalog:read`. |
| Quadrado vazio | **Não disponível para este papel**: não pode ser marcado. É o caso das permissões administrativas nos papéis Mantenedor e Leitor. |

A coluna **Owner** é somente leitura: o OWNER tem tudo, sempre.

### As 21 permissões e os padrões

As permissões marcadas com "próprio time" só valem nos serviços dos times de que a pessoa participa, a menos que ela tenha a permissão **Editar qualquer serviço** (veja a [visão geral](/admin/)).

| Área | Permissão | Código | Padrão |
|---|---|---|---|
| Catálogo | Ver catálogo, documentação e regras de negócio | `catalog:read` | Todos (obrigatória) |
| Catálogo | Ver serviços restritos de outros times | `catalog:read_private` | Admin |
| Catálogo | Ver o mapa de ligações | `graph:read` | Todos |
| Variáveis de ambiente | Ver variáveis (valores de segredos ficam ocultos) | `envvars:read` | Todos |
| Variáveis de ambiente | Revelar segredos dos serviços do próprio time | `envvars:reveal` | Admin, Mantenedor |
| Variáveis de ambiente | Editar variáveis dos serviços do próprio time | `envvars:edit` | Admin, Mantenedor |
| Serviços | Editar regras de negócio dos serviços do próprio time | `docs:edit` | Admin, Mantenedor |
| Serviços | Cadastrar serviços para o próprio time | `service:create` | Admin, Mantenedor |
| Serviços | Editar serviços do próprio time (dados, ligações e integrações) | `service:edit` | Admin, Mantenedor |
| Serviços | Editar qualquer serviço, inclusive variáveis, segredos e regras | `service:edit_any` | Admin |
| Serviços | Arquivar e restaurar serviços | `service:archive` | Admin |
| Serviços | Importar spec manualmente e sincronizar (próprio time) | `spec:publish` | Admin, Mantenedor |
| Serviços | Gerar e revogar tokens de CI (próprio time) | `token:manage` | Admin, Mantenedor |
| Serviços | Cadastrar repositórios e integrações externas compartilhadas | `link:edit` | Admin, Mantenedor |
| Administração | Criar times e gerenciar membros | `team:manage` | Admin |
| Administração | Aprovar e recusar pedidos de acesso | `access:decide` | Admin |
| Administração | Convidar pessoas, mudar papéis e suspender | `user:manage` | Admin |
| Administração | Ver e exportar a auditoria | `audit:read` | Admin |
| Administração | Mudar título e tema do sistema | `appearance:manage` | Admin |
| Administração | Configurações: login, ambientes, repositórios e regras de acesso | `settings:manage` | Só Owner |
| Administração | Editar esta matriz de permissões | `roles:manage` | Só Owner |

O Owner tem todas, em qualquer configuração. A referência completa, com o efeito de cada uma, está em [Papéis e permissões](/referencia/permissoes).

### As travas

A frase ao lado do título resume as regras fixas: "Owner sempre tem tudo. Ver o catálogo é obrigatório. Administração só no Admin." Permissões marcadas como "próprio time" só valem nos serviços dos times da pessoa.

- **OWNER sempre tem tudo (RN-26).** A coluna não é editável.
- **Ver o catálogo é obrigatório (RN-27).** `catalog:read` não pode ser desmarcada em nenhum papel.
- **Permissões administrativas só para ADMIN (RN-28).** As sete permissões da área **Administração** (`team:manage`, `access:decide`, `user:manage`, `audit:read`, `appearance:manage`, `settings:manage` e `roles:manage`) só podem ser marcadas na coluna **Admin**. Nas colunas **Mantenedor** e **Leitor**, ficam sem opção.

Se você tentar salvar uma combinação inválida, o hub mostra o motivo, por exemplo "Ver o catálogo é obrigatório para todos os papéis."

### Salvar ou restaurar

Dois botões ficam no alto da tela, ao lado do título:

| Botão | O que faz |
|---|---|
| **Salvar** | Grava a matriz como está na tela. |
| **Restaurar padrão** | Apaga as alterações e volta à matriz padrão da tabela acima. |

## O que dá para fazer

### Alterar as permissões de um papel

1. Abra **Permissões** no menu.
2. Marque ou desmarque as caixas dos papéis Admin, Mantenedor e Leitor.
3. Clique em **Salvar**.
4. Aguarde a mensagem "Permissões salvas. Valem a partir da próxima página que cada pessoa abrir."

A matriz inteira é gravada de uma vez, e a mudança **vale a partir da próxima página** que cada pessoa abrir, sem que ninguém precise sair e entrar de novo (RN-29). Os itens de menu e os botões se ajustam sozinhos.

Alguns exemplos:

- **Deixar os mantenedores arquivarem serviços.** Marque `service:archive` na coluna **Mantenedor**.
- **Impedir mantenedores de revelar segredos.** Desmarque `envvars:reveal` na coluna **Mantenedor**.
- **Deixar o ADMIN mexer em Configurações.** Marque `settings:manage` na coluna **Admin**.
- **Um leitor que edita a documentação.** Marque `docs:edit` na coluna **Leitor** (vale só nos serviços do time dele).

Para um passo a passo com um cenário completo, veja [Papel com permissões sob medida](/receitas/papel-personalizado).

### Voltar ao padrão

Clique em **Restaurar padrão**. Não há pedido de confirmação. O hub responde "Permissões voltaram ao padrão." e recarrega a página com a matriz original.

## Regras importantes

- **Toda checagem é no servidor (RN-20).** A matriz vale mesmo para quem monta endereços ou formulários à mão.
- **Auditoria (RN-29).** Salvar e restaurar ficam na [Auditoria](/admin/auditoria) como "Matriz de permissões alterada" ou "restaurada ao padrão". Abra o registro para ver, por papel, o que foi adicionado e removido.
- **Pessoas por papel.** A contagem no cabeçalho de cada coluna considera só pessoas ativas.
- **Alterações valem para todos.** Não existe permissão por pessoa: você muda o papel dela em [Pessoas e acesso](/admin/pessoas-e-acesso).

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Papéis e permissões](/referencia/permissoes): o efeito de cada permissão, em detalhe.
- [Papel com permissões sob medida](/receitas/papel-personalizado): um passo a passo.
- [Pessoas e acesso](/admin/pessoas-e-acesso): mude o papel de uma pessoa.
