---
description: Guarde variáveis e segredos por serviço e ambiente, revele com auditoria, baixe o .env sem segredos e copie as chaves de um ambiente para outro.
---

# Segredos, .env e cópia entre ambientes

Cada serviço tem, em cada ambiente, uma lista de variáveis: as comuns ficam visíveis e os segredos ficam cifrados. Esta receita mostra como cadastrar, editar, revelar, baixar o `.env` e copiar de um ambiente para outro. É para quem mantém um serviço.

::: warning O hub documenta as variáveis; ele não as entrega aos serviços
O Rizoma é um **inventário** das variáveis de cada ambiente, não um cofre de runtime. Não existe API para uma máquina ler variáveis: o único download é o `.env` de uma pessoa logada, com os segredos em branco. O hub também não injeta nada no seu deploy. O valor real precisa chegar ao serviço por onde você já faz isso hoje (cofre de segredos, variáveis do CI, Kubernetes Secrets…).
:::

## Antes de começar

- O serviço já existe e tem pelo menos um ambiente configurado. Veja [Do zero ao primeiro serviço](/receitas/primeiro-servico).
- Você pode editar variáveis daquele serviço: precisa da permissão `envvars:edit` e ser do time responsável (ou ter `service:edit_any`). Com os papéis padrão, MAINTAINER, ADMIN e OWNER têm `envvars:edit`; o VIEWER só lê.
- Para revelar segredos, você precisa de `envvars:reveal` e também ser do time do serviço. ADMIN e OWNER, que têm `service:edit_any`, revelam os segredos de qualquer serviço.
- Quem só tem `envvars:read` (o VIEWER padrão) vê a lista, mas **os valores das variáveis comuns aparecem para essa pessoa**. Só os segredos ficam ocultos.

## Passo a passo

### 1. Abra a aba de variáveis do ambiente certo

No **Catálogo**, abra o serviço, escolha o ambiente no seletor no alto da página e clique na aba **Variáveis de ambiente**. Cada ambiente tem os próprios valores: `DATABASE_URL` em `hml` e em `prod` são linhas diferentes.

### 2. Adicione uma variável comum

Em **Nova variável em** *ambiente*, preencha:

| Campo | O que colocar |
|---|---|
| **Nome** | Letras maiúsculas, números e `_`, começando por letra ou `_` (até 128 caracteres). O hub converte para maiúsculas enquanto você digita. Exemplo: `PAGAMENTOS_BASE_URL`. |
| **Valor em** *ambiente* | O valor daquele ambiente (até 10.000 caracteres). |
| **Descrição (Markdown)** | Para que serve, formato esperado e quem fornece. Aparece na tabela. |

Clique em **Adicionar variável**. A tabela mostra o nome, o valor e a descrição.

### 3. Marque os segredos como segredo

Para senhas, tokens e chaves, deixe marcada a caixa **Segredo (fica cifrado e oculto)**. O valor é cifrado com AES-256-GCM antes de ir para o banco, o campo vira uma caixa de senha e, na tabela, o valor não aparece: só o selo **segredo** e o botão para revelar.

O hub ajuda de duas formas (RN-83):

- Quando o nome parece de segredo, a caixa **Segredo** já vem marcada enquanto você digita. Isso vale para nomes com `SECRET`, `TOKEN`, `PASSWORD`, `PASSWD`, `PWD`, `PRIVATE`, `CREDENTIAL`, `API_KEY`, `ACCESS_KEY`, `DSN`, `CONNECTION_STRING` ou terminados em `_KEY`.
- Se você desmarcar mesmo assim, aparece a caixa **Confirmo que pode ficar visível**. Sem ela marcada, o hub recusa: `X parece um segredo. Marque "segredo" ou confirme que pode ficar visível.`

::: tip Nem todo segredo tem cara de segredo
`DATABASE_URL`, por exemplo, não é detectada, e a URL costuma trazer a senha do banco. Marque **Segredo** por conta própria sempre que o valor não puder ser lido por qualquer pessoa com acesso ao serviço.
:::

### 4. Edite sem perder o segredo

Na linha da variável, clique em **Editar**. O nome fica travado (para trocar o nome, exclua e crie de novo). Nos segredos, o campo de valor vem vazio, com a dica "Deixe em branco para manter o segredo atual." (RN-84):

- Para mudar só a descrição, deixe o valor em branco e clique em **Salvar**. O segredo fica como estava.
- Para trocar o valor, digite o novo e salve.

::: warning Mudar a marcação de segredo
Transformar um **segredo** em variável comum não reaproveita o valor cifrado: digite o valor de novo. Já uma variável comum marcada como segredo mantém o valor que estava no campo.
:::

**Excluir** remove a variável na hora, sem confirmação e sem desfazer.

### 5. Revele um segredo quando precisar

Na linha do segredo, clique em **•••••• revelar**. O valor aparece, com **copiar** e **ocultar**. Se a linha mostra só `••••••` e nenhum botão, você não tem `envvars:reveal` ou não é do time do serviço.

Cada revelação é registrada na **Auditoria**, com quem revelou, o serviço, o nome da variável e o ambiente. O valor nunca entra no registro (RN-85 e RN-88). Para conferir, abra **Auditoria**, procure "Segredo revelado" e clique na frase para abrir o registro. A lista de tipos não tem um grupo só de variáveis; filtre por **Pessoa** e período.

### 6. Baixe o .env sem segredos

No alto da lista, clique em **Baixar .env (sem segredos)**. O arquivo se chama `<slug>.<ambiente>.env`, por exemplo `pedidos-api.hml.env`, e traz os segredos com o valor em branco:

```bash
# Pedidos API · Homologação · gerado em 2026-09-29T14:03:11.000Z

# segredo: peça a quem mantém o serviço
DATABASE_URL=
LOG_LEVEL=info
PORT=8080
# segredo: peça a quem mantém o serviço
STRIPE_API_KEY=
```

Qualquer pessoa que veja o serviço e tenha `envvars:read` pode baixar. O download também fica na auditoria ("Variáveis exportadas (.env)"), com a contagem de variáveis. É um bom ponto de partida para quem entra no time: baixa o arquivo e pede os segredos a quem mantém o serviço.

### 7. Copie as chaves de um ambiente para outro

1. Abra o ambiente de **destino** (o seletor no alto da página). **Copiar de outro ambiente** só aparece para quem edita variáveis, e quando existe mais de um ambiente.
2. Clique em **Copiar de outro ambiente**, escolha o ambiente de origem e clique em **Copiar**.

O que acontece (RN-87):

- **Chaves que já existem no destino não são tocadas**, mesmo que o valor seja diferente.
- Variáveis comuns chegam com o **valor copiado**.
- **Segredos chegam vazios.** A tela avisa: "Preencha os segredos no ambiente de destino."
- Descrições e a marcação de segredo vêm junto.

Depois de copiar, revise cada valor: uma URL de `dev` copiada para `prod` continua apontando para `dev` até você trocá-la. Se tudo já existe no destino, a tela responde "Nada para copiar: todas as chaves já existem."

### 8. Combine as regras do time

- Trate o hub como **inventário e documentação**: use a **Descrição** para dizer onde o valor de verdade mora ("no cofre, caminho `pedidos/hml/db`").
- Deixe o valor real no cofre ou nas variáveis do CI. Quando cadastrar o segredo aqui, faça-o porque o time precisa consultá-lo, e não como a única cópia.
- Não copie valores de produção para ambientes inferiores.
- Se uma pessoa que revelava segredos saiu do time, troque os segredos que ela viu (a Auditoria mostra quais foram revelados).
- Faça backup da `ENCRYPTION_KEY`: se ela for trocada ou perdida, os segredos já salvos ficam ilegíveis. Veja [Atualização e backup](/instalacao/atualizacao-e-backup).

## Como saber que deu certo

- A variável aparece na tabela do ambiente; segredos com o selo **segredo**.
- Ao clicar em **•••••• revelar**, o valor volta igual ao que você salvou, e a **Auditoria** ganha o evento "Segredo revelado".
- O `.env` baixado tem as variáveis comuns preenchidas e os segredos em branco.
- Depois do **Copiar**, a mensagem informa quantas variáveis foram copiadas.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Não aparece **Nova variável** | Você não tem `envvars:edit` ou não é do time do serviço. Peça a alguém do time ou a um administrador. |
| A aba mostra "Sem acesso às variáveis" | O seu papel não tem `envvars:read`. Um administrador pode ajustar em [Papel com permissões sob medida](/receitas/papel-personalizado). |
| `X parece um segredo…` | O nome parece de segredo e a caixa **Segredo** está desmarcada. Marque **Segredo** ou **Confirmo que pode ficar visível**. |
| "Nome inválido: use LETRAS_MAIUSCULAS, números e _." | O nome tem espaço, hífen, acento ou começa por número. |
| "Só quem é do time do serviço pode revelar segredos." | Você tem `envvars:reveal`, mas o serviço é de outro time. Peça a quem é do time. |
| Os segredos aparecem ilegíveis ou dão erro depois de uma migração | A `ENCRYPTION_KEY` do novo servidor é diferente da original. Restaure a chave antiga. |
| A variável copiada tem o valor "velho" | Chaves que já existiam no destino não são sobrescritas. Edite o valor no destino. |
| Excluí uma variável sem querer | Não há desfazer. Crie de novo; segredos precisam ser digitados outra vez. |

## Veja também

- [Variáveis de ambiente](/uso/variaveis): o uso da aba no dia a dia.
- [Papel com permissões sob medida](/receitas/papel-personalizado): por exemplo, um Leitor que não vê variáveis.
- [Auditoria](/admin/auditoria): filtros e exportação dos registros de revelação.
- [Segurança](/referencia/seguranca): como os segredos são cifrados e o que nunca vai para o log.
