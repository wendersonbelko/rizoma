"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@api-hub/db";
import { countLabel, decryptSecret, listGithubTeamMembers, personLabel, slugSchema } from "@api-hub/core";
import { requirePermission } from "@/lib/guards";
import { audit } from "@/lib/audit";

/** Resposta dos formulários de time: mensagem geral e, quando a pessoa pode corrigir, o erro de cada campo. */
export type TeamResult = { ok: boolean; message?: string; errors?: { name?: string; slug?: string; description?: string; login?: string; role?: string } };

/** Primeiro erro de cada campo, para aparecer embaixo do campo certo. */
function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): NonNullable<TeamResult["errors"]> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function createTeam(_: TeamResult, form: FormData): Promise<TeamResult> {
  const actor = await requirePermission("team:manage");
  const parsed = z.object({
    name: z.string().trim().min(2, "Informe o nome do time, com pelo menos 2 caracteres.").max(60, "Use até 60 caracteres no nome."),
    slug: slugSchema,
    description: z.string().trim().max(300, "Use até 300 caracteres na descrição.").optional(),
  }).safeParse({ name: form.get("name") ?? "", slug: form.get("slug") ?? "", description: form.get("description") || undefined });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error.issues) };

  let team;
  try {
    team = await prisma.team.create({ data: parsed.data });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { ok: false, errors: { slug: "Já existe um time com esse endereço. Mude o nome ou edite o endereço." } };
    throw e;
  }
  await audit({ actorId: actor.id, action: "team.created", targetType: "team", targetId: team.id });
  revalidatePath("/admin/teams");
  return { ok: true, message: "Time criado." };
}

/** RN-34: só pessoas já ativas no hub entram em times. Aceita o @usuário do GitHub ou o e-mail. */
export async function addMember(_: TeamResult, form: FormData): Promise<TeamResult> {
  const actor = await requirePermission("team:manage");
  const teamId = z.string().parse(form.get("teamId"));
  const parsed = z.object({
    login: z.string().trim().toLowerCase().transform((s) => s.replace(/^@/, "")).pipe(z.string().min(1, "Informe o @usuário do GitHub ou o e-mail da pessoa.")),
    role: z.enum(["LEAD", "MEMBER"], { error: "Escolha o papel no time." }),
  }).safeParse({ login: form.get("login") ?? "", role: form.get("role") ?? undefined });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error.issues) };
  const d = parsed.data;

  const user = await prisma.user.findFirst({ where: { OR: [{ githubLogin: d.login }, { email: d.login }], status: "ACTIVE" } });
  if (!user) return { ok: false, errors: { login: `${d.login} ainda não tem acesso ativo ao hub. Convide a pessoa em Pessoas e acesso e tente de novo.` } };
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId: user.id } },
    create: { teamId, userId: user.id, role: d.role },
    update: { role: d.role },
  });
  // O nome vai para a auditoria: a frase "adicionou Ana Souza ao time Pagamentos" não depende do que foi digitado.
  await audit({ actorId: actor.id, action: "team.member_added", targetType: "team", targetId: teamId, metadata: { login: d.login, name: personLabel(user) } });
  revalidatePath("/admin/teams");
  return { ok: true, message: "Membro adicionado." };
}

export async function removeMember(form: FormData) {
  const actor = await requirePermission("team:manage");
  const d = z.object({ teamId: z.string(), userId: z.string() }).parse(Object.fromEntries(form));
  const user = await prisma.user.findUnique({ where: { id: d.userId }, select: { name: true, githubLogin: true, email: true } });
  await prisma.teamMember.delete({ where: { teamId_userId: d } });
  await audit({ actorId: actor.id, action: "team.member_removed", targetType: "team", targetId: d.teamId, metadata: { userId: d.userId, name: personLabel(user, "uma pessoa") } });
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
  if (!integration?.tokenEnc) return empty("Falta o token de leitura do GitHub em Configurações → Conexões.");
  const inst = await prisma.installation.findUniqueOrThrow({ where: { id: "singleton" } });
  if (!inst.allowedGithubOrgs.length) return empty("Informe a organização do GitHub em Configurações → Organização e acesso.");
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
    ? `${countLabel(users.length, "pessoa vinculada", "pessoas vinculadas")}.${pending.length ? ` ${countLabel(pending.length, "ainda não tem conta no hub", "ainda não têm conta no hub")}.` : ""}`
    : `O GitHub listou ${countLabel(logins.length, "pessoa", "pessoas")} e nenhuma tem conta ativa no hub.`;
  return { message, pending };
}
