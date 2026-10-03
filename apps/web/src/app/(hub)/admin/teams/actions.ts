"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { decryptSecret, listGithubTeamMembers, slugSchema } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";

export async function createTeam(form: FormData) {
  const actor = await requirePermission("team:manage");
  const d = z.object({ name: z.string().trim().min(2).max(60), slug: slugSchema, description: z.string().max(300).optional() }).parse(Object.fromEntries(form));
  const team = await prisma.team.create({ data: d });
  await audit({ actorId: actor.id, action: "team.created", targetType: "team", targetId: team.id });
  revalidatePath("/admin/teams");
}

export async function addMember(form: FormData) {
  const actor = await requirePermission("team:manage");
  const d = z.object({ teamId: z.string(), login: z.string().trim().toLowerCase().transform((s) => s.replace(/^@/, "")), role: z.enum(["LEAD", "MEMBER"]) }).parse(Object.fromEntries(form));
  // RN-34: só pessoas já ativas no hub entram em times. Aceita usuário do GitHub ou e-mail.
  const user = await prisma.user.findFirst({ where: { OR: [{ githubLogin: d.login }, { email: d.login }], status: "ACTIVE" } });
  if (!user) throw new Error(`${d.login} ainda não tem acesso ativo ao hub.`);
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: d.teamId, userId: user.id } },
    create: { teamId: d.teamId, userId: user.id, role: d.role },
    update: { role: d.role },
  });
  await audit({ actorId: actor.id, action: "team.member_added", targetType: "team", targetId: d.teamId, metadata: { login: d.login } });
  revalidatePath("/admin/teams");
}

export async function removeMember(form: FormData) {
  const actor = await requirePermission("team:manage");
  const d = z.object({ teamId: z.string(), userId: z.string() }).parse(Object.fromEntries(form));
  await prisma.teamMember.delete({ where: { teamId_userId: d } });
  await audit({ actorId: actor.id, action: "team.member_removed", targetType: "team", targetId: d.teamId, metadata: { userId: d.userId } });
  revalidatePath("/admin/teams");
}

/** Cria no hub o vínculo de quem já tem conta e está no time do GitHub. Não remove membros. */
export type GithubSyncState = { message: string; pending: string[] };

export async function syncGithubTeam(_: GithubSyncState, form: FormData): Promise<GithubSyncState> {
  const empty = (message: string): GithubSyncState => ({ message, pending: [] });
  const actor = await requirePermission("team:manage");
  const teamId = z.string().parse(form.get("teamId"));
  const slugInput = String(form.get("githubTeamSlug") ?? "").trim();
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  const githubTeamSlug = slugInput || team.githubTeamSlug;
  if (!githubTeamSlug) return empty("Informe o identificador do time no GitHub.");
  if (slugInput && slugInput !== team.githubTeamSlug) {
    await prisma.team.update({ where: { id: teamId }, data: { githubTeamSlug: slugInput } });
  }
  const integration = await prisma.sourceIntegration.findUnique({ where: { type: "GITHUB" } });
  if (!integration?.tokenEnc) return empty("Falta o token de leitura do GitHub em Configurações → Repositórios.");
  const inst = await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
  if (!inst.allowedGithubOrgs.length) return empty("Informe a organização do GitHub em Configurações → Organização.");
  const token = decryptSecret(integration.tokenEnc);
  let logins: string[] | null = null;
  let lastStatus = 0;
  for (const org of inst.allowedGithubOrgs) {
    const found = await listGithubTeamMembers(token, org, githubTeamSlug);
    if (found.ok) { logins = found.logins; break; }
    lastStatus = found.status;
  }
  if (!logins) return empty(lastStatus === 401 || lastStatus === 403
    ? "O token de repositório não consegue ler times do GitHub."
    : `Time "${githubTeamSlug}" não encontrado nas organizações configuradas.`);
  const users = await prisma.user.findMany({ where: { githubLogin: { in: logins }, status: "ACTIVE" }, select: { id: true, githubLogin: true } });
  const linked = new Set(users.flatMap((u) => (u.githubLogin ? [u.githubLogin.toLowerCase()] : [])));
  const pending = logins.filter((login) => !linked.has(login));
  for (const user of users) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId: user.id } },
      create: { teamId, userId: user.id, role: "MEMBER" },
      update: {},
    });
  }
  await audit({ actorId: actor.id, action: "team.github_synced", targetType: "team", targetId: teamId, metadata: { slug: githubTeamSlug, linked: users.length, github: logins.length } });
  revalidatePath("/admin/teams");
  const message = users.length
    ? `${users.length} pessoas vinculadas.${pending.length ? ` ${pending.length} ainda não têm conta no hub.` : ""}`
    : `O GitHub listou ${logins.length} pessoas e nenhuma tem conta ativa no hub.`;
  return { message, pending };
}
