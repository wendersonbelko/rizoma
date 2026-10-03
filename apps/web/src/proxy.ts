import { NextResponse, type NextRequest } from "next/server";

// Barreira barata antes de qualquer renderização. A checagem completa
// (status, papel, vínculo com a org) acontece em requireUser() no servidor.
const PUBLIC = ["/login", "/setup", "/pending", "/invite", "/reset-password", "/signup", "/convite", "/redefinir", "/cadastro", "/api/auth", "/api/setup", "/api/v1", "/api/health"];

/**
 * Repassa o pathname atual para os Server Components via header — o App Router não dá
 * pathname a um layout compartilhado de outro jeito. É usado pelo gate do tour obrigatório
 * em (hub)/layout.tsx. O `set` sobrescreve qualquer x-pathname vindo do cliente.
 */
function pass(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return pass(req);

  const hasSession = req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return pass(req);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] };
