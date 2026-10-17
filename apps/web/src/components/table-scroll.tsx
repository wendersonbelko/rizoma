"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Área da tabela com cabeçalho fixo na rolagem da página (achado D5 da auditoria de UX de 02/10/2026).
 *
 * O `sticky` só gruda na página se nenhum ancestral rolar. Rolagem horizontal (overflow-x: auto)
 * cria um contêiner e tira o cabeçalho da página. Por isso: enquanto a tabela cabe, o eixo X é só
 * cortado (`overflow-x: clip`, que não cria contêiner); quando a tela fica mais estreita que a
 * tabela, volta a rolar na horizontal e nada fica escondido. O estado inicial (renderizado no
 * servidor) é o seguro: com rolagem. A medida corrige isso logo depois de hidratar.
 */
export function TableScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current;
    const table = box?.querySelector("table");
    if (!box || !table) return;
    const update = () => { box.dataset.fit = table.getBoundingClientRect().width <= box.clientWidth + 1 ? "true" : "false"; };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    observer.observe(table);
    return () => observer.disconnect();
  }, []);
  // data-scroll-area: é por ele que a paginação volta a tabela para o topo.
  return <div ref={ref} data-scroll-area="" data-fit="false" className="overflow-x-auto data-[fit=true]:overflow-x-clip">{children}</div>;
}
