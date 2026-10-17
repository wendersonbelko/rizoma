---
description: "A aba Variáveis de ambiente de um serviço no Rizoma: listar, criar e editar variáveis, segredos cifrados, revelar, baixar o .env e copiar chaves entre ambientes."
---

# Variáveis de ambiente

A aba **Variáveis de ambiente** da página de um serviço guarda as variáveis de configuração dele, separadas por ambiente, com suporte a segredos cifrados. Esta página é para quem consulta as variáveis (por exemplo, para subir o serviço localmente) e para quem as mantém.

## Para que serve

Em vez de espalhar `.env` por chats e planilhas, o time registra cada variável uma vez por ambiente, com uma descrição de para que serve. Quem precisa do valor de um ambiente o encontra na própria página do serviço; quem precisa de um segredo o revela sob controle, com registro na auditoria.

::: warning O hub não substitui um cofre de segredos
Os segredos ficam cifrados no banco (AES-256-GCM) e cada revelação é auditada, mas o Rizoma não distribui variáveis para os seus serviços em execução. Use a aba como fonte de consulta e de documentação, e mantenha a chave `ENCRYPTION_KEY` do hub protegida (veja [Variáveis de ambiente do hub](/instalacao/variaveis-de-ambiente)).
:::

## Quem vê

O que cada pessoa faz na aba depende de três permissões, e das duas últimas valerem só para serviços do **próprio time** (a menos que a pessoa possa editar qualquer serviço):

| Ação | Permissão | Papéis padrão |
|---|---|---|
| Ver a lista de variáveis e baixar o `.env` | Ver variáveis (valores de segredos ficam ocultos) | Leitor, Mantenedor, Administrador, Proprietário |
| Revelar o valor de um segredo | Revelar segredos, mais fazer parte do time do serviço | Mantenedor, Administrador, Proprietário |
| Criar, editar, excluir e copiar variáveis | Editar variáveis, mais fazer parte do time do serviço | Mantenedor, Administrador, Proprietário |

Sem a permissão de ver variáveis, a aba mostra "Sem acesso às variáveis". Todas as regras de permissão são conferidas no servidor (RN-20 e RN-22).

## O que aparece na tela

Escolha o serviço, o ambiente no seletor e a aba **Variáveis de ambiente**. O que você vê é sempre do ambiente selecionado.

### Cabeçalho da seção

O título é **Variáveis em** o ambiente, com a descrição "N variáveis. Segredos ficam cifrados; revelar fica registrado na auditoria." e, à direita, as ações:

- o link **Baixar .env (sem segredos)**, para todo mundo que vê as variáveis;
- o botão **Copiar de outro ambiente**, para quem pode editar e só quando existe mais de um ambiente;
- o botão **Nova variável**, para quem pode editar.

### Tabela

| Coluna | O que mostra |
|---|---|
| **Nome** | A chave da variável, em fonte monoespaçada, com o selo **segredo** quando for o caso. |
| **Valor** | O valor em texto aberto ("(vazio)" se não houver), ou, para segredos, `••••••` (sem permissão) ou `•••••• revelar` (com permissão). |
| **Descrição** | A descrição em Markdown, ou "—". Some em telas estreitas. |
| Ações | **Editar** e **Excluir**, só para quem pode editar. |

A lista é ordenada pelo nome da chave e paginada (10 por página por padrão), com a barra "Mostrando 1–10 de 45 variáveis", o seletor **Por página** e os números de página. Editar uma variável não tira você da página em que estava.

Sem variáveis no ambiente, a aba mostra "Nenhuma variável em" o ambiente. Quem pode editar usa **Nova variável**.

Todo modal desta aba segue o padrão do hub: título e **×** no alto, o formulário no meio e, no rodapé fixo, **Cancelar** à esquerda e a ação principal à direita (por exemplo, **Adicionar variável**). Se você digitou algo, o **×**, o **Cancelar**, o Esc e o clique fora perguntam "Descartar o que você digitou?" antes de fechar.

## O que dá para fazer

### Criar uma variável

1. Clique em **Nova variável**. O modal se chama **Nova variável em** o ambiente.
2. Digite o **Nome**, que é obrigatório. Ele é convertido para maiúsculas e só aceita letras, números e `_`, começando por letra ou `_` (por exemplo, `DATABASE_URL`).
3. Digite o **Valor em** o ambiente, de até 10.000 caracteres. Num segredo, o campo mostra pontos em vez do texto.
4. Marque **Segredo (fica cifrado e oculto)** se o valor for sensível.
5. Se quiser, abra **Detalhes opcionais** e escreva uma **Descrição (Markdown)**: para que serve, formato esperado, quem fornece.
6. Clique em **Adicionar variável**. O modal fecha e a variável aparece na lista, em ordem alfabética.

Quando o nome parece um segredo (contém `SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE`, `CREDENTIAL`, `API_KEY`, `ACCESS_KEY`, `DSN` ou `CONNECTION_STRING`, entre outros, ou termina em `_KEY`), o hub marca **Segredo** sozinho ao criar. Se você desmarcar, aparece a caixa **Confirmo que pode ficar visível**, e sem ela o hub recusa salvar em texto aberto, com a mensagem "`CHAVE` parece um segredo. Marque "segredo" ou confirme que pode ficar visível." (RN-83).

### Editar uma variável

1. Na linha da variável, clique em **Editar**. Abre o modal **Editar** a chave **em** o ambiente.
2. Altere o valor, a descrição ou a marca de segredo. O nome não muda; para renomear, crie outra e exclua a antiga.
3. Clique em **Salvar variável**. Para desistir, use **Cancelar**.

O modal de edição abre a partir do endereço da página (`?var=` e o nome da chave) e respeita a página da lista em que você estava. Ao fechá-lo, você volta para essa mesma página da lista, com o mesmo **Por página**.

Ao editar um **segredo**, deixe o valor em branco para manter o segredo atual (RN-84). Só um valor preenchido substitui o anterior.

### Revelar um segredo

1. Na linha do segredo, clique em `•••••• revelar`.
2. O valor aparece na hora, com os links **copiar** (para a área de transferência) e **ocultar**.

Cada revelação é registrada na [Auditoria](/admin/auditoria) com a chave, o ambiente e quem revelou, mas nunca o valor (RN-85). Quem não é do time do serviço vê a mensagem "Só quem é do time do serviço pode revelar segredos."

### Excluir uma variável

Na linha da variável, clique em **Excluir**. A linha passa a dizer "Variável excluída" e mostra o botão **Desfazer** por alguns segundos. Se você não desfizer, a variável é apagada ao fim desse prazo, mesmo que você saia da tela, e a exclusão fica registrada na [Auditoria](/admin/auditoria). Depois disso não há como recuperar o valor: para ter a variável de volta, crie-a de novo.

### Baixar o `.env`

O link **Baixar .env (sem segredos)** entrega um arquivo `<slug>.<ambiente>.env` com as variáveis do ambiente atual. Segredos saem com o valor em branco (RN-86) e um comentário. O arquivo tem este formato:

```bash
# Pedidos API · Homologação · gerado em 2026-09-29T14:03:12.000Z

# segredo: peça a quem mantém o serviço
API_KEY=
DATABASE_URL=postgres://pedidos@db-hml.suaempresa.internal:5432/pedidos
LOG_LEVEL=info
```

As chaves saem em ordem alfabética, e valores com espaços ou caracteres especiais vão entre aspas. Cada download é registrado na auditoria, com a frase "exportou as variáveis (.env)".

### Copiar chaves entre ambientes

Quando existe mais de um ambiente, quem pode editar vê **Copiar de outro ambiente**. Use-o para começar um ambiente novo a partir de outro.

1. Vá ao ambiente de **destino** (o que vai receber as chaves).
2. Clique em **Copiar de outro ambiente**. O modal se chama **Copiar chaves para** o ambiente de destino.
3. Em **Copiar de qual ambiente?**, escolha o ambiente de origem. Se só existe um outro ambiente, ele já vem escolhido.
4. Clique em **Copiar variáveis**. O modal fecha e as chaves novas aparecem na lista.

O resultado segue a regra RN-87:

- chaves que já existem no destino **não são alteradas**;
- variáveis comuns chegam com o valor;
- segredos chegam **vazios**, e você precisa preenchê-los no destino, editando cada um;
- se todas as chaves já existiam no destino, nada muda.

## Regras importantes

- **Por serviço e por ambiente (RN-82).** Uma variável pertence a um serviço e a um ambiente, e a mesma chave existe uma vez por ambiente. Segredos ficam cifrados e o valor nunca é exibido na lista.
- **Nome com cara de segredo (RN-83).** Não pode ser salvo em texto aberto sem confirmação explícita.
- **Segredo em branco mantém o valor (RN-84).** Editar sem preencher o valor não apaga o segredo.
- **Revelar é auditado (RN-85).** Exige a permissão e ser do time do serviço.
- **`.env` sem segredos (RN-86).** O arquivo baixado nunca leva o valor de um segredo.
- **Copiar não sobrescreve (RN-87).** Nem leva segredos.
- **Nada de valores na auditoria (RN-88).** A auditoria registra a chave, o ambiente e se é segredo; nunca o valor.

Veja o texto completo dessas regras em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Segredos, .env e cópia entre ambientes](/receitas/segredos-e-env): um passo a passo com um cenário real.
- [Página do serviço](/uso/servico): as outras abas do serviço.
- [Auditoria](/admin/auditoria): confira quem revelou ou exportou variáveis.
