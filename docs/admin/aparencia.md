---
description: "A aba Aparência de Configurações: o nome do sistema e a cor de destaque (a marca), com prévia nos dois temas, e o tema Claro, Escuro ou Sistema que cada pessoa escolhe no menu do avatar."
---

# Aparência

A **Aparência** tem duas partes. A **marca** (o nome do sistema e a cor de destaque) é igual para todas as pessoas e é definida por quem administra, na aba **Aparência** de [Configurações](/admin/configuracoes). O **tema** (Claro, Escuro ou Sistema) é escolha de cada pessoa, no menu do avatar. Esta página explica as duas.

## Para que serve

O nome e a cor aparecem para todo mundo que usa o hub: no menu, no login, na aba do navegador, nos convites e até no mapa e no tour guiado. Trocar a cor não muda nenhuma função, só a aparência. O hub também protege a legibilidade: uma cor que deixaria links e botões difíceis de ler é recusada antes de salvar.

Já o tema é uma preferência pessoal: quem prefere o escuro usa o escuro, sem mudar nada para os colegas.

## Quem vê

A aba **Aparência** fica dentro de **Configurações** (`/admin/settings?s=appearance`), no grupo **Sistema** do menu. Ela exige a permissão de mudar a marca do sistema, que o Administrador e o Proprietário têm por padrão. Quem tem só essa permissão (sem a de configurações) abre **Configurações** e vê apenas esta aba. Quem não a tem recebe "não encontrada".

O endereço antigo `/admin/appearance`, de quando a Aparência era uma tela própria do menu, redireciona para a aba.

Já o tema pessoal não pede permissão nenhuma: toda pessoa ativa escolhe o dela.

## O tema de cada pessoa

O hub tem dois temas, **Claro** e **Escuro**, e a opção **Sistema**, que segue o que o seu computador ou celular pede. Quem escolhe é você, no **menu do avatar**, no pé da barra lateral:

1. Clique no seu avatar (o bloco com o seu nome e o seu papel).
2. No pop-over, em **Aparência**, escolha **Claro**, **Escuro** ou **Sistema**.

A troca vale na hora, sem recarregar a página. A escolha fica guardada na sua conta, então vale em qualquer aparelho em que você entrar, e também num cookie do navegador (`rizoma-theme`), para a página já abrir no tema certo, sem piscar. Se o hub não conseguir salvar, o seletor volta ao tema anterior e avisa. A escolha de tema não entra na [Auditoria](/admin/auditoria), porque não muda nada para mais ninguém. O mesmo pop-over tem o botão **Sair**.

O leitor da documentação da API (Scalar) segue o seu tema: escuro quando você está no tema Escuro, claro quando está no Claro.

## A marca (aba Aparência)

A aba tem o aviso "Nome do sistema e cor de destaque, iguais para todas as pessoas. Claro, Escuro ou Sistema cada pessoa escolhe no próprio menu, no pé do menu lateral." Em telas largas, o editor fica à esquerda e a **Prévia** à direita.

### Nome do sistema

O campo **Nome** tem de 2 a 40 caracteres. Ele aparece "no topo do menu, na aba do navegador, no login e nos convites" (RN-111). O padrão é "Rizoma".

### Cor de destaque

A **Cor de destaque** é a cor de botões, links e do item ativo do menu. Você escolhe no seletor de cor ou digita o valor hexadecimal, como `#0f7a68` (aceita colar sem o `#`). Enquanto a cor não for a padrão, aparece o link **Voltar ao verdete padrão**, que restaura `#0f7a68`.

Os dois temas nascem dessa cor. No tema Escuro, o hub clareia a cor sozinho até o texto ficar legível, então você escolhe uma cor só e os dois temas ficam bons.

### Checagem de contraste

O hub confere se a cor serve para texto e para botão no tema claro, seguindo o nível AA das diretrizes de acessibilidade (WCAG): razão mínima de **4,5 para 1** contra o fundo e contra os painéis (RN-112). Se a cor for clara demais, aparece, em vermelho, uma mensagem como "Essa cor é clara demais para o tema claro: links e botões ficariam ilegíveis (contraste 3,2:1, o mínimo é 4,5:1). Escolha um tom mais escuro." Um valor que não seja `#rrggbb` também é recusado, com "Use uma cor no formato #rrggbb, por exemplo #0f7a68." O servidor repete a checagem ao salvar, então uma cor ilegível nunca é gravada.

### Prévia

A **Prévia** mostra, ao vivo, um pedaço de tela nos dois temas, lado a lado: o menu com o nome, um serviço de exemplo, um texto secundário, um link, um botão, um aviso de pendência, um erro e um modal. Um selo avisa "Exemplo, não é um dado real". Nada do que você vê ali é salvo até você clicar em **Salvar marca**. Enquanto a cor digitada está incompleta ou ilegível, a prévia mostra a cor padrão em vez de quebrar.

## O que dá para fazer

### Mudar o nome do sistema

1. Em **Configurações**, abra a aba **Aparência**.
2. No campo **Nome**, digite o novo nome (até 40 caracteres).
3. Confira a prévia.
4. Na barra **Alterações não salvas**, clique em **Salvar marca**.

### Mudar a cor de destaque

1. Na aba **Aparência**, em **Cor de destaque**, escolha a cor no seletor ou digite o valor.
2. Veja o efeito nos dois temas da prévia e confira se não apareceu nenhuma mensagem em vermelho.
3. Clique em **Salvar marca**.

Se a mensagem apontar que a cor é clara demais, escolha um tom mais escuro. **Voltar ao verdete padrão** desfaz tudo e volta ao ponto de partida.

### Salvar

O botão **Salvar marca** só aparece depois da primeira mudança, numa barra fixa no pé da tela com **Alterações não salvas**, **Descartar** e **Salvar marca**. **Descartar** volta os campos ao que está salvo. Se o nome tem menos de 2 caracteres ou a cor é recusada, a mensagem aparece na própria barra e nada é gravado. Ao concluir, o hub responde "Marca salva para todas as pessoas." A partir da próxima página que cada pessoa abrir, o hub usa o novo nome e a nova cor.

## Regras importantes

- **Dois temas, uma cor de marca (RN-110).** O tema Claro e o Escuro são fixos; o que a administração escolhe é a cor de destaque, e as duas paletas nascem dela. Não há temas prontos para escolher nem paleta de cores para ajustar. O hub guarda só a cor de destaque da instalação.
- **Nome de até 40 caracteres (RN-111).** Aparece no menu, na aba do navegador, no login e nos convites.
- **Contraste mínimo (RN-112).** Uma cor ilegível é recusada antes de salvar.
- **Marca para todos, tema por pessoa (RN-113).** O nome e a cor valem para todas as pessoas e exigem a permissão de mudar a marca. O tema é de cada pessoa e não exige permissão.
- **Auditoria.** A mudança da marca fica registrada na [Auditoria](/admin/auditoria) como "atualizou a marca (nome e cor de destaque)", com o nome e a cor de antes e depois.

Veja os códigos completos em [Regras de negócio](/referencia/regras-de-negocio).

## Próximos passos

- [Configurações](/admin/configuracoes): as outras abas, como organização, conexões e ambientes.
- [Auditoria](/admin/auditoria): confira quem mudou a marca.
- [Visão geral](/admin/): as demais telas de administração.
