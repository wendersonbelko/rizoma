---
description: "A tela Aparência do Rizoma: título do sistema, os temas claro e escuro, a paleta de nove cores com checagem de contraste, a prévia e como salvar para todo mundo."
---

# Aparência

Na tela **Aparência** você dá a cara da sua empresa ao Rizoma: escolhe o título do sistema, o tema claro ou o escuro e, se quiser, ajusta cada uma das nove cores. As cores são as mesmas da documentação. Esta página é para quem administra o hub.

## Para que serve

O título e as cores aparecem para todo mundo que usa o hub: no menu, no login, na aba do navegador, nos convites e até no mapa e no tour guiado. Trocar de tema não muda nenhuma função, só a aparência. O hub também protege a legibilidade: combinações de cor que ficariam difíceis de ler são recusadas antes de salvar.

## Quem vê

O item **Aparência** do menu abre `/admin/appearance`. A tela exige a permissão de mudar título e tema do sistema, que ADMIN e OWNER têm por padrão. Quem não a tem recebe "não encontrada".

## O que aparece na tela

O título da página é **Aparência**, com a frase "Título do sistema, tema e cores. Vale para todas as pessoas." Em telas largas, a tela se divide em duas partes: à esquerda, o editor (título, tema, paleta e o botão de salvar); à direita, a **prévia**, que acompanha a rolagem.

### Título

A seção **Título** tem um campo, **Nome do sistema**, de 2 a 40 caracteres. Ele aparece "no topo do menu, na aba do navegador, no login e nos convites" (RN-111). O padrão é "Rizoma".

### Tema

A seção **Tema** mostra dois cartões, cada um com uma miniatura das cores. Clique num cartão para escolher o tema; o cartão selecionado ganha uma borda de destaque.

| Tema | Descrição |
|---|---|
| **Claro** | Cinza-sálvia e verdete, o mesmo da documentação. É o padrão. |
| **Escuro** | O verdete da documentação sobre fundo grafite. |

Ao escolher um tema, a paleta abaixo volta às cores dele, descartando os ajustes que você tinha feito.

### Paleta de cores

A seção **Paleta de cores** oferece um seletor de cor para cada uma das nove cores do tema, com o código hexadecimal ao lado (por exemplo, `#0f7a68`):

| Cor | Onde é usada |
|---|---|
| **Fundo** | O fundo geral das páginas. |
| **Painéis** | Cartões, tabelas, formulários e o menu ativo. |
| **Texto** | O texto principal. |
| **Texto secundário** | Descrições, contagens e textos de apoio. |
| **Bordas** | Linhas e divisórias. |
| **Destaque (botões e links)** | Botões, links e itens ativos. |
| **Texto sobre o destaque** | O texto dentro de um botão de destaque. |
| **Pendências** | Avisos e coisas que pedem atenção, como pedidos aguardando. |
| **Perigo** | Erros e ações destrutivas. |

Quando a paleta difere da do tema escolhido, aparece o link **Restaurar cores do tema**, que descarta os ajustes e volta às cores originais.

### Checagem de contraste

Enquanto você mexe nas cores, o hub confere o contraste entre as combinações que importam para a leitura, seguindo o nível AA das diretrizes de acessibilidade (WCAG): razão mínima de **4,5 para 1** (RN-112). As combinações verificadas são:

- **Texto** sobre **Fundo** e sobre **Painéis**;
- **Texto secundário** sobre **Painéis** e sobre **Fundo**;
- **Texto sobre o destaque** sobre **Destaque** (o texto dos botões);
- **Destaque** sobre **Painéis** e sobre **Fundo** (os links);
- **Pendências** sobre **Painéis** e sobre **Fundo**;
- **Perigo** sobre **Painéis**.

Cada combinação abaixo do mínimo entra numa lista em vermelho, com o valor medido, por exemplo "Texto sobre o fundo: contraste 3.2:1, mínimo 4.5:1." Enquanto houver problemas, o botão de salvar fica desabilitado. O servidor repete a checagem ao salvar, então uma combinação ilegível nunca é gravada.

### Prévia

A **Prévia** mostra, ao vivo, um pedaço de tela com as cores atuais: o menu com o título, um serviço de exemplo, textos secundários, um aviso de pendência, um erro e um botão. Um selo avisa que é "Exemplo, não é um dado real". Nada do que você vê ali é salvo até você clicar em **Salvar aparência**.

## O que dá para fazer

### Mudar o título

1. No campo **Nome do sistema**, digite o novo nome (até 40 caracteres).
2. Confira a prévia.
3. Clique em **Salvar aparência**.

### Escolher um tema

1. Clique no cartão do tema em **Tema**.
2. Confira a prévia.
3. Clique em **Salvar aparência**.

### Ajustar uma cor

1. Em **Paleta de cores**, clique no quadrado da cor que quer mudar e escolha outra.
2. Veja o efeito na prévia e confira se a lista de contraste ficou vazia.
3. Clique em **Salvar aparência**.

Se a lista de contraste apontar problemas, escureça o texto ou clareie o fundo (ou o contrário, nos temas escuros) até o valor passar do mínimo. **Restaurar cores do tema** desfaz tudo e volta ao ponto de partida.

### Salvar

O botão **Salvar aparência** fica desabilitado enquanto há problemas de contraste, enquanto o título tem menos de 2 caracteres e durante o salvamento. Ao concluir, o hub responde "Aparência salva para todo mundo." A partir da próxima página que cada pessoa abrir, o hub usa o novo título e as novas cores.

## Regras importantes

- **Cinco temas, nove cores (RN-110).** Você escolhe um tema pronto e pode sobrescrever qualquer uma das nove cores. O hub guarda o tema e só as cores que diferem dele.
- **Título de até 40 caracteres (RN-111).** Aparece no menu, na aba do navegador, no login e nos convites.
- **Contraste mínimo (RN-112).** Combinações ilegíveis são recusadas antes de salvar.
- **Vale para todo mundo (RN-113).** Não é uma preferência por pessoa, e exige a permissão de mudar o título e o tema.
- **Leitor de documentação.** O leitor da spec da API é escuro no tema **Escuro** e claro no tema **Claro**, independente das cores ajustadas.
- **Auditoria.** A mudança fica registrada como "Aparência (tema/paleta) atualizada", com o título e o tema de antes e depois.

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Configurações](/admin/configuracoes): o nome da empresa e as regras de acesso.
- [Auditoria](/admin/auditoria): confira quem mudou a aparência.
- [Visão geral](/admin/): as demais telas de administração.
