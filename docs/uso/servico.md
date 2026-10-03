---
description: "A página de um serviço no Rizoma: cabeçalho, seletor de ambiente e as abas de documentação, regras, integrações, variáveis e configurações."
---

# Página do serviço

Cada serviço do catálogo tem uma página própria, com tudo o que a equipe precisa saber sobre ele: quem cuida, de onde vem a spec, a documentação da API por ambiente, as regras de negócio, as integrações e as variáveis de ambiente. Esta página descreve cada parte dela e é para quem consulta ou mantém um serviço.

## Para que serve

A página também mostra os **canais** que o sistema oferece (HTTP, gRPC, WebSocket), o resumo da última publicação, a comparação com outro ambiente e o `hub.json` gerado para o repositório. Frontend e worker não precisam de spec OpenAPI: a aba de documentação lista os endpoints que eles chamam. Veja [hub.json do repositório](/receitas/hub-json).

## Quem vê

Quem tem a permissão de ver o catálogo e enxerga o serviço (RN-30):

- serviços com visibilidade **Toda a empresa** abrem para qualquer pessoa ativa;
- serviços com **Só o time responsável** abrem apenas para o time e para quem vê serviços restritos de outros times; para os demais a página responde "não encontrada";
- serviços **arquivados** só abrem para quem pode gerenciá-los.

O que cada pessoa faz dentro da página depende do papel e do time. As ações de edição valem para serviços do **próprio time**, a menos que a pessoa tenha a permissão de editar qualquer serviço. Veja [Papéis e permissões](/referencia/permissoes).

## O endereço da página

O endereço é `/services/<slug>`, por exemplo `/services/pedidos-api`. Dois parâmetros controlam o que aparece:

| Parâmetro | Valores | Efeito |
|---|---|---|
| `env` | O identificador de um ambiente, como `hml` | Escolhe o ambiente. Sem ele, vale o ambiente de produção (ou o primeiro da lista). |
| `tab` | `api`, `rules`, `integrations`, `variables` ou `config` | Escolhe a aba. Sem ele, abre a **Documentação da API**. |
| `compare` | O identificador de outro ambiente | Compara a spec atual deste ambiente com a daquele. |

Se você abrir um endereço com um `env` ou `tab` inválido (por exemplo, um link salvo errado), o hub corrige a URL para o que está sendo mostrado.

![Página de um serviço, com a documentação da API](/prints/05-servico-documentacao.png)

*A página de um serviço. O cabeçalho atual mostra Time, Repositórios e Origem da spec, e há um seletor de ambiente acima das abas.*

## O que aparece na tela

### Cabeçalho

O topo da página resume o serviço:

- o link **Catálogo**, para voltar à lista;
- o **nome** do serviço, seguido da **situação** (Experimental, Em produção ou Descontinuado) e, se for o caso, de **Arquivado**;
- o link **Editar serviço**, para quem pode gerenciá-lo (veja [Editar e arquivar serviços](/admin/editar-servico));
- a descrição;
- três blocos: **Time**, **Repositórios** e **Origem da spec**.

| Bloco | O que mostra |
|---|---|
| **Time** | O nome do time responsável (ou "Sem time responsável") e as pessoas do time. |
| **Repositórios** | Os repositórios ligados ao serviço, com link para o código e, entre parênteses, o papel de cada um (por exemplo, `source` ou `client_sdk`). Sem nenhum, aparece "Nenhum vinculado." e, para quem pode, o atalho **+ Vincular repositório**. |
| **Origem da spec** | De onde vem a spec: **Enviada pelo CI**, **Arquivo no repositório**, **Lida de uma URL** ou **Importação manual**. Para as origens que o hub lê sozinho, mostra "Última leitura" com data e hora e, se a última leitura falhou, o erro em vermelho. |

### Situação do serviço

A situação é uma informação de ciclo de vida, definida na edição do serviço:

| Situação | Como aparece |
|---|---|
| **Em produção** | Texto discreto ao lado do nome. No Catálogo, não ganha selo. |
| **Experimental** | Texto discreto ao lado do nome e selo de atenção no Catálogo. |
| **Descontinuado** | Texto em vermelho ao lado do nome e selo vermelho no Catálogo. |

Um serviço descontinuado continua com a documentação disponível, mas sinaliza para quem consome que deve migrar.

### Serviço arquivado

Quando um serviço é arquivado, o cabeçalho mostra **Arquivado** ao lado do nome. O serviço some do Catálogo e do mapa e seus tokens de publicação são revogados (RN-32), mas o histórico de specs continua guardado. Só quem pode gerenciá-lo abre a página, e é lá que a restauração acontece, em **Editar serviço**.

### Seletor de ambiente

Logo abaixo do cabeçalho há um botão para cada ambiente cadastrado (por exemplo, Desenvolvimento, Homologação e Produção). O ambiente atual fica destacado, e o de produção leva um escudo e a marca "prod". Quando você está em produção, o hub avisa "Você está vendo produção."

O ambiente vale para as abas **Documentação da API**, **Integrações** (que mostra o endereço da integração naquele ambiente), **Variáveis de ambiente** e **Configurações** (a spec publicada é a daquele ambiente). As **Regras de negócio** valem para todos os ambientes. Ao trocar de ambiente, você continua na mesma aba.

### As abas

As abas ficam logo abaixo do seletor. Trocar de aba limpa a versão, a página de regras e a edição que estavam abertas.

## Aba Documentação da API

Mostra a spec OpenAPI/Swagger publicada no ambiente escolhido, renderizada pelo Scalar. Você navega pelos grupos de operações no menu lateral do leitor, pesquisa dentro da spec, vê parâmetros, exemplos e respostas, e baixa o documento OpenAPI.

::: info Um leitor sem chamadas para fora
O hub é privado, então o leitor roda sem recursos que enviam dados para fora: não há "testar requisição", assistente de IA, compartilhamento nem telemetria (RN-S15). Os textos fixos do próprio leitor podem aparecer em inglês; o conteúdo vem da spec.
:::

### Versões

Acima do leitor, a linha **Versões em** o ambiente lista as versões publicadas ali, da mais recente para a mais antiga (até 20). A versão atual leva um ponto (por exemplo, `2.4.0 ●`) e abre por padrão. Clique em outra para lê-la; passe o mouse para ver a data, a origem e a branch em que foi publicada.

Cada ambiente tem o seu histórico. Enviar de novo a mesma spec para o mesmo ambiente não cria uma versão nova (RN-42).

Se a versão nova remove um path ou um método, a página mostra "A versão X removeu endpoints". Com SMTP salvo, o hub também manda e-mail para Owner e Admin ativos, para as pessoas ativas do time deste serviço e para as pessoas ativas dos times que o consomem ou que chamam o endpoint removido. Sem SMTP, o aviso fica só nesta página.

### Quando ainda não há spec

Se o ambiente não recebeu nenhuma spec, a aba mostra **Sem spec em** o ambiente, com a explicação conforme a origem configurada:

| Origem | O que a aba diz |
|---|---|
| **Enviada pelo CI** | O CI publica a spec quando uma branch daquele ambiente passa pelo pipeline. Há os botões **Como configurar o CI** (abre a documentação) e, para quem pode, **Gerar token de publicação**. |
| **Arquivo no repositório** | A spec é lida do repositório, na branch de leitura do ambiente. A sincronização fica em **Configurações**. |
| **Lida de uma URL** | A spec é lida da URL configurada. A sincronização fica em **Configurações**. |
| **Importação manual** | A publicação fica na aba **Configurações**. |

Se a versão atual veio de um jeito diferente do configurado (por exemplo, você importou à mão um serviço configurado como "CI envia"), um aviso amarelo explica a divergência e oferece **Revisar em Editar serviço**.

::: tip Spec inválida?
O hub aceita OpenAPI 3.0, 3.1 e Swagger 2.0, em JSON ou YAML, com até 5 MB, e a spec precisa ter `info` e `paths`, `webhooks` ou `components`. Se algo estiver errado, a mensagem de erro diz o que faltou.
:::

## Aba Regras de negócio

As páginas em Markdown que o time escreve sobre o serviço: o que ele faz, as regras que aplica e os pontos de atenção. Há uma lista de páginas à esquerda e o conteúdo à direita, e quem pode editar ganha os botões de criar, editar e excluir. As regras valem para todos os ambientes.

O detalhe completo está em [Regras de negócio](/uso/regras-de-negocio).

## Aba Integrações

Mostra como o serviço se liga ao resto do ecossistema.

**Canais** lista HTTP, gRPC e WebSocket que este sistema oferece, com o endereço de cada ambiente. Quem edita o serviço adiciona e remove. O HTTP da spec continua valendo mesmo sem um canal extra.

### Outros serviços do hub

O título é **Outros serviços do hub**, com a descrição "Dependências entre este serviço e os demais." e o link **Ver no mapa**, que abre o [Mapa de ligações](/uso/mapa) já focado neste serviço. A tabela tem:

| Coluna | O que mostra |
|---|---|
| **Direção** | **sai daqui** (este serviço depende do outro) ou **chega aqui** (o outro depende deste). |
| **Serviço** | O outro serviço, com link para a página dele no mesmo ambiente. |
| **Relação** | A frase da ligação, por exemplo "este serviço consome a API de Estoque". |
| **Origem** | **declarado na spec** ou **manual**. Some em telas estreitas. |

Sem ligações, aparece "Nenhuma ligação registrada". Os vínculos são criados em [Serviços e repositórios](/admin/servicos-e-vinculos), no [Mapa de ligações](/uso/mapa) ou pela própria spec, com `x-api-hub.dependsOn` (veja a [extensão x-api-hub](/referencia/extensao-x-api-hub)).

### Integrações externas

A seção **Integrações externas** lista as APIs de terceiros, filas, webhooks e bancos usados pelo serviço, com o endereço no ambiente escolhido. As colunas são:

| Coluna | O que mostra |
|---|---|
| **Integração** | O nome (link para o detalhe), o tipo, o provedor e a observação do vínculo. |
| **Relação** | Como este serviço usa a integração: consome, fornece, publica em, assina, lê de, grava em, envia ou recebe webhook. |
| **Endereço em** o ambiente | O endereço cadastrado para aquele ambiente, ou "não informado". |
| **Também usam** | Os outros serviços que usam a mesma integração, na frase "Pedidos publica em Fila pedido.criado". Some em telas estreitas. |

Quem pode editar o serviço vê o botão **Remover** em cada linha (a remoção é imediata) e o botão **Ligar integração**, que abre o modal **Ligar integração externa**:

1. Escolha a **Integração** na lista, agrupada por tipo.
2. Escolha em **Este serviço…** a relação. As opções mudam com o tipo (RN-81): uma fila aceita "publica em" e "assina"; um banco aceita "lê de" e "grava em".
3. Se quiser, escreva uma **Observação** em Markdown, por exemplo "publica `pedido.criado` depois do pagamento aprovado".
4. Clique em **Ligar integração**. A resposta é "Integração ligada." ou "Essa ligação já existe."

Se nenhuma integração existe ainda, o vazio aponta **Ligar integração**. O cadastro da integração em si fica em [Integrações externas](/uso/integracoes).

As duas tabelas da aba têm paginação própria, com 10 linhas por página.

## Aba Variáveis de ambiente

Lista as variáveis do serviço no ambiente escolhido. Segredos ficam cifrados e só aparecem sob pedido, para quem tem permissão, e cada revelação fica registrada na auditoria. Quem pode editar cria, altera e exclui variáveis, copia chaves de outro ambiente e baixa o `.env` do ambiente.

O detalhe completo está em [Variáveis de ambiente](/uso/variaveis).

## Aba Configurações

Publicar a spec e o `hub.json` ficam aqui, fora da leitura do contrato. Os canais ficam em **Integrações**.

**Publicar spec** abre pelo botão do ambiente selecionado no topo. Quem pode publicar escolhe **Enviar arquivo** (JSON ou YAML, até 5 MB) ou **Colar conteúdo** e clica em **Publicar spec**. A resposta é "Versão 2.4.0 publicada em Homologação." ou "Essa spec já existia (v2.4.0)." se o conteúdo for idêntico a uma versão existente. Serviços que leem de repositório ou URL também têm **Sincronizar agora**.

**hub.json** mostra o arquivo gerado para a raiz do repositório. **Sincronizar repositório** preenche descrição, tecnologias, README e o caminho da spec quando esses campos ainda estão vazios. Se o hub e o Git discordam, o conflito aparece nessa aba. Se o token não grava sozinho, copie o `hub.json` dali.

## Regras importantes

- **Visibilidade (RN-30).** Serviço restrito ao time não abre para quem está fora dele.
- **Ambiente por spec (RN-42, RN-46).** Cada ambiente guarda o próprio histórico de versões, e a mais recente é a padrão.
- **Origem da spec (RN-93).** Cada serviço escolhe uma origem: CI envia, arquivo no repositório, URL ou importação manual. Ela se altera em **Editar serviço**.
- **Próprio time (RN-22).** Importar spec, editar regras, editar variáveis e ligar integrações valem para serviços dos times de que você participa, salvo quem pode editar qualquer serviço.
- **Arquivado (RN-32).** Some do catálogo e do mapa, revoga os tokens e mantém o histórico.

## Próximos passos

- [Regras de negócio](/uso/regras-de-negocio): escrever e ler as páginas do time.
- [Variáveis de ambiente](/uso/variaveis): segredos, revelar, `.env` e copiar entre ambientes.
- [Editar e arquivar serviços](/admin/editar-servico): mudar dados, origem da spec e situação.
- [Do zero ao primeiro serviço](/receitas/primeiro-servico): um passo a passo completo.
