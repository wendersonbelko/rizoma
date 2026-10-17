---
description: "Os cadastros do Rizoma: as páginas Serviços, Repositórios, Vínculos e Tokens de CI, o modal padrão de criação, o Novo serviço em um passo e a checklist de próximos passos."
---

# Serviços, repositórios, vínculos e tokens

É aqui que os serviços entram no catálogo. O grupo **Cadastros** do menu tem quatro páginas, uma para cada coisa que você cadastra: **Serviços**, **Repositórios**, **Vínculos** e **Tokens de CI**. Esta página é para quem mantém serviços (Mantenedor) e para quem administra o hub. O grupo também tem **Times**, que ganhou uma página própria: veja [Times](/admin/times).

## Para que serve

Antes de a documentação de uma API aparecer no [Catálogo](/uso/catalogo), alguém precisa cadastrar o serviço, ligá-lo ao repositório e ao time e, se o CI for publicar a spec, gerar um token. As quatro páginas fazem isso, e os vínculos que você cria alimentam o [Mapa de ligações](/uso/mapa).

Cadastrar um serviço pede só **nome, time e tipo**. O resto (repositório, origem da spec, token) vira uma lista de próximos passos na página do serviço, para quem tem a informação completar depois.

## Quem vê

Cada item do menu abre a própria página, e a página exige o mesmo que o item exige. Quem não tem a permissão não vê o item, e o endereço responde "não encontrada". Os papéis são os **padrões**; quem administra pode mudar a matriz em [Permissões](/admin/permissoes).

| Página (item do menu) | Endereço | Permissão exigida | Papéis com acesso por padrão |
|---|---|---|---|
| **Serviços** | `/admin/services` | Cadastrar serviços para o próprio time **ou** editar serviços do próprio time | Mantenedor, Administrador, Proprietário |
| **Repositórios** | `/admin/repositories` | Cadastrar repositórios e integrações externas compartilhadas | Mantenedor, Administrador, Proprietário |
| **Vínculos** | `/admin/links` | A mesma de Repositórios | Mantenedor, Administrador, Proprietário |
| **Tokens de CI** | `/admin/tokens` | Gerar e revogar tokens de CI (próprio time) | Mantenedor, Administrador, Proprietário |

Dentro das páginas, algumas ações pedem mais do que a página:

| Ação | Permissão |
|---|---|
| Botão **Novo serviço** | Cadastrar serviços para o próprio time |
| Remover um vínculo que sai de um serviço | O serviço de origem ("De") ser do seu time |
| Arquivar e restaurar um serviço | Arquivar e restaurar serviços (veja [Editar e arquivar serviços](/admin/editar-servico)) |

::: info O endereço antigo continua valendo
Antes, as quatro páginas eram abas de uma tela só, `/admin/catalog`, que se chamava "Serviços e vínculos". O endereço antigo redireciona: `?t=services` (ou `servicos`) vai para Serviços, `repositories` para Repositórios, `links` para Vínculos e `tokens` para Tokens de CI. Os outros parâmetros (`?page=`, `?size=`, `?from=`, `?fromKind=`) são mantidos, e um link do mapa com `?from=` cai em Vínculos.
:::

## Como as quatro páginas funcionam

As quatro seguem o mesmo desenho:

- **Título e frase de apoio.** O título é o nome do item do menu. A frase diz o que a página guarda.
- **Botão de criar no canto direito** (**Novo serviço**, **Novo repositório**, **Novo vínculo**, **Novo token**). Ele abre um modal.
- **A lista do que já existe**, com a paginação padrão do hub ("Mostrando 1–10 de 45", **Por página**, números de página, `?page=` e `?size=` na URL). O cabeçalho da tabela fica fixo enquanto você rola a página.
- **Estado vazio** com o convite a criar o primeiro item.

![Tela de cadastro, de uma versão anterior](/prints/09-servicos-e-vinculos.png)

*De uma versão anterior: as quatro páginas eram abas de uma tela só, "Serviços e vínculos". Hoje cada uma é uma página, com a mesma lista e o mesmo botão de criar.*

### Atalhos para criar

Você não precisa abrir a página para criar. O botão **+ Novo** da barra lateral e a seção **Criar** da busca global (**Buscar**, ou Ctrl+K / ⌘K) abrem o modal certo, já na página dele: **Novo serviço**, **Novo repositório**, **Novo vínculo**, **Gerar token de CI**, **Nova integração**, **Novo time** e **Convidar pessoa**. Só aparecem os que a sua permissão deixa usar. Por baixo, o modal abre pelo fragmento do endereço (`#new-service`, `#new-repository`, `#new-link`, `#new-token`), então um link com esse final abre a página com o modal já aberto.

### O modal padrão

Todo modal de criação do hub funciona do mesmo jeito:

- **Cabeçalho** com o título, uma frase de apoio (quando faz falta) e o botão **×**; **corpo** com rolagem própria; **rodapé** fixo com **Cancelar** à esquerda e a ação principal à direita, sempre um verbo e um objeto ("Criar serviço", "Adicionar repositório", "Criar vínculo", "Gerar token").
- **Campos obrigatórios** têm `*` no rótulo e começam vazios. O que é opcional fica recolhido em **Detalhes opcionais**, que você abre com um clique. Os campos de dentro são enviados mesmo com o bloco fechado.
- **Os erros aparecem ao lado de cada campo**, e dizem como corrigir.
- **Esc, clique fora, × e Cancelar** perguntam "Descartar o que você digitou?" se você digitou algo. As respostas são **Continuar editando** e **Descartar**. Sem nada digitado, o modal fecha direto.
- O modal sempre **recomeça do zero** quando você o abre de novo.

## Página Serviços

A página lista os serviços que você mantém, e a frase de apoio avisa: "Os serviços que você mantém, inclusive os arquivados, que só você e quem administra o hub enxergam." Quem pode editar qualquer serviço vê todos; os demais veem os serviços dos próprios times.

| Coluna | O que mostra |
|---|---|
| **Serviço** | O nome (link para a página do serviço; para um arquivado, link para a edição) e um selo: a situação, se não for "Em produção", ou "Arquivado em" com a data. |
| **Tipo** | **API**, **Frontend** ou **Worker**. Some em telas estreitas. |
| **Time** | O time responsável. |
| Ações | **Editar** (leva a [Editar e arquivar serviços](/admin/editar-servico)) ou, num serviço arquivado, **Restaurar**. |

Se você ainda não mantém nenhum serviço, aparece "Você ainda não mantém nenhum serviço". Quem pode criar vê "Crie o primeiro em Novo serviço. Basta nome, time e tipo."; os demais, "Os serviços dos seus times aparecem aqui."

### Novo serviço, em um passo

O botão **Novo serviço** (só para quem tem a permissão de cadastrar) abre um modal único, sem etapas. A frase de apoio diz: "Nome, time e tipo bastam. O resto você completa na página do serviço."

| Campo | Como preencher |
|---|---|
| **Nome do serviço** `*` | De 2 a 80 caracteres. Em seguida o hub mostra o endereço, como texto pequeno: `/services/pagamentos-api · editar endereço`. |
| **Time responsável** `*` | Escolha um time ("Escolha um time"). A lista traz os seus times; quem pode editar qualquer serviço vê todos. Se você participa de um único time, ele já vem escolhido. |
| **Tipo** | **API**, **Frontend** ou **Worker**. O padrão é **API**. API publica contrato HTTP; frontend e worker entram no mapa pelos vínculos. |
| **Detalhes opcionais** | **Descrição** (até 500 caracteres), **Tags** (digite uma e clique em **+**, até 10, até 30 caracteres cada, em minúsculas) e **Quem pode ver**. |

**O endereço (slug).** É gerado a partir do nome enquanto você não o mexe. Para ajustar, clique em **editar endereço**: o campo **Endereço** abre. Só letras minúsculas, números e hífen, de 2 a 63 caracteres, começando por letra ou número, e único. Se o endereço já existir, o campo mostra "Já existe um serviço com esse endereço. Troque o nome ou edite o endereço."

**Quem pode ver.** **Toda a empresa** (padrão) ou **Só o time responsável**. Este último esconde o serviço do catálogo e do mapa para quem está fora do time (RN-30).

**Sem time.** Se a instalação ainda não tem nenhum time, o modal avisa que o serviço será criado sem time responsável e que dá para definir um depois. Se você não participa de nenhum time e não pode editar qualquer serviço, o botão **Criar serviço** fica desabilitado, com o recado "Você ainda não participa de nenhum time": peça a quem administra para adicionar você a um time.

Clique em **Criar serviço**. O serviço é criado e o hub abre a página dele, em `/services/<slug>`, onde a checklist mostra o que falta.

::: tip A origem da spec nasce como "Enviada pelo CI"
Todo serviço novo nasce com a origem **Enviada pelo CI**. Para mudar, use a checklist da página do serviço ou [Editar e arquivar serviços](/admin/editar-servico).
:::

### Rascunho e a checklist de próximos passos

Enquanto faltar algum passo, quem gerencia o serviço vê na página dele o selo **Rascunho** ao lado do nome e um quadro **Próximos passos**, com a frase "Faltam 3 passos para ele aparecer completo no catálogo e no mapa." A checklist some quando não falta nada, e também some se o serviço está arquivado.

| Passo | Quando está feito | Botão |
|---|---|---|
| **Serviço criado** | Sempre. Mostra o time e a visibilidade. | |
| **Vincular repositório** | Há um repositório com o papel **Código-fonte** ligado ao serviço. | **Vincular**: abre **Novo vínculo** com este serviço já em **De** |
| **Escolher como a spec chega** | Já existe uma spec publicada. | **Configurar**: leva à aba **Configurações** do serviço (`?tab=config`) |
| **Gerar token de CI** | Há um token ativo, dentro da validade. Este passo só existe quando a origem é **Enviada pelo CI**. | **Gerar**: abre **Novo token** com este serviço já escolhido |

Se você não tem a permissão de um passo, o botão some e o texto diz "Peça a quem tem acesso a este cadastro." No fim do quadro, uma nota explica que cada passo é opcional e reversível, e que repositório e CI costumam ser de outra pessoa. O selo **Rascunho** não esconde o serviço: ele já aparece no [Catálogo](/uso/catalogo), com o ponto de saúde de "sem spec", e o selo só diz que ainda está incompleto.

## Página Repositórios

A página lista os repositórios de código que o hub conhece. A frase de apoio lembra: para ligar um deles a um serviço, crie o vínculo em **Vínculos**.

O botão **Novo repositório** abre um modal ("O hub confirma que o repositório existe antes de guardá-lo."). O hub só aceita um repositório que o token da integração enxerga; a exceção é **Outro**, em que você informa a URL (RN-50).

| Campo | Como preencher |
|---|---|
| **Onde está** `*` | GitHub, GitLab ou Bitbucket, conforme as integrações ligadas em **Configurações → Conexões**, mais o GitHub (que também funciona com o token pessoal do seu login) e sempre **Outro**. |
| **Repositório** `*` | O nome completo: `empresa/pedidos-api`. No GitLab, aceita subgrupos: `backend/pagamentos/pix-api`. Em **Outro**, o campo se chama **Nome (grupo/repositório)**. |
| **URL do repositório** `*` | Só em **Outro**. O endereço completo, como `https://git.empresa.com/pedidos`. |
| **Detalhes opcionais** | Só em **Outro**: **Branch padrão**. Se ficar vazia, vale `main`. |

Clique em **Adicionar repositório**. A resposta é "`empresa/pedidos-api` adicionado." ou o motivo da recusa, como "Repositório não encontrado ou sem acesso." e "Sem token do GitHub: configure a integração em Configurações → Conexões." Cadastrar de novo um repositório que já existe só atualiza os dados dele.

Se você escolher **GitHub** sem nenhum token (da instalação ou pessoal), o modal mostra o aviso "O GitHub não tem token configurado": o botão fica desabilitado e o aviso sugere **Configurar em Configurações → Conexões** (para quem pode), pedir a quem administra, entrar com a sua conta do GitHub ou escolher **Outro**. Com o token pessoal, o modal avisa que só aparecem repositórios a que a sua conta tem acesso.

::: tip Repositórios privados
Para repositórios privados, o caminho mais seguro é configurar um token de leitura em [Configurações](/admin/configuracoes) (aba **Conexões**, bloco **Repositórios**).
:::

A tabela **Repositórios cadastrados** mostra:

| Coluna | O que mostra |
|---|---|
| **Repositório** | O nome completo, com link para o código, e a descrição. |
| **Onde está** | GitHub, GitLab, Bitbucket ou Outro. |
| **Branch padrão** | A branch principal. Some em telas estreitas. |

Sem repositórios, aparece "Nenhum repositório cadastrado". Esta página não tem ação por linha: o repositório entra, e o vínculo com os serviços é feito em **Vínculos**.

## Página Vínculos

Um vínculo registra que um serviço ou repositório depende de outro, ou que um repositório pertence a um serviço. Eles alimentam o [Mapa de ligações](/uso/mapa) e a aba **Integrações** de cada serviço. A frase de apoio resume: "Quem depende de quem".

### Criar um vínculo

O botão **Novo vínculo** abre um modal ("Escolha de onde sai e para onde vai. Um item não pode se ligar a ele mesmo."). No alto, **O que ligar** tem três opções lado a lado:

| O que ligar | Campos |
|---|---|
| **Serviço → serviço** | **De**, **Para**, **Tipo de vínculo** |
| **Repositório → repositório** | **De**, **Para**, **Tipo de vínculo** |
| **Serviço → repositório** | **De** (o serviço), **Para** (o repositório), **Papel do repositório** |

**De** e **Para** começam vazios ("Escolha um serviço" ou "Escolha um repositório"), e o botão **Criar vínculo** só habilita quando os dois estão escolhidos. O **Para** nunca oferece o mesmo item do **De**. Em **Serviço → serviço** e **Serviço → repositório**, o **De** só lista os serviços que você mantém; o **Para** de serviço lista qualquer serviço ativo (RN-22).

Os **tipos de vínculo** são: **consome a API de** (o padrão), **publica eventos em**, **assina eventos de**, **compartilha biblioteca com** e **depende de**. Os **papéis do repositório** são **Código-fonte** (o padrão), **SDK cliente**, **Infraestrutura** e **Contrato**.

Em **Detalhes opcionais**, um vínculo entre serviços aceita **Protocolo** (**HTTP**, **gRPC** ou **WebSocket**; a linha do mapa mostra qual) e **Observação**; entre repositórios, só a **Observação**. O vínculo serviço → repositório não tem detalhes.

Clique em **Criar vínculo**. As respostas possíveis são "Vínculo criado.", "Esse vínculo já existe." e "Um item não pode ser vinculado a ele mesmo. Escolha outro em Para." (RN-52). Quando o vínculo é um **Código-fonte**, o hub também sincroniza o repositório do serviço, e a resposta traz o resultado.

::: tip Atalhos que já abrem com o De preenchido
No [Mapa de ligações](/uso/mapa), o botão **+ Vínculo** leva a `/admin/links?from=<id>&fromKind=service#new-link` (ou `fromKind=repository`) e abre este modal com o item em foco no **De**. O botão **Vincular** da checklist e do cabeçalho do serviço faz o mesmo. O **De** só vem preenchido se você pode usá-lo: um serviço que você mantém, ou um repositório.
:::

### Vínculos cadastrados

A tabela **Vínculos cadastrados** lista as ligações entre serviços e entre repositórios, em ordem alfabética:

| Coluna | O que mostra |
|---|---|
| **De** | O item de origem. |
| **Relação** | A relação ("consome a API de"). |
| **Para** | O item de destino. |
| **Origem** | **Declarado na spec** (veio de `x-api-hub.dependsOn`), **Manual** ou **Repositórios**. Some em telas estreitas. |
| Ações | **Remover**. |

Ao clicar em **Remover**, o vínculo é marcado como "Vínculo removido" e aparece **Desfazer** por cerca de 5 segundos. Se você não desfizer, a remoção acontece. Remover um vínculo que sai de um serviço exige que ele seja do seu time. Vínculos detectados na spec podem ser removidos, mas voltam na próxima publicação enquanto a spec continuar declarando a dependência (RN-54).

Sem vínculos, aparece "Nenhum vínculo cadastrado", com o lembrete de que também dá para vincular direto no mapa.

::: info Vínculos serviço → repositório
Eles aparecem no cabeçalho do serviço (**Repositórios**) e no mapa, mas não na tabela desta página, e ainda não há como removê-los pela interface.
:::

## Página Tokens de CI

O token de CI é a credencial que o pipeline usa para enviar a spec de um serviço a cada deploy, pela API `POST /api/v1/specs`. Um token vale só para o serviço a que pertence (RN-45). Veja [Publicar pelo GitHub Actions](/receitas/publicar-pelo-github-actions). A frase de apoio avisa: "O valor aparece só uma vez, quando você gera."

### Gerar um token

1. Clique em **Novo token**. O modal **Novo token de CI** abre. Se você veio da checklist de um serviço, o campo **Serviço** já vem escolhido; se você mantém um único serviço, também. Fora isso, ele começa vazio, de propósito: o token só aparece uma vez, e gerar o do serviço errado é um erro silencioso.
2. Escolha o **Serviço** `*`. A lista traz os serviços ativos que você mantém. Se você não mantém nenhum, o modal explica e só oferece **Fechar**.
3. Dê um **Nome do token** `*`, só para lembrar onde ele será usado (por exemplo, `github-actions`).
4. Em **Detalhes opcionais**, ajuste a **Validade (dias)**, de 1 a 365. O padrão é 90. Depois do prazo, o CI passa a receber 401.
5. Clique em **Gerar token**.
6. **Copie o token agora.** O modal continua aberto e mostra o valor numa caixa, com o aviso "Token criado. Copie agora: ele não aparece de novo." O botão **Copiar token** copia para a área de transferência. O token começa com `ahub_`.
7. Guarde-o como segredo do repositório do serviço (por exemplo, `API_HUB_TOKEN`) e clique em **Fechar**.

::: warning O token só aparece uma vez
O banco guarda apenas o hash SHA-256 (RN-43 e RN-44). Se você perder o token, gere outro e revogue o antigo. Fechar o modal depois de gerar não pergunta se descarta: o token já foi criado.
:::

### Tokens ativos

A lista mostra só os tokens ativos dos serviços que você mantém: quem não pode revogar um token também não o vê.

| Coluna | O que mostra |
|---|---|
| **Token** | O nome e o serviço. |
| **Prefixo** | Os primeiros caracteres do token (`ahub_…`), para identificá-lo. |
| **Expira** | A data de expiração. Quando faltam menos de 14 dias, a data ganha um selo de atenção. |
| **Último uso** | A data da última publicação com o token, ou "Nunca". Some em telas estreitas. |
| Ações | **Revogar**. |

**Revogar** invalida o token na hora, sem confirmação. Só quem mantém o serviço revoga. Tokens vencidos continuam na lista até serem revogados. Quando um serviço é arquivado, todos os tokens dele são revogados (RN-32). Sem tokens, aparece "Nenhum token ativo".

O endereço antigo `#tokens` (o modal abria assim antes) continua funcionando e abre o modal **Novo token de CI**.

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
