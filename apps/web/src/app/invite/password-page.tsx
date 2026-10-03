import { notFound } from "next/navigation";
import { findInvite } from "@/lib/local-auth";
import { getInstallation } from "@/lib/install";
import { SetPasswordForm } from "./set-password-form";
import { HubLogo } from "@/components/hub-logo";

/** Página comum de convite e redefinição (RN-107). */
export async function PasswordPage({ token, kind }: { token: string; kind: "INVITE" | "PASSWORD_RESET" }) {
  const [invite, inst] = await Promise.all([findInvite(token), getInstallation()]);
  if (!invite || invite.kind !== kind) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-sm">
          <HubLogo className="mb-4 size-12" />
          <h1 className="mb-2 text-2xl font-bold">Link inválido ou expirado</h1>
          <p className="text-muted">Peça um novo link a um administrador do {inst.appName}.</p>
        </div>
      </main>
    );
  }
  if (!inst.installed) notFound();
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <HubLogo className="mb-4 size-12" />
        <p className="text-sm text-muted">{inst.appName}</p>
        <h1 className="mb-2 text-2xl font-bold">{kind === "INVITE" ? "Criar sua senha" : "Nova senha"}</h1>
        <p className="mb-6 text-muted">
          {kind === "INVITE" ? <>Você foi convidado como <strong className="text-ink">{invite.email}</strong>.</> : <>Conta <strong className="text-ink">{invite.email}</strong>.</>}{" "}
          O link vale até {invite.expiresAt.toLocaleString("pt-BR")}.
        </p>
        <SetPasswordForm token={token} askName={kind === "INVITE"} defaultName={invite.name ?? ""} />
      </div>
    </main>
  );
}
