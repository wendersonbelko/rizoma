import { redirect } from "next/navigation";

/**
 * A Aparência virou a aba "Aparência" de Configurações (achado N3 da auditoria de UX de 02/10/2026). A URL antiga
 * continua valendo como atalho: quem a tinha salva cai na aba. A permissão é conferida lá (404 sem `appearance:manage`).
 * `actions.ts` e `editor.tsx` seguem aqui: a aba monta o mesmo editor e os testes de integração importam `saveAppearance`.
 */
export default function AppearancePage() {
  redirect("/admin/settings?s=appearance");
}
