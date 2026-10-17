---
description: O que fazer quando o banco não conecta, as chaves estão vazias, o login recusa a URL de retorno, o CI recebe 401 ou 422, ou o Docker no Windows não sobe.
---

# Solução de problemas

Comece pelo sintoma. Os passos longos estão nas páginas de instalação; esta página junta o diagnóstico.

## Banco de dados

| Sintoma | O que fazer |
|---|---|
| `Can't reach database server`, `P1001` ou `ECONNREFUSED` em `localhost:5432` | O PostgreSQL não está escutando. Abra o Docker Desktop e rode `pnpm db:up`. Espere `healthy` em `docker compose ps`. |
| `Docker Desktop is unable to start` ou o pipe `dockerDesktopLinuxEngine` não existe | No Windows 10 Home o motor do Docker depende do WSL 2. Instale com `wsl.exe --install --no-distribution` (como administrador) e **reinicie o Windows**. Depois abra o Docker Desktop de novo. |
| `Environment variable not found: DATABASE_URL` | Falta `packages/db/.env`. Copie o `.env` da raiz para `packages/db` e para `apps/web`. |
| Assistente diz que conectou, mas a etapa **Banco de dados** não avança | As migrações não foram aplicadas. Rode `pnpm db:deploy` e clique em **Verificar novamente**. |
| `password authentication failed` no container `migrate` ou `web` | `POSTGRES_PASSWORD` mudou depois que o volume foi criado. Veja [Trocar a senha](/instalacao/docker#trocar-a-senha-do-postgresql-depois-de-instalado). |
| Porta 5432 ocupada | Outro PostgreSQL no Windows está na mesma porta. Pare o serviço ou mude a porta no `docker-compose.yml` e na `DATABASE_URL`. |

## Chaves e sessão

| Sintoma | O que fazer |
|---|---|
| `ENCRYPTION_KEY não definida` no `POST /api/setup` | `pnpm setup:keys` só imprime os valores. Cole `ENCRYPTION_KEY` e `AUTH_SECRET` no `.env` da raiz e copie para `apps/web/.env` e `packages/db/.env`. Reinicie o `pnpm dev`: o Next lê o `.env` na subida. |
| `MissingSecret` / `Please define a secret` | `AUTH_SECRET` vazio ou o `.env` não chegou em `apps/web`. |
| `ENCRYPTION_KEY precisa ter 32 bytes em base64` | A chave foi cortada ou está entre aspas a mais. Gere de novo com `pnpm setup:keys`. Não troque a chave depois que já existem segredos cifrados: eles ficam ilegíveis. |
| Mudei o `.env` e nada mudou | Em desenvolvimento, reinicie o `pnpm dev`. Em Docker, `docker compose --profile app up -d --force-recreate web`. Variáveis `NEXT_PUBLIC_` são gravadas no **build**, não na subida do container. |

## Login e assistente

| Sintoma | O que fazer |
|---|---|
| `redirect_uri_mismatch` ou erro de URL de retorno | `AUTH_URL`, a URL aberta no navegador e a callback cadastrada no provedor precisam ser o mesmo host. Em local, use `http://localhost:3000` nos três, não misture com `127.0.0.1`. |
| "A instalação ainda não terminou" | Até concluir o assistente, só a pessoa definida como futuro Proprietário entra (RN-61). |
| "Você ficaria sem forma de entrar" | O hub recusa desligar a única forma de login da sua conta (RN-01). |
| Login por senha bloqueado | Cinco falhas seguidas bloqueiam por 15 minutos (RN-105). |
| Todo mundo foi deslogado | Alguém usou **Encerrar todas as sessões**, suspendeu a conta, trocou a senha ou a recuperação de Proprietário invalidou os JWTs antigos. |

Atrás de um proxy, `AUTH_URL` tem de ser a URL pública com HTTPS, e o proxy precisa encaminhar `X-Forwarded-Proto` e `X-Forwarded-Host`. Veja [HTTPS com proxy](/instalacao/proxy-https).

## Telas e menus

| Sintoma | O que fazer |
|---|---|
| Um item do menu lateral não aparece, ou a página responde "não encontrada" | O menu só mostra o que a sua permissão abre, e uma página sem permissão responde como se não existisse (RN-23). Confira o papel com quem administra. Por exemplo, **Serviços** pede `service:create` ou `service:edit`; **Tokens de CI**, `token:manage`; **Configurações**, `settings:manage` ou `appearance:manage`. |
| `/admin/catalog` ou `/admin/appearance` não abrem a tela de antes | Os endereços antigos redirecionam: `/admin/catalog?t=…` vai para **Serviços**, **Repositórios**, **Vínculos** ou **Tokens de CI**, e `/admin/appearance` vai para a aba **Aparência** de **Configurações**. |
| O modal pergunta "Descartar o que você digitou?" | É o modal-padrão: fechar com Esc, clique fora, × ou **Cancelar** depois de digitar pede confirmação. Escolha **Continuar editando** ou **Descartar**. |
| Não aparece o botão **Salvar** em **Editar serviço** | A barra "Alterações não salvas", com **Descartar** e **Salvar alterações**, só aparece depois de uma mudança. |
| **Ctrl+K** (**⌘K**) não abre a busca | A busca fica desligada durante o tour guiado e não abre por cima de outro modal. Feche o modal e tente de novo, ou clique em **Buscar**. |
| O hub abre no tema errado | A escolha é de cada pessoa. Abra o menu do seu nome, no pé da barra lateral, e escolha **Claro**, **Escuro** ou **Sistema** (este segue o sistema operacional). |

## Publicação pelo CI

| Resposta | Significado |
|---|---|
| 401 `Token ausente` | Falta `Authorization: Bearer ahub_…`, ou o valor não começa com `ahub_`. |
| 401 `Token inválido, revogado ou expirado` | Token revogado, vencido, ou o serviço foi arquivado (arquivar revoga os tokens). |
| 413 | Corpo acima de 5 MB. |
| 422 ambiente | A branch não casa com nenhuma regra, ou o `environment` informado não existe. A resposta lista os ambientes. |
| 422 spec | JSON/YAML inválido, sem `openapi`/`swagger`, sem `info`, ou sem `paths`, `webhooks` nem `components`. |
| 429 | Mais de 30 publicações por minuto naquele token. |
| 201 com `unknownDependencies` | A spec foi gravada, mas algum slug em `x-api-hub.dependsOn` não existe no catálogo. |

`status: "unchanged"` (200) significa que o checksum é igual ao da versão atual daquele ambiente. Não é erro.

## Docker em produção

| Sintoma | O que fazer |
|---|---|
| `web` não sobe e `migrate` falhou | `docker compose --profile app logs migrate` |
| `web` reinicia sem parar | `docker compose --profile app logs web` |
| Erro de permissão de escrita | A imagem é somente leitura. O app só escreve em `/tmp` e no cache do Next. |

## Veja também

- [Desenvolvimento local](/instalacao/desenvolvimento-local)
- [Produção com Docker](/instalacao/docker)
- [Preparar o ambiente](/contribuindo/ambiente)
- [API HTTP](/referencia/api)
