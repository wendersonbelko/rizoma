"use client";

import { useState } from "react";
import { DEFAULT_PAGE_SIZE, paginate, type PageInfo, type PageRequest } from "@api-hub/core/pagination";
import { PaginationBar, type Noun } from "./pagination-bar";
import { PageSizeSelect, revealListTop } from "./page-controls";

/**
 * Paginação em memória para listas que já estão inteiras no cliente (ex.: lista do Mapa de
 * ligações). Mesma barra da paginação por URL. Para voltar à página 1 quando os filtros mudam,
 * dê à lista uma `key` que dependa deles.
 */
export function useClientPagination<T>(items: readonly T[], defaultSize = DEFAULT_PAGE_SIZE) {
  const [request, setRequest] = useState<PageRequest>({ page: 1, pageSize: defaultSize });
  const { items: pageItems, info } = paginate(items, request);
  return { items: pageItems, info, onChange: setRequest };
}

export function ClientPagination({ info, noun, onChange }: { info: PageInfo; noun: Noun; onChange: (request: PageRequest) => void }) {
  return (
    <PaginationBar
      info={info}
      noun={noun}
      control={({ page, label, className, children }) => (
        <button
          type="button"
          aria-label={label}
          className={className}
          onClick={(e) => { revealListTop(e.currentTarget); onChange({ page, pageSize: info.pageSize }); }}
        >
          {children}
        </button>
      )}
      sizeControl={<PageSizeSelect value={info.pageSize} onChange={(pageSize, el) => { revealListTop(el); onChange({ page: 1, pageSize }); }} />}
    />
  );
}
