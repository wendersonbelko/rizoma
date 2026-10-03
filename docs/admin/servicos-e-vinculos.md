---
description: "A tela Serviços e repositórios do Rizoma (título \"Serviços e vínculos\"): as abas Serviços (com o assistente Novo serviço), Repositórios, Vínculos e Tokens."
---

# Serviços e repositórios

É aqui que os serviços entram no catálogo. A tela reúne, em quatro abas, o cadastro de serviços, de repositórios de código, dos vínculos entre eles e dos tokens que o CI usa para publicar specs. Esta página é para quem mantém serviços (MAINTAINER) e para quem administra o hub.

## Para que serve

Antes de a documentação de uma API aparecer no [Catálogo](/uso/catalogo), alguém precisa cadastrar o serviço, ligá-lo ao repositório e ao time e, se o CI for publicar a spec, gerar um token. Essa tela faz tudo isso, e é a origem dos vínculos que alimentam o [Mapa de ligações](/uso/mapa).

## Quem vê

O item **Serviços e repositórios** do menu (grupo **Administração**) abre `/admin/catalog`. A tela exige a permissão de editar vínculos, repositórios e integrações compartilhadas, que MAINTAINER, ADMIN e OWNER têm por padrão. Quem não a tem recebe "não encontrada".

Dentro da tela, algumas partes têm permissões extras (veja a [visão geral](/admin/)):

| Parte | Permissão |
|---|---|
| Assistente **Novo serviço** | Cadastrar serviços para o próprio time |
| Aba **Tokens** | Gerar e revogar tokens de CI (próprio time) |
| Passo de spec inicial do assistente | Importar spec manualmente (próprio time) |

## O que aparece na tela

O título da página é **Serviços e vínculos**, embora o item do menu se chame **Serviços e repositórios**. Abaixo dele há quatro abas, escolhidas pelo parâmetro `?t=` da URL:

| Aba | `?t=` | Para que serve |
|---|---|---|
| **Serviços** | `services` (padrão) | Lista dos serviços que você mantém e o assistente **Novo serviço**. |
| **Repositórios** | `repositories` | Cadastro de repositórios de código. |
| **Vínculos** | `links` | Ligações entre serviços e entre repositórios. |
| **Tokens** | `tokens` | Tokens de publicação para o CI. |

![Tela Serviços e vínculos](/prints/09-servicos-e-vinculos.png)

*A tela de cadastro. Cada assunto fica na sua aba. Criar serviço, repositório, vínculo ou token abre um modal.*

Todas as tabelas da tela têm a paginação padrão do hub ("Mostrando 1–10 de 45", **Por página**, números de página), e trocar de aba volta para a página 1.

## Aba Serviços

### Serviços que você mantém

A seção **Serviços que você mantém** lista os serviços que você pode gerenciar: os do seu time e, para quem pode editar qualquer serviço, todos. A descrição avisa que a lista "inclui os arquivados, que só você e quem administra o hub enxerga."

| Coluna | O que mostra |
|---|---|
| **Serviço** | O nome (link para a página do serviço; para um arquivado, link para a edição) e um selo: a situação, se não for "Em produção", ou "arquivado em" com a data. |
| **Time** | O time responsável, ou "sem time". |
| Ações | **Editar** (leva a [Editar e arquivar serviços](/admin/editar-servico)) ou, num serviço arquivado, **Restaurar**. |

Se você ainda não mantém nenhum serviço, aparece "Você ainda não mantém nenhum serviço" com o convite a cadastrar um no assistente.

### Novo serviço

O botão **Novo serviço** (só para quem tem a permissão de cadastrar) abre um modal com um assistente de quatro passos. O indicador de etapas no topo mostra o progresso: um número para o passo pendente, um contorno para o atual, **✓** para o concluído e **–** para o pulado. Você pode voltar a um passo já feito clicando nele. O título de cada passo diz "Passo 2 de 4 · Time & visibilidade", e os passos 3 e 4 trazem "(opcional)".

::: info O serviço nasce no fim do passo 2
Os passos 1 e 2 formam um único formulário. Só quando você clica em **Criar serviço e continuar** o serviço é criado. Os passos 3 e 4 atuam sobre o serviço que já existe, então, se você fechar a tela depois do passo 2, o serviço continua cadastrado.
:::

#### 1. Preencha os dados básicos

| Campo | Como preencher |
|---|---|
| **Nome** | De 2 a 80 caracteres. |
| **Slug** | O identificador do serviço, usado na URL (`/services/pedidos-api`) e nas dependências declaradas. É gerado a partir do nome enquanto você não o edita à mão. Só letras minúsculas, números e hífen, de 2 a 63 caracteres, começando por letra ou número. Precisa ser único. |
| **Descrição** | Opcional, até 500 caracteres. |
| **Tags** | Opcional. Digite uma e clique em **+**. No máximo 10, de até 30 caracteres cada. Ficam em minúsculas. |

Clique em **Avançar**. Os erros aparecem ao lado de cada campo.

#### 2. Escolha o time e a visibilidade

| Campo | Como preencher |
|---|---|
| **Time responsável** | Quem não pode editar qualquer serviço precisa escolher um dos seus times ("Escolha…"). Quem pode, tem também a opção **Sem time**. |
| **Quem pode ver** | **Toda a empresa** ou **Só o time responsável**. Este último esconde o serviço do catálogo e do mapa para quem está fora do time (RN-30). |

Clique em **Criar serviço e continuar**. Se o slug já existir, o hub responde "Já existe um serviço com esse slug." e volta ao passo 1. Depois de criado, aparece "✓ Serviço … criado", com o link **Ir para o serviço**, e os campos dos passos 1 e 2 ficam só para consulta, com o link **Editar serviço**. Clique em **Continuar**.

#### 3. Vincule o repositório (opcional)

Escolha **Já cadastrado** ou **Cadastrar novo** e defina o **Papel do repositório** (Código-fonte, SDK cliente, Infraestrutura ou Contrato). Para um repositório novo, informe **Onde está** e o nome no formato `dono/repositorio`; para **Outro**, também a URL e a **Branch padrão**. Clique em **Vincular**; para ligar mais de um, use **Vincular outro**. Ao terminar, clique em **Avançar**, ou em **Pular etapa** se não houver nada a vincular. O passo também pode ser feito depois, na aba **Vínculos**.

Se o GitHub não tiver token configurado, um aviso explica que o hub não consegue confirmar o repositório e sugere configurar em **Configurações → Repositórios**, escolher **Outro** ou pular a etapa.

#### 4. Importe a spec inicial (opcional)

Escolha o **Ambiente** (o de produção vem selecionado), depois **Enviar arquivo** (JSON ou YAML, até 5 MB) ou **Colar conteúdo**, e clique em **Importar e concluir**. Para deixar a spec para o CI, clique em **Pular e concluir**. Sem a permissão de importar specs, o passo só oferece **Concluir**. Ao concluir, o hub abre a página do novo serviço.

::: tip A origem da spec continua "CI envia"
Todo serviço novo nasce com a origem **CI envia**. Se você importar a spec à mão, a página do serviço avisa que a versão atual veio de "Importação manual", mas a origem configurada é outra. Ajuste em [Editar e arquivar serviços](/admin/editar-servico) se a importação manual for o caminho definitivo.
:::

## Aba Repositórios

O botão **Novo repositório** abre um modal que cadastra os repositórios de código, para depois ligá-los aos serviços. O hub só aceita um repositório que o token da integração enxerga; a exceção é **Outro**, em que você informa a URL (RN-50).

| Campo | Como preencher |
|---|---|
| **Onde está** | GitHub, GitLab ou Bitbucket, conforme as integrações ativas em **Configurações → Repositórios**, e sempre **Outro**. |
| **Repositório** | O nome completo: `empresa/pedidos-api`. No GitLab, aceita subgrupos: `backend/pagamentos/pix-api`. Em **Outro**, o campo se chama **Nome (grupo/repositório)**. |
| **URL do repositório** | Só em **Outro**. |
| **Branch padrão** | Só em **Outro**. Vem preenchida com `main`. |

Clique em **Adicionar**. A resposta é "`empresa/pedidos-api` adicionado." ou o motivo da recusa, como "Repositório não encontrado ou sem acesso." e "Sem token do GitHub: configure a integração em Configurações → Repositórios." Cadastrar de novo um repositório que já existe só atualiza os dados dele.

::: tip Repositórios privados
Sem token de integração, o hub tenta usar o token do seu próprio login do GitHub. Para repositórios privados, o caminho mais seguro é configurar um token de leitura em [Configurações](/admin/configuracoes) (seção **Repositórios**).
:::

A seção **Repositórios cadastrados** traz a tabela:

| Coluna | O que mostra |
|---|---|
| **Repositório** | O nome completo, com link para o código, e a descrição. |
| **Onde está** | GitHub, GitLab, Bitbucket ou Outro. |
| **Branch padrão** | A branch principal. Some em telas estreitas. |

Sem repositórios, aparece "Nenhum repositório cadastrado".

## Aba Vínculos

Um vínculo registra que um serviço ou repositório depende de outro. Eles alimentam o [Mapa de ligações](/uso/mapa) e a aba **Integrações** de cada serviço.

### Criar um vínculo

O botão **Novo vínculo** abre um modal. Escolha o tipo e preencha os campos:

| Tipo | Campos |
|---|---|
| **Serviço → serviço** | **De**, **Tipo de ligação**, **Para**, **Observação** |
| **Repositório → repositório** | **De**, **Tipo de ligação**, **Para**, **Observação** |
| **Serviço → repositório** | **De** (o serviço), **Papel do repositório**, **Para** (o repositório) |

Os tipos de ligação entre serviços e entre repositórios são: **consome a API de**, **publica eventos em**, **assina eventos de**, **compartilha biblioteca com** e **depende de**. Os papéis de um repositório para um serviço são **Código-fonte**, **SDK cliente**, **Infraestrutura** e **Contrato**.

No tipo **Serviço → serviço**, o campo **De** só lista os serviços que você mantém, e o **Para** lista qualquer serviço ativo (RN-22). Clique em **Criar vínculo**. As respostas possíveis são "Vínculo criado.", "Esse vínculo já existe." e "Um item não pode ser ligado a ele mesmo." (RN-52).

::: tip Atalho pelo mapa
No [Mapa de ligações](/uso/mapa), o botão **+** abre este mesmo formulário. Se houver itens selecionados, o último serviço ou repositório da seleção já vem no campo **De**.
:::

### Vínculos cadastrados

A tabela **Vínculos cadastrados** lista as ligações entre serviços e entre repositórios, em ordem alfabética:

| Coluna | O que mostra |
|---|---|
| **De** | O item de origem. |
| **Relação** | A relação ("consome a API de"). |
| **Para** | O item de destino. |
| **Origem** | **declarado na spec** (veio de `x-api-hub.dependsOn`), **manual** ou **repositórios**. Some em telas estreitas. |
| Ações | **Remover**. |

Ao clicar em **Remover**, o vínculo é marcado como "Vínculo removido" e aparece **Desfazer** por cerca de 5 segundos. Se você não desfizer, a remoção acontece. Vínculos detectados na spec podem ser removidos, mas voltam na próxima publicação enquanto a spec continuar declarando a dependência (RN-54).

::: info Vínculos serviço → repositório
Eles aparecem no cabeçalho do serviço ("Repositórios") e no mapa, mas não na tabela desta aba, e ainda não há como removê-los pela interface.
:::

## Aba Tokens

O token de publicação é a credencial que o pipeline de CI usa para enviar a spec de um serviço a cada deploy, pela API `POST /api/v1/specs`. Um token vale só para o serviço a que pertence (RN-45). Veja [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions).

### Gerar um token

1. Na aba **Tokens**, clique em **Novo token**. O modal **Novo token de publicação (CI)** pede o **Serviço**. A lista traz os serviços ativos que você mantém. O modal fica aberto depois de gerar, para você copiar o segredo.
2. Dê um **Nome**, só para lembrar onde o token será usado (por exemplo, `github-actions`).
3. Defina a **Validade (dias)**, de 1 a 365. O padrão é 90. Depois do prazo, o CI passa a receber 401.
4. Clique em **Gerar token**.
5. **Copie o token agora.** Ele aparece numa caixa, começa com `ahub_`, e o hub avisa "Copie agora. Este token não aparece de novo."
6. Guarde-o como segredo do repositório do serviço (por exemplo, `API_HUB_TOKEN`).

::: warning O token só aparece uma vez
O banco guarda apenas o hash SHA-256 (RN-43 e RN-44). Se você perder o token, gere outro e revogue o antigo.
:::

### Tokens ativos

| Coluna | O que mostra |
|---|---|
| **Token** | O nome e o serviço. |
| **Prefixo** | Os primeiros caracteres do token (`ahub_…`), para identificá-lo. |
| **Expira** | A data de expiração. Quando faltam menos de 14 dias, a data ganha um selo de atenção. |
| **Último uso** | A data da última publicação com o token, ou "nunca". Some em telas estreitas. |
| Ações | **Revogar**. |

**Revogar** invalida o token na hora, sem confirmação. Só quem mantém o serviço revoga. Tokens vencidos continuam na lista até serem revogados. Quando um serviço é arquivado, todos os tokens dele são revogados (RN-32). Sem tokens, aparece "Nenhum token ativo".

## Regras importantes

- **Slug (RN-31).** É único e fica congelado depois que o serviço publica a primeira spec.
- **Um time por serviço (RN-33).** Sem a permissão de editar qualquer serviço, o serviço fica num time seu.
- **Repositórios (RN-50).** Só entram os que o token da integração enxerga, ou "Outro" com URL.
- **Vínculos (RN-51 a RN-54).** Tipos fixos, sem ligar um item a ele mesmo, sem repetir origem, destino e tipo.
- **Tokens (RN-43 a RN-45).** Só o hash fica salvo; aparece uma vez; validade de 1 a 365 dias; revogação imediata.

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Editar e arquivar serviços](/admin/editar-servico): mude dados, origem da spec e situação.
- [Do zero ao primeiro serviço](/receitas/primeiro-servico): o caminho completo, do cadastro à primeira publicação.
- [Times](/admin/times): crie o time responsável antes de cadastrar o serviço.
- [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions): use o token no CI.
