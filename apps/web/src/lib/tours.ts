/**
 * Conteúdo do tour guiado (botão "?" flutuante + tour obrigatório no primeiro acesso).
 * Sem import de Prisma nem de código client-only: é seguro usar tanto no servidor
 * (layout, gate) quanto no cliente (HelpButton, TourProvider).
 */
export type TourStep = { selector?: string; title: string; description: string; side?: "top" | "right" | "bottom" | "left" };
export type TourDef = { title: string; description: string; steps: TourStep[] };

const t = (id: string) => `[data-tour="${id}"]`;

/** Primeiro acesso: um panorama do menu, no Catálogo. Não percorre as outras telas. */
export const MANDATORY_TOUR: TourDef = {
  title: "Visão geral",
  description: "O menu do hub e o botão que ensina cada tela.",
  steps: [
    { title: "Bem-vindo", description: "Este primeiro tour é só uma visão geral do menu. Ele não entra em cada tela. Quando você quiser aprender um lugar, a interrogação daquela tela ensina." },
    { selector: t("hub-nav"), title: "Menu completo", description: "Aqui está tudo o que o seu papel pode abrir. O que não aparece nesta lista, você não usa.", side: "right" },
    { selector: t("hub-nav-explore"), title: "Explorar", description: "Catálogo, mapa de ligações e integrações externas. É a parte de ler a documentação e os vínculos entre os serviços, mesmo para quem só lê.", side: "right" },
    { selector: t("hub-nav-registry"), title: "Cadastros", description: "Serviços, repositórios, vínculos, tokens de CI e times: o que você mantém. Cada item abre uma página com o mesmo nome. Só aparece o que o seu papel permite.", side: "right" },
    { selector: t("hub-nav-people"), title: "Pessoas", description: "Quem tem acesso, os convites e as solicitações de acesso, e a matriz de permissões de cada papel. Este grupo só aparece para quem administra o acesso.", side: "right" },
    { selector: t("hub-nav-system"), title: "Sistema", description: "A auditoria do que foi feito no hub e as configurações da instalação (organização, conexões, ambientes e aparência). Só aparece para quem administra.", side: "right" },
    { selector: t("global-search"), title: "Buscar", description: "Atalho Ctrl+K (⌘K no Mac) em qualquer tela: vá para um lugar do menu, ache um serviço pelo nome, endereço ou endpoint e crie algo sem navegar.", side: "right" },
    { selector: t("quick-create"), title: "Novo", description: "Atalhos para criar serviço, vínculo, token de CI, integração, time e convite, com o mesmo formulário de cada cadastro. Só aparece o que você pode criar.", side: "right" },
    { selector: t("help-button"), title: "Interrogação", description: "Toda tela tem este botão. Ele explica a tela e inicia o tour dela, para ensinar a usar aquele lugar.", side: "left" },
  ],
};

export const TOURS: Record<string, TourDef> = {
  "/": {
    title: "Catálogo",
    description: "A tela inicial: a lista de todos os serviços/APIs cadastrados, com busca e um resumo de cada um.",
    steps: [
      { selector: t("catalog-search"), title: "Busca", description: "Busque um serviço por nome, slug, descrição ou endpoint.", side: "bottom" },
      { selector: t("catalog-filters"), title: "Filtros", description: "Restrinja a lista por time, tipo e situação, ou use os atalhos Sem spec e Meus serviços. O endereço da página guarda os filtros, então dá para compartilhar a lista filtrada.", side: "bottom" },
      { selector: t("catalog-list"), title: "Lista de serviços", description: "Cada linha mostra o time, a versão em cada ambiente e os vínculos. Clique no nome para abrir a documentação. A paginação fica no rodapé.", side: "top" },
      { selector: t("user-menu"), title: "Sua conta", description: "Seu nome e seu papel aparecem aqui. Clique para abrir o menu: nele você escolhe a aparência (Claro, Escuro ou Sistema) e sai da conta.", side: "top" },
    ],
  },
  "/graph": {
    title: "Mapa de ligações",
    description: "O grafo de dependências entre serviços, integrações, repositórios, times e pessoas.",
    steps: [
      { selector: t("graph-mode"), title: "Mapa ou lista", description: "Alterne entre o grafo visual e uma tabela navegável por teclado com as mesmas ligações.", side: "bottom" },
      { selector: t("graph-focus"), title: "Foco", description: "O mapa abre no serviço mais conectado, ou no item que você veio ver do catálogo. Troque o foco por aqui, buscando pelo nome.", side: "bottom" },
      { selector: t("graph-depth"), title: "Alcance", description: "1º grau mostra só os vizinhos diretos do foco; 2º grau, também os vizinhos deles; Tudo deixa todos nítidos. O que fica fora do alcance esmaece, não some.", side: "bottom" },
      { selector: t("graph-types"), title: "Tipos", description: "Escolha o que entra no mapa: serviços, integrações externas, repositórios, times e pessoas. O botão avisa quando algum tipo está oculto.", side: "bottom" },
      { selector: t("graph-canvas"), title: "Navegação", description: "Um clique em um item troca o foco para ele; duplo clique abre o serviço, a integração ou o repositório. Arraste para mover o mapa e use os botões de zoom.", side: "top" },
      { selector: t("graph-legend"), title: "Legenda", description: "Mostra a forma de cada tipo de item e o que significa o esmaecido: itens fora do foco.", side: "left" },
      { selector: t("graph-add-link"), title: "Novo vínculo", description: "Abre o cadastro de vínculos. Se o item em foco for um serviço ou repositório, ele já vem no campo De.", side: "left" },
      { selector: t("graph-print"), title: "Print", description: "A câmera baixa uma imagem das ligações em foco (as nítidas na tela), com nome, tipo e o sentido de cada seta. O hub pede confirmação e registra quem tirou o print.", side: "left" },
    ],
  },
  "/integrations": {
    title: "Integrações externas",
    description: "APIs de terceiros, filas, tópicos, webhooks e bancos usados pelos serviços.",
    steps: [
      { selector: t("integrations-header"), title: "O que é uma integração", description: "Qualquer dependência externa que não é um serviço seu — Stripe, uma fila, um banco. Quem tem permissão cadastra uma nova em Nova integração, em até dois passos: identificar e endereçar.", side: "bottom" },
      { selector: t("integrations-filters"), title: "Filtrar por tipo", description: "Restrinja a lista por tipo de integração.", side: "bottom" },
      { selector: t("integrations-list"), title: "Lista de integrações", description: "Cada linha mostra o tipo e quais serviços têm vínculo com aquela integração. Clique no nome para ver os endereços por ambiente.", side: "top" },
    ],
  },
  "/admin/services": {
    title: "Serviços",
    description: "Os serviços que você mantém: cadastro, edição e arquivamento.",
    steps: [
      { selector: t("services-header"), title: "Seus serviços", description: "Os serviços dos seus times, inclusive os arquivados, que só você e quem administra o hub enxergam.", side: "bottom" },
      { selector: t("services-new"), title: "Novo serviço", description: "Abre o cadastro em um passo só: nome, time e tipo. Descrição, tags e visibilidade ficam em Detalhes opcionais. Repositório, spec e token você completa depois, na página do serviço.", side: "left" },
      { selector: t("services-list"), title: "Lista de serviços", description: "Clique no nome para abrir a página do serviço. Editar muda os dados dele; nos arquivados, o mesmo botão restaura.", side: "top" },
    ],
  },
  "/admin/repositories": {
    title: "Repositórios",
    description: "Os repositórios de código que o hub conhece (GitHub, GitLab, Bitbucket ou outro).",
    steps: [
      { selector: t("repositories-header"), title: "Repositórios", description: "Os repositórios cadastrados. Para ligar um deles a um serviço, crie o vínculo em Vínculos.", side: "bottom" },
      { selector: t("repositories-new"), title: "Novo repositório", description: "Escolha onde ele está e informe o nome no formato grupo/repositório. O hub confirma que ele existe antes de guardar.", side: "left" },
      { selector: t("repositories-list"), title: "Lista de repositórios", description: "Mostra onde cada repositório está e a branch padrão. Clique no nome para abri-lo no provedor.", side: "top" },
    ],
  },
  "/admin/links": {
    title: "Vínculos",
    description: "Quem depende de quem: vínculos entre serviços e entre repositórios.",
    steps: [
      { selector: t("links-header"), title: "O que é um vínculo", description: "Registra que um serviço ou repositório se liga a outro. Os vínculos alimentam o Mapa de ligações.", side: "bottom" },
      { selector: t("links-new"), title: "Novo vínculo", description: "Escolha o que ligar, depois De e Para. Os dois campos começam vazios, e um item não pode se ligar a ele mesmo.", side: "left" },
      { selector: t("links-list"), title: "Lista de vínculos", description: "Cada linha mostra De, a relação e Para, e de onde o vínculo veio. Remover tem Desfazer por alguns segundos.", side: "top" },
    ],
  },
  "/admin/tokens": {
    title: "Tokens de CI",
    description: "Tokens que o pipeline de CI usa para publicar a spec de um serviço.",
    steps: [
      { selector: t("tokens-header"), title: "Para que serve o token", description: "O pipeline de CI (GitHub Actions, GitLab CI…) envia a spec do serviço a cada deploy usando um token. Aqui ficam os tokens ativos dos seus serviços.", side: "bottom" },
      { selector: t("tokens-new"), title: "Novo token", description: "Escolha o serviço (ele começa vazio, para você não gerar o token do serviço errado) e dê um nome. O valor aparece uma única vez, com o botão Copiar.", side: "left" },
      { selector: t("tokens-list"), title: "Tokens ativos", description: "Mostra o prefixo, a validade e o último uso de cada token. Revogar corta o acesso do CI na hora.", side: "top" },
    ],
  },
  "/admin/teams": {
    title: "Times",
    description: "Cadastro de times e de quem participa de cada um.",
    steps: [
      { selector: t("teams-new"), title: "Novo time", description: "Abre o cadastro: só o nome é obrigatório. O endereço do time é gerado sozinho e a descrição fica em Detalhes opcionais.", side: "bottom" },
      { selector: t("teams-filters"), title: "Busca e filtros", description: "Busque por time, serviço ou pessoa. Todos, Com membros e Sem membros restringem a lista.", side: "bottom" },
      { selector: t("teams-first"), title: "Lista de times", description: "Clique no nome. A tabela some e aparecem as pessoas daquele time, com foto e nome, para adicionar ou remover.", side: "top" },
    ],
  },
  "/admin/people": {
    title: "Pessoas e acesso",
    description: "Solicitações de acesso, convites, papéis e o histórico de decisões.",
    steps: [
      { selector: t("people-requests"), title: "Solicitações de acesso", description: "Este filtro troca a lista por quem pediu acesso e ainda espera uma decisão.", side: "bottom" },
      { selector: t("people-invite"), title: "Convidar pessoa", description: "Abre o convite: e-mail e papel. O link fica no modal para copiar, e o e-mail sai se o SMTP estiver configurado.", side: "left" },
      { selector: t("people-list"), title: "Pessoas", description: "Clique no nome para mudar o papel. Gerar link de nova senha e suspender o acesso ficam na seção Segurança.", side: "top" },
      { selector: t("people-history"), title: "Histórico", description: "Este filtro mostra aprovações, recusas e os outros eventos de acesso.", side: "bottom" },
    ],
  },
  "/admin/audit": {
    title: "Auditoria",
    description: "Registro de quem fez o quê, em frases, com filtros e exportação.",
    steps: [
      { selector: t("audit-filters"), title: "Filtros", description: "Escolha o tipo de evento, a pessoa e o período (De e Até) e clique em Filtrar. Limpar filtros volta à lista inteira.", side: "bottom" },
      { selector: t("audit-table"), title: "Registros", description: "Cada linha é uma frase: quem fez, o que fez e há quanto tempo. Abra Detalhes para ver a data e a hora, o código da ação, o IP e os dados do evento.", side: "top" },
      { selector: t("audit-export"), title: "Exportar", description: "Baixa em CSV os registros dos filtros atuais, não só a página que está na tela.", side: "left" },
    ],
  },
  "/admin/permissions": {
    title: "Permissões",
    description: "A matriz de permissões por papel: o que cada papel pode fazer, em linguagem simples.",
    steps: [
      { selector: t("permissions-matrix"), title: "Matriz de permissões", description: "Cada coluna é um papel; cada linha, uma permissão. Ao passar o mouse, a linha e a coluna ganham destaque. Uma caixa com traço (—) não se aplica ao papel.", side: "bottom" },
      { selector: t("permissions-rules"), title: "Regras fixas", description: "O Proprietário sempre tem tudo. Ver o catálogo é obrigatório para todo mundo. Permissões administrativas só podem ir para o Administrador.", side: "top" },
      { selector: t("permissions-actions"), title: "Grupos e mudanças", description: "Recolha os grupos que você não vai mexer. Ao marcar ou desmarcar algo, uma barra no rodapé conta as mudanças, e Revisar e salvar mostra quem ganha e quem perde cada permissão antes de gravar.", side: "left" },
      { selector: t("permissions-reset"), title: "Restaurar padrão", description: "Volta a matriz ao padrão de cada papel, depois de uma confirmação. Fica no fim da página, de propósito.", side: "top" },
    ],
  },
  "/admin/settings": {
    title: "Configurações",
    description: "Organização e acesso, conexões, ambientes e sessões, e a aparência (marca) da instalação.",
    steps: [
      { selector: t("settings-header"), title: "Sobre a instalação", description: "Quando foi instalada e quem são os proprietários.", side: "bottom" },
      { selector: t("settings-tabs"), title: "Abas", description: "Organização e acesso, Conexões (login, e-mail, repositórios e webhooks), Ambientes e sessões, e Aparência (nome do sistema e cor de destaque). Cada aba aparece conforme a sua permissão.", side: "bottom" },
      { selector: t("settings-section"), title: "Conteúdo da aba", description: "O que você configura muda conforme a aba escolhida acima. O botão de salvar só aparece quando você muda alguma coisa.", side: "top" },
    ],
  },
  "/services/[slug]": {
    title: "Detalhe do serviço",
    description: "O hub de documentação de uma API: spec, regras, integrações, variáveis e configurações.",
    steps: [
      { selector: t("service-header"), title: "Sobre o serviço", description: "Time responsável, repositórios vinculados, tags e de onde vem a spec da API. Quem gerencia o serviço também vê aqui os próximos passos enquanto ele é um rascunho.", side: "bottom" },
      { selector: t("service-env"), title: "Ambiente", description: "Cada aba abaixo é filtrada pelo ambiente escolhido aqui (desenvolvimento, homologação, produção).", side: "bottom" },
      { selector: t("service-tab-api"), title: "Documentação da API", description: "A spec OpenAPI/Swagger publicada, navegável como referência.", side: "bottom" },
      { selector: t("service-tab-rules"), title: "Regras de negócio", description: "Documentação em Markdown escrita pelo time — o que a API faz e por quê.", side: "bottom" },
      { selector: t("service-tab-integrations"), title: "Integrações", description: "Canais que este sistema oferece, vínculos com outros serviços e integrações externas.", side: "bottom" },
      { selector: t("service-tab-variables"), title: "Variáveis de ambiente", description: "As variáveis de cada ambiente. Segredos ficam cifrados e só aparecem sob pedido.", side: "bottom" },
      { selector: t("service-tab-config"), title: "Configurações", description: "De onde vem a spec, publicar a spec deste ambiente, sincronizar o repositório e copiar o hub.json.", side: "bottom" },
    ],
  },
};

const DYNAMIC_TOURS: { pattern: RegExp; key: string }[] = [
  // /services/algum-slug → tour da tela de detalhe; /services/algum-slug/edit fica de fora
  // (mensagem genérica), porque não é uma tela com tour próprio.
  { pattern: /^\/services\/[^/]+$/, key: "/services/[slug]" },
];

/** Acha a chave de tour certa para um pathname, incluindo rotas dinâmicas. */
export function resolveTourKey(pathname: string): string | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (TOURS[p]) return p;
  return DYNAMIC_TOURS.find((d) => d.pattern.test(p))?.key ?? null;
}

export function getTour(key: string | null | undefined): TourDef | null {
  return key ? (TOURS[key] ?? null) : null;
}
