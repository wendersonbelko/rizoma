---
description: "O que o Rizoma protege e como: cifra, sessão, tokens, leitura de URL, Markdown, renderizador da spec e o que nunca entra no log."
---

# Segurança

Esta página descreve as defesas que o hub aplica hoje. O modelo de ameaça é o de um catálogo interno: as specs e os segredos não devem vazar para fora da empresa, e uma pessoa sem permissão não deve descobrir o que não pode ver. O hub **não** é um gateway e não protege as chamadas das suas APIs.

Quem encontrou uma falha no código deve seguir [Reportar uma vulnerabilidade](/contribuindo/seguranca), sem abrir issue pública.

## O que fica cifrado e o que só vira hash

A `ENCRYPTION_KEY` (32 bytes em base64) cifra com AES-256-GCM o que o hub precisa ler de volta (RN-S04): valores de variáveis marcadas como segredo, client secrets dos provedores, tokens de repositório, cabeçalhos de leitura por URL e tokens OAuth do GitHub (RN-S13). O formato é `v1.<iv>.<tag>.<ciphertext>`. A chave **não** vai para o banco. Trocar a chave torna o que já foi cifrado ilegível.

O que não precisa ser lido de volta vira hash, sem caminho de volta:

| Dado | Como é guardado |
|---|---|
| Token de publicação (`ahub_…`) | SHA-256 (RN-43). O valor completo aparece uma vez. |
| Convite e redefinição de senha | Hash do token de uso único (RN-107). |
| Senha | scrypt com sal aleatório por pessoa, N = 2^15 (RN-S16). |

A verificação de senha gasta o mesmo tempo quando a conta não existe, para não revelar e-mails cadastrados. As regras de composição estão em [Regras de negócio](/referencia/regras-de-negocio) (RN-104). Cinco falhas seguidas bloqueiam o login por 15 minutos (RN-105).

## Sessão

A sessão é um JWT (RN-S03), a mesma estratégia para provedores externos e para e-mail com senha. A duração vem de **Sessão (horas)** e vale para o próximo login (padrão 8 horas).

Suspender, trocar a senha, encerrar todas as sessões ou usar a recuperação de Proprietário (`pnpm admin:recover`) incrementa um contador. Um JWT antigo deixa de valer na próxima requisição, sem esperar expirar.

O tema da interface (Claro, Escuro ou Sistema) é uma preferência de cada pessoa. Ela fica na conta e no cookie `rizoma-theme`, que guarda só essa escolha, por um ano, sem dado de sessão. Mudar de tema não entra na auditoria.

## O que cada pessoa vê

Toda página e ação do hub passa pelo guarda de sessão (`apps/web/src/lib/guards.ts`, RN-S01). Sem a permissão, a rota administrativa responde como inexistente (RN-23, RN-S10). Serviço restrito ao time some do catálogo, do mapa e da URL (RN-30).

O escopo do GitHub no login pede perfil, e-mail e leitura de organizações (RN-S02). Não há permissão de escrita nos repositórios da pessoa.

## Leitura de URL e repositório

Quem cadastra uma URL faz o servidor do hub buscar essa URL. `safeFetchText` recusa o que não é http(s), localhost, loopback, link-local e o serviço de metadados de nuvem (RN-S17). Redes privadas continuam permitidas: serviço interno é o caso de uso. Tempo e tamanho da resposta são limitados.

Publicar pelo CI aceita no máximo 30 requisições por minuto por token. O contador é um `Map` em memória do processo (`apps/web/src/lib/rate-limit.ts`). Com mais de uma instância, cada uma conta separado, e reiniciar zera o contador. Um limite compartilhado está no [roadmap](/arquitetura/roadmap).

## O que a interface não envia para fora

O renderizador da spec (Scalar) sobe sem telemetria, assistente, MCP, compartilhamento, deploy e sem "testar requisição" (RN-S15). Uma chamada de teste sairia do navegador de quem lê, direto para os servidores da spec.

Markdown de regras de negócio não interpreta HTML cru. Links são tratados pelo renderizador do hub (RN-S18).

O assistente, enquanto a instalação não termina, só aceita escrita vinda da própria página (mesma origem, RN-S06). Não há token de instalação: quem alcança a URL pode concluir, por isso a URL deve ficar fora de redes públicas até o fim.

## Auditoria e logs

A auditoria registra quem fez o quê, não o conteúdo sensível (RN-88): valor de variável, cabeçalho de URL e segredo não entram. O CSV neutraliza células que começam com `=`, `+`, `-` ou `@` (RN-S14).

Revelar um segredo é uma ação separada, com permissão própria, e essa ação sim fica registrada.

## O que você precisa cuidar fora do código

- `ENCRYPTION_KEY` e `AUTH_SECRET` fora do repositório, gerados com `pnpm setup:keys`.
- HTTPS na frente do hub. Veja [Proxy reverso](/instalacao/proxy-https).
- A imagem de produção roda sem privilégios, com sistema de arquivos somente leitura. Veja [Produção com Docker](/instalacao/docker).
- Backup do PostgreSQL **e** da `ENCRYPTION_KEY`. Sem a chave, o backup não abre os segredos.

## Veja também

- [Autenticação e acesso](/arquitetura/autenticacao-e-acesso): o caminho de um login no código.
- [Decisões de arquitetura](/arquitetura/decisoes): por que JWT, por que sem token de instalação, por que o renderizador é fechado.
- [Variáveis de ambiente](/instalacao/variaveis-de-ambiente): cada variável e o que ela protege.
