import { Notice, Panel } from "@/components/ui";
import { affiliationWarnings, providersForScreen } from "@/lib/config-service";
import { getInstallation } from "@/lib/install";
import { OrganizationForm } from "../organization-form";
import { PoliciesForm } from "../policies-form";

/** Aba "Organização e acesso": quem conta como da empresa e o que acontece com quem entra. Cada formulário salva sozinho. */
export async function OrganizationTab() {
  const inst = await getInstallation();
  const [{ providers }, warnings] = await Promise.all([providersForScreen(), affiliationWarnings()]);

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="space-y-2">{warnings.map((w) => <Notice key={w} tone="wait">{w}</Notice>)}</div>
      )}

      <Panel title="Organização" id="organization">
        <p className="-mt-3 mb-5 text-sm text-muted">Quem conta como da empresa. É isso que decide quem entra direto e quem espera aprovação.</p>
        <OrganizationForm orgName={inst.orgName ?? ""} orgSlug={inst.orgSlug ?? ""} orgs={inst.allowedGithubOrgs} domains={inst.allowedEmailDomains} hasGithub={providers.some((p) => p.type === "GITHUB")} />
      </Panel>

      <Panel title="Regras de acesso" id="access">
        <p className="-mt-3 mb-5 text-sm text-muted">O que acontece com quem entra, e por quanto tempo valem sessões e solicitações de acesso.</p>
        <PoliciesForm auto={inst.autoApproveOrgMembers} outsider={inst.outsiderPolicy} session={inst.sessionMaxAgeHours} recheck={inst.membershipRecheckHours} ttl={inst.accessRequestTtlDays} />
      </Panel>
    </div>
  );
}
