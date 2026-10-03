import { PAGE_SIZES, pageHref, pageSizeHref, type PageInfo, type PageKeys, type QueryParams } from "@api-hub/core/pagination";
import { PaginationBar, type Noun } from "./pagination-bar";
import { PageLink, PageSizeLinks } from "./page-controls";

/**
 * Paginação por URL — o padrão das listagens carregadas no servidor. Vai no `pagination` da
 * DataTable:
 *
 *   const req = readPageRequest(sp);                       // ?page= e ?size=
 *   const info = pageInfo(await prisma.x.count(…), req);   // ou paginate(lista, req)
 *   <DataTable pagination={<Pagination info={info} noun={["serviço", "serviços"]} params={sp} />}>
 *
 * `params` são os parâmetros atuais da URL: filtros, aba e a página de outras listagens da mesma
 * tela continuam como estão. Uma tela com duas listagens dá nomes próprios à segunda
 * (pageKey="hpage", sizeKey="hsize") — os mesmos passados para readPageRequest.
 */
export function Pagination({ info, noun, params, pageKey, sizeKey, framed }: {
  info: PageInfo; noun: Noun; params: QueryParams; framed?: boolean;
} & PageKeys) {
  const keys = { pageKey, sizeKey };
  const sizeHrefs = Object.fromEntries(PAGE_SIZES.map((s) => [s, pageSizeHref(params, s, keys)]));
  return (
    <PaginationBar
      info={info}
      noun={noun}
      framed={framed}
      control={({ page, ...rest }) => <PageLink href={pageHref(params, page, keys)} {...rest} />}
      sizeControl={<PageSizeLinks value={info.pageSize} hrefs={sizeHrefs} />}
    />
  );
}
