import { headers } from "next/headers";
import { prisma } from "@api-hub/db";
import {
  canonicalStep, hashPassword, nextStep, passwordProblems, setupSchemas, stepIndex, type SetupStepId,
} from "@api-hub/core";
import { auth } from "@/auth";
import { getInstallation } from "@/lib/install";
import { audit } from "@/lib/audit";
import { mailForScreen, saveMailSettings, clearMailSettings } from "@/lib/mail";
import {
  affiliationWarnings, environmentsForScreen, providersForScreen, saveEnvironments, saveProviders, saveSources, sourcesForScreen,
} from "@/lib/config-service";

export const dynamic = "force-dynamic";

/**
 * RN-S06: só aceita escrita vinda da própria página do hub.
 * Ordem: Sec-Fetch-Site → Origin → Referer, comparando com Host, X-Forwarded-Host e AUTH_URL.
 */
async function sameOrigin(): Promise<boolean> {
  const h = await headers();
  const site = h.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const referer = h.get("referer");
  const origin = h.get("origin") ?? (referer ? safeOrigin(referer) : null);
  if (!origin) return site === "same-origin";
  const allowed = new Set([h.get("host"), h.get("x-forwarded-host"), process.env.AUTH_URL ? safeHost(process.env.AUTH_URL) : null].filter(Boolean));
  return allowed.has(safeHost(origin));
}
function safeOrigin(url: string): string | null { try { return new URL(url).origin; } catch { return null; } }
function safeHost(url: string): string | null { try { return new URL(url).host; } catch { return null; } }

const json = (status: number, body: unknown) => Response.json(body, { status });

/** Ações registradas durante o assistente, exibidas na tela como "log da instalação". */
const INSTALL_LOG_PREFIXES = ["setup.", "owner."];

export async function GET() {
  // RN-91: sem banco alcançável, nem "installed" dá para saber — a etapa "Banco de dados"
  // é a única coisa que a tela pode mostrar até o servidor reiniciar com a conexão certa.
  let inst;
  try {
    inst = await getInstallation();
  } catch {
    return json(200, { installed: false, databaseReady: false });
  }
  if (inst.installed) return json(200, { installed: true });

  const session = await auth();
  const sessionUser = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
  const owner = await prisma.user.findFirst({ where: { role: "OWNER" }, select: { githubLogin: true, email: true } });
  const installLogs = await prisma.auditLog.findMany({
    where: { OR: INSTALL_LOG_PREFIXES.map((p) => ({ action: { startsWith: p } })) },
    orderBy: { createdAt: "asc" },
    select: { action: true, createdAt: true, metadata: true },
  });

  return json(200, {
    installed: false,
    databaseReady: true,
    currentStep: canonicalStep(inst.currentStep),
    // Nada sensível sai daqui: secrets e tokens aparecem só como "salvo".
    data: {
      orgName: inst.orgName, orgSlug: inst.orgSlug, appName: inst.appName,
      allowedGithubOrgs: inst.allowedGithubOrgs, allowedEmailDomains: inst.allowedEmailDomains,
      autoApproveOrgMembers: inst.autoApproveOrgMembers, outsiderPolicy: inst.outsiderPolicy,
      sessionMaxAgeHours: inst.sessionMaxAgeHours, membershipRecheckHours: inst.membershipRecheckHours, accessRequestTtlDays: inst.accessRequestTtlDays,
      ownerIdentifier: inst.ownerIdentifier,
      ...(await providersForScreen()),
      sources: await sourcesForScreen(),
      environments: await environmentsForScreen(),
      warnings: await affiliationWarnings(),
      mail: await mailForScreen(),
    },
    owner: {
      claimedBy: owner ? owner.githubLogin ?? owner.email : null,
      sessionIdentity: sessionUser ? sessionUser.githubLogin ?? sessionUser.email : null,
    },
    installLogs,
  });
}

export async function POST(req: Request) {
  const inst = await getInstallation();
  // RN-68: depois de instalado o assistente não aceita mais nada.
  if (inst.installed) return json(409, { error: "O hub já está instalado." });
  if (!(await sameOrigin())) return json(403, { error: "Origem da requisição inválida." });

  const body = (await req.json().catch(() => null)) as { step?: SetupStepId; data?: unknown } | null;
  const step = body?.step;
  if (!step || !(step in setupSchemas)) return json(400, { error: "Etapa desconhecida ou que não é enviada por aqui." });

  // RN-62: não dá para pular etapas.
  if (stepIndex(step) > stepIndex(canonicalStep(inst.currentStep))) return json(400, { error: "Conclua as etapas anteriores primeiro." });

  const parsed = setupSchemas[step as keyof typeof setupSchemas].safeParse(body.data);
  if (!parsed.success) return json(422, { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", issues: parsed.error.issues });

  switch (step) {
    case "login": {
      const d = setupSchemas.login.parse(parsed.data);
      const r = await saveProviders(d.providers);
      if (!r.ok) return json(400, { error: r.error });
      await audit({ action: "setup.login_saved", metadata: { providers: d.providers.map((p: { type: string }) => p.type) } });
      break;
    }
    case "email": {
      const d = setupSchemas.email.parse(parsed.data);
      if (d.mode === "skip") {
        await clearMailSettings();
        await audit({ action: "setup.email_skipped" });
        break;
      }
      const r = await saveMailSettings(d.settings);
      if (!r.ok) return json(400, { error: r.error });
      await audit({ action: "setup.email_saved", metadata: { configured: true } });
      break;
    }
    case "organization": {
      const d = setupSchemas.organization.parse(parsed.data);
      await prisma.installation.update({
        where: { id: "singleton" },
        data: {
          orgName: d.orgName, orgSlug: d.orgSlug, appName: d.appName,
          allowedGithubOrgs: [...new Set<string>(d.allowedGithubOrgs)], allowedEmailDomains: [...new Set<string>(d.allowedEmailDomains)],
        },
      });
      break;
    }
    case "repositories": {
      const d = setupSchemas.repositories.parse(parsed.data);
      const r = await saveSources(d.sources);
      if (!r.ok) return json(400, { error: r.error });
      break;
    }
    case "policies": {
      const d = setupSchemas.policies.parse(parsed.data);
      await prisma.installation.update({ where: { id: "singleton" }, data: d });
      break;
    }
    case "environments": {
      const d = setupSchemas.environments.parse(parsed.data);
      const r = await saveEnvironments(d.environments);
      if (!r.ok) return json(400, { error: r.error });
      break;
    }
    case "owner": {
      const d = setupSchemas.owner.parse(parsed.data);
      const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
      if (d.mode === "password") {
        const cred = await prisma.authProvider.findUnique({ where: { type: "CREDENTIALS" } });
        if (!cred) return json(400, { error: "Ative o login por e-mail e senha para criar o administrador assim." });
        if (owner && owner.email !== d.email) return json(409, { error: "O OWNER já foi definido." });
        const problems = passwordProblems(d.password, d.email);
        if (problems.length) return json(422, { error: problems.join(" ") });
        const data = { name: d.name, passwordHash: await hashPassword(d.password), role: "OWNER" as const, status: "ACTIVE" as const, accessGrant: "OWNER_SETUP" as const };
        const existing = await prisma.user.findUnique({ where: { email: d.email } });
        const user = existing ? await prisma.user.update({ where: { id: existing.id }, data }) : await prisma.user.create({ data: { email: d.email, ...data } });
        await prisma.installation.update({ where: { id: "singleton" }, data: { ownerIdentifier: d.email } });
        await audit({ actorId: user.id, action: "setup.owner_created", metadata: { via: "password" } });
        break;
      }
      const owned = owner && [owner.githubLogin, owner.email].some((v) => v?.toLowerCase() === d.ownerIdentifier);
      if (owner && !owned) return json(409, { error: "O OWNER já foi definido." });
      await prisma.installation.update({ where: { id: "singleton" }, data: { ownerIdentifier: d.ownerIdentifier } });
      // Só avança depois que a pessoa entrar pelo provedor (ver GET owner.claimedBy).
      if (!owner) return json(200, { ok: true, needsSignIn: true });
      break;
    }
    case "review": {
      const fresh = await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
      const [owner, providers, envs] = await Promise.all([
        prisma.user.findFirst({ where: { role: "OWNER", status: "ACTIVE" } }),
        prisma.authProvider.count(),
        prisma.environment.count(),
      ]);
      const missing = [
        !fresh.orgName && "organização",
        providers === 0 && "formas de login",
        envs === 0 && "ambientes",
        !owner && "primeiro administrador",
      ].filter(Boolean);
      if (missing.length) return json(400, { error: `Falta concluir: ${missing.join(", ")}.` });
      await prisma.installation.update({ where: { id: "singleton" }, data: { installed: true, installedAt: new Date(), currentStep: "review" } });
      await audit({ actorId: owner!.id, action: "setup.completed" });
      return json(200, { ok: true, installed: true });
    }
  }

  await advance(canonicalStep(inst.currentStep), step);
  return json(200, { ok: true });
}

async function advance(current: SetupStepId, completed: SetupStepId) {
  const target = nextStep(completed);
  if (stepIndex(target) > stepIndex(current)) {
    await prisma.installation.update({ where: { id: "singleton" }, data: { currentStep: target } });
  }
}
