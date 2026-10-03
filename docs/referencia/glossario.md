---
description: Definições curtas dos termos usados na documentação e na interface do Rizoma.
---

# Glossário

Definições de uma linha. O contexto de cada termo está em [Conceitos principais](/guia/conceitos).

**Ambiente.** Estágio da API (desenvolvimento, homologação, produção ou o nome que você der). Specs e variáveis são separadas por ambiente.

**Auditoria.** Registro de quem fez uma ação administrativa, quando e sobre o quê. Não guarda valor de segredo.

**Branch de leitura.** Branch que o hub usa ao buscar a spec de um arquivo no repositório, para aquele ambiente.

**Checksum.** Impressão da spec normalizada. A mesma impressão no mesmo ambiente não gera versão nova.

**Cifra.** AES-256-GCM com a `ENCRYPTION_KEY`. Usada no que o hub precisa ler de volta (segredos, client secrets, tokens de repositório).

**Instalação.** A configuração única da empresa neste hub: nome, vínculo, regras de acesso, aparência. O identificador curto não muda depois de concluir o assistente.

**Integração externa.** Dependência que não é um serviço do catálogo: API de terceiro, fila, tópico, webhook, banco, cache, armazenamento ou e-mail.

**Mapa.** Grafo de serviços, repositórios, times e integrações. Também existe como tabela.

**Origem da spec.** De onde a spec daquele serviço vem: CI, arquivo no repositório, URL ou importação manual.

**Papel.** OWNER, ADMIN, MAINTAINER ou VIEWER. Define o conjunto de permissões da pessoa.

**Permissão.** Uma ação nomeada, como `envvars:reveal`. Há 21. A matriz diz quais cada papel tem.

**Pedido de acesso.** Estado de quem entrou e ainda não foi liberado. A pessoa vê uma tela de espera e pode explicar o pedido.

**Regra de branch.** Padrão (`main`, `release/*`, `feature/**`) que associa uma branch a um ambiente. Vale a primeira regra que casar, na ordem dos ambientes.

**Regras de negócio (do hub).** As regras RN desta documentação, sobre o comportamento do produto.

**Regras de negócio (do serviço).** Páginas Markdown que o time escreve sobre a API dele. Valem para todos os ambientes.

**Repositório.** Projeto no GitHub, GitLab, Bitbucket ou uma URL ("Outro"), ligado a serviços com um papel: código-fonte, SDK cliente, infraestrutura ou contrato.

**Segredo.** Variável marcada como sensível. O valor fica cifrado, não aparece na tela e revelá-lo exige permissão e gera auditoria.

**Serviço.** A unidade do catálogo: uma API, com dono, spec, variáveis e ligações. O slug aparece na URL (`/services/pedidos-api`).

**Slug.** Identificador curto em minúsculas, números e hífen. O do serviço congela depois da primeira spec publicada.

**Spec.** Arquivo OpenAPI 3.x ou Swagger 2.0 que descreve a API. Até 5 MB.

**Status da pessoa.** Aguardando, ativo, suspenso ou recusado.

**Time.** Grupo de pessoas responsável por serviços. A pessoa participa como líder ou membro. O time não tem permissões próprias.

**Token de publicação.** Credencial `ahub_…` que o CI usa para enviar a spec de um serviço. Mostrada uma vez. O banco guarda o hash.

**Variável.** Par `NOME=valor` de um serviço em um ambiente.

**Versão.** Uma spec recebida, guardada por serviço e por ambiente. O nome vem de `info.version`. As 20 anteriores à atual ficam navegáveis.

**Vínculo (ligação).** Relação entre serviço, repositório ou integração, desenhada no mapa. Não é o mesmo que vínculo com a empresa.

**Vínculo com a empresa.** Prova de que a pessoa é da organização: organização do GitHub, domínio de e-mail ou diretório Microsoft.

**Visibilidade.** **Toda a empresa** ou **Só o time responsável**. No segundo caso, quem está fora não vê o serviço.
