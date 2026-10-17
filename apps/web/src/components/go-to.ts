/**
 * Vai para um endereço do hub a partir da busca global ⌘K ou do "+ Novo".
 *
 * Os atalhos de criação apontam para `/rota#id-do-modal`, e o FormModal abre quando o `#id` aparece
 * no endereço (evento `hashchange`). O router do Next não dispara `hashchange` quando a rota é a
 * mesma da tela atual; então, nesse caso, o hash é posto à mão e o modal abre sem recarregar nada.
 * Em outra rota, o router navega e o modal abre ao montar a tela.
 */
export function goTo(router: { push: (href: string) => void }, href: string) {
  const url = new URL(href, window.location.origin);
  if (url.hash && url.pathname === window.location.pathname) {
    // Mesmo hash já na barra (o modal foi fechado sem limpar): atribuir de novo não dispara o evento.
    if (window.location.hash === url.hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
    else window.location.hash = url.hash;
    return;
  }
  router.push(href);
}
