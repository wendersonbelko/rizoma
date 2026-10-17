import { redirect } from "next/navigation";
import { PROVIDER_META } from "@api-hub/core";
import { getAuthProviders, getInstallation } from "@/lib/install";
import { mailForScreen } from "@/lib/mail";
import { Button } from "@/components/ui";
import { HubLogo } from "@/components/hub-logo";
import { signInWith } from "./actions";
import { PasswordForm } from "./password-form";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  not_member: "Sua conta não comprova vínculo com a empresa, e esta instalação não aceita solicitações de fora.",
  setup_in_progress: "A instalação ainda não terminou. Só o administrador definido no assistente pode entrar.",
  suspended: "Seu acesso está suspenso. Fale com um administrador.",
  rejected: "Sua solicitação de acesso foi recusada. Fale com um administrador.",
  reauth: "Precisamos confirmar seu vínculo com a empresa. Entre de novo.",
  session_revoked: "Sua sessão foi encerrada. Entre de novo.",
  OAuthAccountNotLinked: "Esse e-mail já entra por outra forma de login. Use a mesma de antes.",
  AccessDenied: "O login foi recusado.",
  provider: "Essa forma de login não está disponível.",
  CredentialsSignin: "E-mail ou senha incorretos.",
  locked: "Muitas tentativas erradas. A conta fica bloqueada por 15 minutos.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; code?: string; ok?: string }> }) {
  const inst = await getInstallation();
  if (!inst.installed) redirect("/setup");
  const { error: rawError, code, ok } = await searchParams;
  const error = rawError === "CredentialsSignin" && code === "locked" ? "locked" : rawError;
  const providers = await getAuthProviders();
  const smtp = await mailForScreen();
  const oauth = providers.filter((p) => p.type !== "CREDENTIALS");
  const credentials = providers.find((p) => p.type === "CREDENTIALS");

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded-panel border border-line bg-sheet p-8 shadow-[0_16px_40px_-24px_color-mix(in_srgb,var(--color-ink)_35%,transparent)]">
        <HubLogo className="mb-5 size-14" />
        <p className="text-sm font-medium text-muted">{inst.orgName}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{inst.appName}</h1>
        <p className="mb-8 mt-2 text-muted">Documentação das APIs internas. Entre com a conta da empresa.</p>
        {error && <p role="alert" className="mb-5 rounded-control border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{ERRORS[error] ?? "Não foi possível entrar."}</p>}
        {ok === "senha" && <p role="status" className="mb-5 rounded-control bg-accent/10 px-3 py-2 text-sm text-accent">Senha salva. Entre com seu e-mail.</p>}

        {oauth.length > 0 && (
          <div className="space-y-2">
            {oauth.map((p) => (
              <form key={p.type} action={signInWith.bind(null, p.type)}>
                <Button tone={oauth.length > 1 || credentials ? "quiet" : "primary"} className="w-full">
                  Entrar com {p.type === "OIDC" ? p.label || "SSO" : PROVIDER_META[p.type].label}
                </Button>
              </form>
            ))}
          </div>
        )}
        {oauth.length > 0 && credentials && (
          <div className="my-6 flex items-center gap-3 text-sm text-muted"><span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" /></div>
        )}
        {credentials && <PasswordForm allowSignup={credentials.allowSignup && inst.outsiderPolicy === "REQUEST_APPROVAL"} smtpReady={!!smtp} />}
      </div>
    </main>
  );
}
