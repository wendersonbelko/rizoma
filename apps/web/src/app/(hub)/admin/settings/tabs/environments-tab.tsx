import { Notice, Section } from "@/components/ui";
import { environmentsForScreen } from "@/lib/config-service";
import { getInstallation } from "@/lib/install";
import { CancelRecoveryForm } from "../cancel-recovery-form";
import { EnvironmentSettings } from "../environment-settings";
import { EnvironmentsDangerZone } from "../environments-danger-zone";
import { RecheckPanel } from "../recheck-panel";

/** Aba "Ambientes e sessões": onde cada branch publica, a conferência de vínculos e as ações irreversíveis, no fim. */
export async function EnvironmentsTab() {
  const inst = await getInstallation();
  const envs = await environmentsForScreen();
  const recoveryOpen = !!inst.recoveryIdentifier && !!inst.recoveryExpiresAt && inst.recoveryExpiresAt > new Date();

  return (
    <div className="space-y-8">
      <Section
        id="environments"
        title="Ambientes"
        description="A spec enviada pelo CI cai no primeiro ambiente, de cima para baixo, cuja branch casar com o padrão. Use Subir e Descer para mudar a ordem."
      >
        <EnvironmentSettings envs={envs} />
      </Section>

      <Section id="sessions" title="Sessões e recuperação">
        <div className="space-y-4">
          {recoveryOpen && (
            <Notice tone="wait" title="Recuperação de Proprietário em aberto">
              <p>O primeiro login de <strong>{inst.recoveryIdentifier}</strong> até {inst.recoveryExpiresAt!.toLocaleString("pt-BR")} vira Proprietário. Se você não abriu essa janela pelo servidor, cancele e revise quem tem acesso de linha de comando ao servidor.</p>
              <div className="mt-3"><CancelRecoveryForm /></div>
            </Notice>
          )}
          <RecheckPanel />
          <details className="rounded-control border border-line bg-paper/60 px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium">Se todos os Proprietários perderem o acesso</summary>
            <p className="mt-3 text-muted">
              Quem tem acesso ao servidor abre uma janela de recuperação com <code className="font-mono text-ink">pnpm admin:recover --login usuario-ou-email</code>.
              Com login por e-mail e senha, acrescente <code className="font-mono text-ink">--reset-password</code> para gerar um link de nova senha.
            </p>
          </details>
        </div>
      </Section>

      <EnvironmentsDangerZone envs={envs.map(({ slug, name }) => ({ slug, name }))} />
    </div>
  );
}
