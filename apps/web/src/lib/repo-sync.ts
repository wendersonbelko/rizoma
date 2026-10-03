import { prisma } from "@api-hub/db";
import {
  HUB_FILE, MANIFEST_CANDIDATES, OPENAPI_CANDIDATES, README_CANDIDATES, README_DOC_SLUG,
  contentHash, docRepoPath, fileWriteDecision, planRepoSync, readmeTitle, technologyFromFileName, technologiesFromManifest,
  type SourceProvider, type SyncField,
} from "@api-hub/core";
import { audit } from "./audit";
import { applyHubFile, loadHubState, loadSourceRepo, renderServiceHubFile } from "./hub-manifest";
import { deleteRepoText, listRepoRoot, readRepoText, writeRepoText } from "./repo-files";
import { loadRepoSync, saveRepoSync, type StoredConflict } from "./repo-state";

const FIELD_NOTE: Record<string, string> = {
  description: "descrição", tags: "tecnologias", readme: "README", spec: "spec", hub: "hub.json", doc: "documento",
};

async function firstFile(provider: SourceProvider, baseUrl: string | null | undefined, fullName: string, branch: string, token: string, paths: readonly string[]) {
  for (const path of paths) {
    const read = await readRepoText(provider, baseUrl, fullName, branch, token, path);
    if (read.text !== null) return { path, text: read.text };
  }
  return null;
}

/** Lê a branch padrão e preenche só o que o serviço ainda não tem. Divergência vira conflito. */
export async function syncRepository(serviceId: string, actorId: string | null): Promise<{ message: string; conflicts: number }> {
  const src = await loadSourceRepo(serviceId);
  if (!src) return { message: "Este serviço não tem repositório de código-fonte.", conflicts: 0 };
  if (!src.token) return { message: "Sem token de repositório. A sincronização precisa de um token em Configurações → Repositórios.", conflicts: 0 };
  const provider = src.repo.provider as SourceProvider;
  const branch = src.repo.defaultBranch;
  const service = await prisma.service.findUniqueOrThrow({
    where: { id: serviceId },
    include: { docs: { select: { slug: true, content: true } }, _count: { select: { specs: true } } },
  });
  const [readme, specFile, manifests, rootNames, hubRead, state] = await Promise.all([
    firstFile(provider, src.baseUrl, src.repo.fullName, branch, src.token, README_CANDIDATES),
    firstFile(provider, src.baseUrl, src.repo.fullName, branch, src.token, OPENAPI_CANDIDATES),
    Promise.all(MANIFEST_CANDIDATES.map(async (path) => {
      const read = await readRepoText(provider, src.baseUrl, src.repo.fullName, branch, src.token!, path);
      return read.text !== null ? technologiesFromManifest(path, read.text) : [];
    })),
    listRepoRoot(provider, src.baseUrl, src.repo.fullName, branch, src.token),
    readRepoText(provider, src.baseUrl, src.repo.fullName, branch, src.token, HUB_FILE),
    loadHubState(serviceId),
  ]);
  const gitTags = [...new Set([...manifests.flat(), ...rootNames.flatMap(technologyFromFileName)])].slice(0, 10);
  const readmeDoc = service.docs.find((d) => d.slug === README_DOC_SLUG) ?? null;
  const hubIsEmpty = !state || state.channels.length + state.consumes.length + state.resources.length === 0;
  const rendered = state && !hubIsEmpty ? await renderServiceHubFile(serviceId) : "";
  const actions = planRepoSync({
    description: { hub: service.description ?? "", git: src.repo.description ?? "" },
    tags: { hub: service.tags, git: gitTags },
    readme: { hub: readmeDoc?.content ?? null, git: readme?.text ?? null, hasOtherDocs: service.docs.some((d) => d.slug !== README_DOC_SLUG) },
    spec: { hubPath: service.specPath ?? "", hasPublishedSpec: service._count.specs > 0, gitPath: specFile?.path ?? null },
    hubFile: { hub: rendered ?? "", git: hubRead.status === 404 ? null : hubRead.text, hubIsEmpty },
  });
  const sync = await loadRepoSync(serviceId);
  const filled: string[] = [];
  const notes: string[] = [];
  for (const action of actions) {
    if (action.kind === "fill" && action.field === "description") {
      await prisma.service.update({ where: { id: serviceId }, data: { description: action.value.slice(0, 500) } });
      filled.push("descrição");
    } else if (action.kind === "fill" && action.field === "tags") {
      await prisma.service.update({ where: { id: serviceId }, data: { tags: action.value.split("\n").filter(Boolean).slice(0, 10) } });
      filled.push("tecnologias");
    } else if (action.kind === "fill" && action.field === "readme") {
      await prisma.serviceDoc.create({ data: { serviceId, slug: README_DOC_SLUG, title: readmeTitle(action.value), content: action.value, position: 0 } });
      sync.files[docRepoPath(README_DOC_SLUG)] = contentHash(action.value);
      filled.push("README");
    } else if (action.kind === "fill" && action.field === "spec") {
      await prisma.service.update({ where: { id: serviceId }, data: { specSource: "REPO_FILE", specPath: action.value, specRepositoryId: src.repo.id } });
      filled.push("spec");
    } else if (action.kind === "fill" && action.field === "hub") {
      const applied = await applyHubFile(serviceId, actorId, action.value);
      if (applied.status === "applied") {
        sync.files[HUB_FILE] = contentHash(action.value);
        filled.push("hub.json");
      } else if (applied.detail) notes.push(applied.detail);
    } else if (action.kind === "match" && action.field === "readme" && readme) {
      sync.files[docRepoPath(README_DOC_SLUG)] = contentHash(readme.text);
    } else if (action.kind === "match" && action.field === "hub" && hubRead.text) {
      sync.files[HUB_FILE] = contentHash(hubRead.text);
    }
  }
  sync.conflicts = actions.flatMap((action): StoredConflict[] => action.kind === "conflict"
    ? [{ field: action.field, hub: action.hub, git: action.git, path: action.field === "readme" ? docRepoPath(README_DOC_SLUG) : action.field === "hub" ? HUB_FILE : action.field === "spec" ? action.git : "" }]
    : []);
  await saveRepoSync(serviceId, sync);
  await audit({ actorId, action: "repo.synced", targetType: "service", targetId: serviceId, metadata: { repository: src.repo.fullName, filled, conflicts: sync.conflicts.length } });
  const extra = notes.length ? ` ${notes.join(" ")}` : "";
  if (sync.conflicts.length) return { message: `${filled.length ? `Preenchido: ${filled.join(", ")}. ` : ""}${sync.conflicts.length === 1 ? "Há 1 conflito" : `Há ${sync.conflicts.length} conflitos`} com o repositório. Escolha em Configurações.${extra}`, conflicts: sync.conflicts.length };
  if (filled.length) return { message: `Preenchido a partir do repositório: ${filled.join(", ")}.${extra}`, conflicts: 0 };
  return { message: `O repositório não trouxe nada novo.${extra}`, conflicts: 0 };
}

/** Grava ou apaga a página na branch padrão. Não cobre um arquivo que divergiu. */
export async function publishServiceDoc(serviceId: string, actorId: string | null, slug: string, content: string | null): Promise<string> {
  const src = await loadSourceRepo(serviceId);
  if (!src) return "";
  if (!src.token) return "Sem token de repositório. A página ficou só no hub.";
  const path = docRepoPath(slug);
  const provider = src.repo.provider as SourceProvider;
  const remote = await readRepoText(provider, src.baseUrl, src.repo.fullName, src.repo.defaultBranch, src.token, path);
  if (remote.text === null && remote.status !== 404) return `Não li ${path} (resposta ${remote.status}).`;
  const remoteText = remote.status === 404 ? null : remote.text;
  const sync = await loadRepoSync(serviceId);
  const remember = async (hash: string | null) => {
    if (hash) sync.files[path] = hash;
    else delete sync.files[path];
    sync.conflicts = sync.conflicts.filter((c) => c.path !== path);
    await saveRepoSync(serviceId, sync);
  };
  const hold = async (git: string) => {
    sync.conflicts = [...sync.conflicts.filter((c) => c.path !== path), { field: slug === README_DOC_SLUG ? "readme" : "doc", hub: content ?? "", git, path }];
    await saveRepoSync(serviceId, sync);
    return `O arquivo ${path} no repositório divergiu. Escolha qual versão fica em Configurações.`;
  };
  if (content === null) {
    if (remoteText === null) { await remember(null); return ""; }
    if (!sync.files[path] || sync.files[path] !== contentHash(remoteText)) return hold(remoteText);
    const removed = await deleteRepoText(provider, src.baseUrl, src.repo.fullName, src.repo.defaultBranch, src.token, path, "Remove página de regras a partir do Rizoma");
    if (!removed.ok) return `Não apaguei ${path} (resposta ${removed.status}).`;
    await remember(null);
    await audit({ actorId, action: "doc.written", targetType: "service", targetId: serviceId, metadata: { path, removed: true } });
    return `${path} removido do repositório.`;
  }
  const decision = fileWriteDecision(sync.files[path], remoteText, content);
  if (decision === "conflict") return hold(remoteText ?? "");
  if (decision === "skip") { await remember(contentHash(content)); return `${path} já está igual no repositório.`; }
  const written = await writeRepoText(provider, src.baseUrl, src.repo.fullName, src.repo.defaultBranch, src.token, path, content, "Atualiza página de regras a partir do Rizoma");
  if (!written.ok) {
    if (written.status === 401 || written.status === 403) return "O token não escreve no repositório. A página ficou só no hub.";
    return `Não gravei ${path} (resposta ${written.status}).`;
  }
  await remember(contentHash(content));
  await audit({ actorId, action: "doc.written", targetType: "service", targetId: serviceId, metadata: { path } });
  return `${path} gravado em ${src.repo.fullName}.`;
}

/** Aplica o lado escolhido por quem edita o serviço e tira o conflito da lista. */
export async function resolveRepoConflict(serviceId: string, actorId: string, field: SyncField | "doc", path: string, side: "hub" | "git"): Promise<string> {
  const sync = await loadRepoSync(serviceId);
  const conflict = sync.conflicts.find((c) => c.field === field && c.path === path);
  if (!conflict) return "Esse conflito já foi resolvido.";
  const src = await loadSourceRepo(serviceId);
  if (side === "git") {
    if (field === "description") await prisma.service.update({ where: { id: serviceId }, data: { description: conflict.git.slice(0, 500) } });
    else if (field === "tags") await prisma.service.update({ where: { id: serviceId }, data: { tags: conflict.git.split("\n").filter(Boolean).slice(0, 10) } });
    else if (field === "spec") await prisma.service.update({ where: { id: serviceId }, data: { specSource: "REPO_FILE", specPath: conflict.git, specRepositoryId: src?.repo.id } });
    else if (field === "hub") await applyHubFile(serviceId, actorId, conflict.git);
    else if (field === "readme" || field === "doc") {
      const slug = field === "readme" ? README_DOC_SLUG : path.replace(/^docs\//, "").replace(/\.md$/, "");
      const title = readmeTitle(conflict.git);
      await prisma.serviceDoc.upsert({
        where: { serviceId_slug: { serviceId, slug } },
        create: { serviceId, slug, title, content: conflict.git, position: 0 },
        update: { content: conflict.git, title },
      });
    }
    if (path) sync.files[path] = contentHash(conflict.git);
  } else if (src?.token && path && (field === "hub" || field === "readme" || field === "doc")) {
    const provider = src.repo.provider as SourceProvider;
    if (conflict.hub) {
      const written = await writeRepoText(provider, src.baseUrl, src.repo.fullName, src.repo.defaultBranch, src.token, path, conflict.hub, "Atualiza arquivo a partir do Rizoma");
      if (!written.ok) return written.status === 401 || written.status === 403 ? "O token não escreve no repositório." : `Não gravei ${path} (resposta ${written.status}).`;
      sync.files[path] = contentHash(conflict.hub);
    } else {
      const removed = await deleteRepoText(provider, src.baseUrl, src.repo.fullName, src.repo.defaultBranch, src.token, path, "Remove arquivo a partir do Rizoma");
      if (!removed.ok) return `Não apaguei ${path} (resposta ${removed.status}).`;
      delete sync.files[path];
    }
  }
  sync.conflicts = sync.conflicts.filter((c) => !(c.field === field && c.path === path));
  await saveRepoSync(serviceId, sync);
  await audit({ actorId, action: "repo.conflict_resolved", targetType: "service", targetId: serviceId, metadata: { field, path, side } });
  return `Conflito de ${FIELD_NOTE[field] ?? field} resolvido com o que está ${side === "hub" ? "no hub" : "no Git"}.`;
}
