import { Notice, Panel, Section } from "@/components/ui";
import { affiliationWarnings, providersForScreen, sourcesForScreen } from "@/lib/config-service";
import { getInstallation } from "@/lib/install";
import { mailForScreen } from "@/lib/mail";
import { LoginSettings } from "../login-settings";
import { MailDangerZone, MailSettingsForm } from "../mail-settings";
import { RepositorySettings } from "../repository-settings";

/**
 * Aba "Conexões": tudo que o hub liga por fora, formas de login, e-mail, repositórios e webhooks (achado N3).
 * Antes eram quatro seções soltas; quem queria "conectar o GitHub" tinha dois lugares para procurar.
 */
export async function ConnectionsTab() {
  const inst = await getInstallation();
  const [{ providers, callbacks }, sources, mail, warnings] = await Promise.all([providersForScreen(), sourcesForScreen(), mailForScreen(), affiliationWarnings()]);
  const publicBase = (mail?.publicBaseUrl ?? process.env.AUTH_URL ?? "").replace(/\/+$/, "");

  return (
    <div className="space-y-8">
      <Section id="login" title="Formas de login" description="Como as pessoas entram no hub. Dá para ligar mais de uma.">
        {warnings.length > 0 && (
          <div className="space-y-2">{warnings.map((w) => <Notice key={w} tone="wait">{w}</Notice>)}</div>
        )}
        <LoginSettings providers={providers.map((p) => ({ ...p, clientSecret: "" }))} callbacks={callbacks} />
      </Section>

      <Section id="email" title="E-mail">
        <Panel>
          <MailSettingsForm key={mail ? "on" : "off"} initial={mail ? { ...mail, password: "" } : null} />
        </Panel>
      </Section>

      <Section id="repositories" title="Repositórios" description="Onde está o código. Mesmo sem nenhuma integração, as specs chegam pelo CI, por URL ou por importação manual.">
        <RepositorySettings
          sources={sources.map((x) => ({ ...x, token: "" }))}
          webhookUrl={publicBase ? `${publicBase}/api/v1/hooks` : ""}
          hasSyncToken={!!inst.syncTokenHash}
        />
      </Section>

      {mail && <MailDangerZone />}
    </div>
  );
}
