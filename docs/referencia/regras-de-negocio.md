---
description: Catálogo das regras do próprio Rizoma, com os códigos RN citados no código e nas telas. Não confundir com as páginas de regras que cada time escreve sobre a sua API.
---

# Regras de negócio

Os códigos **RN** descrevem as regras do **próprio Rizoma**: quem entra, o que cada papel pode fazer, como uma spec é aceita, o que a auditoria guarda. Eles aparecem nos comentários do código e nas páginas desta documentação.

::: info Dois sentidos
As páginas Markdown de um serviço (a aba **Regras de negócio**) são o texto que o **seu time** escreve sobre a API dele. Elas também podem usar códigos RN, mas esses códigos são da sua empresa, não desta lista. Veja [Regras de negócio do serviço](/uso/regras-de-negocio).
:::

Quando uma regra abaixo cita um intervalo (por exemplo, RN-40 a RN-42), o intervalo é o que o código agrupa naquela função. Os números soltos são os que uma tela ou um comentário nomeia direto.

## Acesso e vínculo

A decisão de cada login vive em `packages/core/src/access-policy.ts`.

| Código | Regra |
|---|---|
| RN-01 | Pelo menos uma forma de login fica ativa. O hub recusa desligar a única forma que você mesmo usa. |
| RN-02 | A pessoa definida no assistente vira OWNER no primeiro login. |
| RN-03 | No GitHub, vínculo é ser membro **ativo** de uma organização aceita. |
| RN-05 | Fora da empresa, com a política **bloquear**, o login é recusado. Quem já tem acesso manual aprovado continua. |
| RN-06 | Quem entrou pelo vínculo perde o acesso ao sair da organização ou do domínio, e fica suspenso. |
| RN-07 | Acesso manual com prazo vencido suspende a pessoa. |
| RN-08 | A suspensão automática por perda de vínculo é desfeita quando a pessoa volta a comprovar o vínculo e a liberação automática está ligada. Suspensão feita por um administrador não se desfaz sozinha. |
| RN-09 | Solicitação de acesso recusada continua recusada até um administrador reabrir. |
| RN-10 | O vínculo é conferido de novo quando a última checagem passou do intervalo configurado (padrão 12 horas). |
| RN-11 a RN-13 | Aprovar ou recusar uma solicitação de acesso. Um ADMIN só concede até MAINTAINER. |
| RN-14 | Suspender encerra as sessões na hora. |
| RN-15 | Enquanto a solicitação está aberta, a pessoa pode explicar quem é e por que precisa de acesso. |

Facebook e e-mail com senha **não** comprovam vínculo (RN-96). Google, GitLab e OIDC usam domínio de e-mail (no Google e no OIDC o e-mail precisa estar verificado). Microsoft aceita o diretório informado ou um domínio aceito (RN-95 a RN-97).

## Papéis e permissões

Nesta página os papéis aparecem pelo código (OWNER, ADMIN, MAINTAINER e VIEWER). Na interface eles se chamam Proprietário, Administrador, Mantenedor e Leitor.

| Código | Regra |
|---|---|
| RN-20 a RN-29 | A matriz de permissões é editável. OWNER sempre tem tudo. `catalog:read` é obrigatória. Permissões administrativas só vão para ADMIN. |
| RN-22 | Sem `service:edit_any`, a pessoa só cria e edita serviços do time de que participa. |
| RN-23 | Rota sem permissão responde como se não existisse. O menu lateral usa a mesma regra de cada página: só mostra o item a quem abre a tela. |
| RN-24 e RN-25 | Ninguém muda o próprio papel. Só um OWNER mexe em OWNER, e nunca no último. |
| RN-30 | Serviço restrito ao time some para quem está fora e não tem `catalog:read_private`. |
| RN-31 | O slug congela depois da primeira spec publicada. |
| RN-32 | Arquivar tira o serviço do catálogo e do mapa e revoga os tokens. O histórico fica. |
| RN-33 | Sem `service:edit_any`, o serviço não sai do próprio time. |
| RN-34 | Só pessoas já ativas entram em times. |

A tabela completa está em [Papéis e permissões](/referencia/permissoes).

## Specs, ambientes e publicação

| Código | Regra |
|---|---|
| RN-40 a RN-42 | A spec precisa ser OpenAPI 3.x ou Swagger 2.0, com `info` e `paths`, `webhooks` ou `components`, até 5 MB. A mesma spec no mesmo ambiente (mesmo checksum) não cria versão nova. |
| RN-43 a RN-45 | O token de CI (`ahub_…`) aparece uma vez. O banco guarda só o hash SHA-256. |
| RN-47 | O hub é a vitrine das specs. O `/docs` público dos serviços pode ser desligado depois que a spec está aqui. |
| RN-50 e RN-121 | Repositório de GitHub, GitLab ou Bitbucket só entra se o token da integração enxergar. "Outro" entra com URL. |
| RN-52 | Um vínculo não aponta para o próprio item. |
| RN-53 | `x-api-hub.dependsOn` na spec vira vínculo marcado como declarado na spec. |
| RN-54 | Apagar esse vínculo à mão não impede que a próxima versão o recrie, se o slug continuar na spec. |
| RN-55 | O foco do mapa mostra a vizinhança até o alcance escolhido (**1º grau**, **2º grau** ou **Tudo**). |
| RN-90 a RN-93 | O ambiente da publicação é o primeiro, na ordem da lista, cuja regra de branch casa. Remover um ambiente exige que ele não tenha specs nem variáveis. A troca de ambiente na tela mantém a aba atual. |
| RN-122 | `{env}` numa URL de leitura vira o identificador do ambiente. |
| RN-123 a RN-126 | Cada serviço escolhe a origem: CI, arquivo no repositório, URL ou importação manual. A sincronização agendada lê URL e repositório. |

O contrato do `POST /api/v1/specs` está na [API HTTP](/referencia/api). A extensão da spec está em [x-api-hub](/referencia/extensao-x-api-hub).

## Instalação, sessão e recuperação

| Código | Regra |
|---|---|
| RN-60 a RN-68 | O assistente tem ordem fixa. Não dá para pular etapa. Depois de concluído, ele não aceita mais escrita. |
| RN-61 | Até concluir, só a pessoa definida como futuro OWNER entra. |
| RN-64 e RN-76 | GitHub e o emissor OIDC são testados antes de salvar. Os outros provedores são gravados como informados. |
| RN-70 a RN-73 | `pnpm admin:recover` roda no servidor, pede "sim/não", promove na hora quem já entrou ou abre uma janela de 60 minutos para quem nunca entrou. A janela aparece em Configurações e cada passo vai para a auditoria. |
| RN-74 | Configurações (login, e-mail, repositórios, ambientes, regras de acesso) exigem `settings:manage`, que por padrão só o OWNER tem. A aba **Aparência** exige `appearance:manage`: quem tem só essa permissão vê só essa aba. |
| RN-75 | Mudar organizações ou domínios marca todo mundo para conferir o vínculo de novo no próximo acesso. |
| RN-77 | **Encerrar todas as sessões** exige digitar `ENCERRAR` e preserva a sessão de quem clicou. |
| RN-78 | A duração da sessão vale para os **próximos** logins. |
| RN-91 | Trocar de banco é reiniciar o servidor com outro `DATABASE_URL`. A etapa de banco do assistente só conclui quando o servidor já alcança o banco e as migrações estão aplicadas. |
| RN-101 | Client secret em branco ao editar um provedor já salvo mantém o secret atual. |

## Variáveis, aparência e auditoria

| Código | Regra |
|---|---|
| RN-80 e RN-81 | Integração externa tem endereço por ambiente. Cada tipo só oferece as relações que fazem sentido para ele. |
| RN-82 a RN-88 | Variáveis por serviço e ambiente. Nome com cara de segredo pede confirmação para ficar em aberto. Segredo em branco na edição mantém o valor. Revelar exige permissão e vai para a auditoria. O `.env` baixa com segredos vazios. Copiar entre ambientes não sobrescreve o que já existe e leva segredos vazios. A auditoria não guarda valores. |
| RN-104 | Senha: 12 a 128 caracteres, pelo menos três tipos (minúscula, maiúscula, número, símbolo), sem sequência comum e sem o e-mail. |
| RN-105 e RN-106 | Login por senha bloqueia depois de 5 falhas seguidas, por 15 minutos. O cadastro aberto, se ligado, cria solicitação de acesso e não revela se o e-mail já existe. |
| RN-107 e RN-108 | Convite e redefinição de senha geram link de uso único. O banco guarda o hash do token. Com SMTP salvo, o hub envia o link e ainda o mostra para copiar. Sem SMTP, quem administra copia o link. |
| RN-110 a RN-113 | A marca do sistema é o nome (2 a 40 caracteres) e a cor de destaque, definidos em **Configurações → Aparência**. O tema Claro, Escuro ou Sistema é de cada pessoa. As duas paletas nascem da cor de destaque, e uma cor que deixaria links e botões abaixo de 4,5:1 de contraste é recusada. |
| RN-S14 | O CSV da auditoria neutraliza células que começam com `=`, `+`, `-` ou `@`. |

As regras de segurança (RN-S) estão em [Segurança](/referencia/seguranca).

## Veja também

- [Conceitos principais](/guia/conceitos): os mesmos termos, sem a numeração.
- [Auditoria](/admin/auditoria): o que cada ação registra.
- [Padrões de código](/contribuindo/padroes-de-codigo): como citar um RN novo no código.
