import { notFound, redirect } from "next/navigation";
import { prisma } from "@api-hub/db";
import { can, checkMembership, membershipCheckIsStale, type Permission } from "@api-hub/core";
import { auth } from "@/auth";
import { getInstallation, getPermissionMatrix } from "./install";
import { evaluateAccess } from "./access";
import { getGithubToken } from "./github-token";

async function loadUser(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    include: { teams: { select: { teamId: true } }, accounts: { select: { provider: true } } },
  });
  if (!u) return null;
  const matrix = await getPermissionMatrix();
  return { ...u, teamIds: u.teams.map((t) => t.teamId), permissions: matrix[u.role] };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

/** Toda página e ação do hub passa por aqui (RN-S01). */
export async function requireUser(): Promise<CurrentUser> {
  const inst = await getInstallation();
  if (!inst.installed) redirect("/setup");

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let user = await loadUser(session.user.id);
  if (!user) redirect("/login");

  // RN-S03: sessão JWT antiga (suspensão, "encerrar sessões", troca de senha) deixa de valer.
  if (session.user.tv !== user.tokenVersion) redirect("/login?error=session_revoked");

  // RN-07 / RN-10: revalida o vínculo quando a última checagem venceu.
  const expired = user.accessExpiresAt && user.accessExpiresAt <= new Date();
  if (user.status === "ACTIVE" && (expired || membershipCheckIsStale(user.lastMembershipCheckAt, inst.membershipRecheckHours))) {
    let affiliation: "member" | "not_member" | "token_invalid" = user.isOrgMember ? "member" : "not_member";
    // Só o GitHub permite reconsultar o vínculo sem novo login; nos demais vale o último login.
    if (user.accounts.some((a) => a.provider === "github") && inst.allowedGithubOrgs.length) {
      const token = await getGithubToken(user.id);
      affiliation = token ? await checkMembership(token, inst.allowedGithubOrgs) : "token_invalid";
    }
    const result = await evaluateAccess(user.id, affiliation);
    if (!result.ok) {
      await prisma.user.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } });
      redirect(`/login?error=${result.reason ?? "suspended"}`);
    }
    user = (await loadUser(user.id))!;
  }

  if (user.status === "PENDING") redirect("/pending");
  if (user.status !== "ACTIVE") redirect(`/login?error=${user.status.toLowerCase()}`);
  return user;
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  // Esconde a existência da rota para quem não tem permissão (RN-23).
  if (!can(user, permission)) notFound();
  return user;
}
