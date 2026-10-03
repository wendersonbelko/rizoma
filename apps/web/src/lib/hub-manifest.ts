import { prisma } from "@api-hub/db";
import {
  HUB_FILE, contentHash, decryptSecret, fileWriteDecision, parseHubManifest, planHubManifest, renderHubManifest,
  type HubState, type SourceProvider,
} from "@api-hub/core";
import { audit } from "./audit";
import { readRepoText, writeRepoText } from "./repo-files";
import { loadRepoSync, saveRepoSync } from "./repo-state";

export async function loadSourceRepo(serviceId: string) {
  const link = await prisma.serviceRepository.findFirst({
    where: { serviceId, role: "SOURCE" },
    include: { repository: true },
  });
  if (!link || link.repository.provider === "GENERIC") return null;
  const integration = await prisma.sourceIntegration.findUnique({ where: { type: link.repository.provider } });
  const token = integration?.tokenEnc ? decryptSecret(integration.tokenEnc) : null;
  return { repo: link.repository, token, baseUrl: integration?.baseUrl };
}

export async function loadHubState(serviceId: string): Promise<HubState | null> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      channels: { include: { addresses: { include: { environment: { select: { slug: true } } } } } },
      outgoing: { where: { kind: "CONSUMES" }, include: { to: { select: { id: true, slug: true } } } },
      callsOut: { include: { to: { select: { id: true, slug: true } } } },
      resources: { include: { resource: true } },
    },
  });
  if (!service) return null;
  return {
    slug: service.slug,
    kind: service.kind,
    channels: service.channels.map((c) => ({
      protocol: c.protocol,
      name: c.name,
      addresses: Object.fromEntries(c.addresses.map((a) => [a.environment.slug, a.value])),
    })),
    consumes: (() => {
      const rows = new Map<string, HubState["consumes"][number]>();
      for (const d of service.outgoing) rows.set(d.to.id, { service: d.to.slug, protocol: d.protocol, calls: [] });
      for (const call of service.callsOut) {
        const row = rows.get(call.to.id) ?? { service: call.to.slug, protocol: null, calls: [] };
        row.calls.push({ method: call.method, path: call.path });
        rows.set(call.to.id, row);
      }
      return [...rows.values()];
    })(),
    resources: service.resources.map((r) => ({
      name: r.resource.name, kind: r.resource.kind, provider: r.resource.provider, relation: r.relation,
    })),
  };
}

export async function renderServiceHubFile(serviceId: string): Promise<string | null> {
  const state = await loadHubState(serviceId);
  return state ? renderHubManifest(state) : null;
}

/** Lê hub.json da branch padrão e substitui canais, consumos e recursos deste sistema. */
export async function applyHubFile(serviceId: string, actorId: string | null, preloaded?: string): Promise<{ status: string; detail?: string }> {
  const src = await loadSourceRepo(serviceId);
  if (!src) return { status: "no-repo" };
  if (!src.token) return { status: "no-token" };
  const service = await prisma.service.findUniqueOrThrow({ where: { id: serviceId }, select: { id: true, slug: true } });
  let raw = preloaded;
  if (raw === undefined) {
    const read = await readRepoText(src.repo.provider as SourceProvider, src.baseUrl, src.repo.fullName, src.repo.defaultBranch, src.token, HUB_FILE);
    if (read.status === 404) return { status: "absent" };
    if (read.text === null) return { status: "error", detail: `A origem respondeu ${read.status}.` };
    raw = read.text;
  }
  const parsed = parseHubManifest(raw);
  if (!parsed.ok) return { status: "invalid", detail: parsed.error };
  if (parsed.manifest.slug && parsed.manifest.slug !== service.slug) return { status: "other-system" };
  const linked = await prisma.serviceRepository.count({ where: { repositoryId: src.repo.id, role: "SOURCE" } });
  if (!parsed.manifest.slug && linked > 1) return { status: "needs-slug", detail: "hub.json sem slug e o repositório está ligado a mais de um sistema." };

  const known = new Set((await prisma.service.findMany({ select: { slug: true } })).map((s) => s.slug));
  known.delete(service.slug);
  const plan = planHubManifest(parsed.manifest, known);
  const envs = await prisma.environment.findMany({ select: { id: true, slug: true } });
  const envBySlug = new Map(envs.map((e) => [e.slug, e.id]));

  await prisma.$transaction(async (tx) => {
    if (plan.kind) await tx.service.update({ where: { id: service.id }, data: { kind: plan.kind } });
    await tx.serviceChannel.deleteMany({ where: { serviceId: service.id } });
    for (const channel of plan.channels) {
      const created = await tx.serviceChannel.create({ data: { serviceId: service.id, protocol: channel.protocol, name: channel.name } });
      const addresses = Object.entries(channel.addresses).flatMap(([slug, value]) => {
        const environmentId = envBySlug.get(slug);
        return environmentId ? [{ channelId: created.id, environmentId, value }] : [];
      });
      if (addresses.length) await tx.channelAddress.createMany({ data: addresses });
    }
    await tx.serviceDependency.deleteMany({ where: { fromServiceId: service.id, kind: "CONSUMES" } });
    await tx.operationCall.deleteMany({ where: { fromServiceId: service.id } });
    for (const consume of plan.consumes) {
      const targetService = await tx.service.findUnique({ where: { slug: consume.service }, select: { id: true } });
      if (!targetService) continue;
      await tx.serviceDependency.create({ data: { fromServiceId: service.id, toServiceId: targetService.id, kind: "CONSUMES", protocol: consume.protocol, detected: true } });
      if (consume.calls.length) {
        await tx.operationCall.createMany({
          data: consume.calls.map((c) => ({ fromServiceId: service.id, toServiceId: targetService.id, method: c.method, path: c.path })),
        });
      }
    }
    await tx.serviceResource.deleteMany({ where: { serviceId: service.id } });
    for (const resource of plan.resources) {
      const saved = await tx.externalResource.upsert({
        where: { slug: resource.slug },
        create: { slug: resource.slug, name: resource.name, kind: resource.kind, provider: resource.provider },
        update: { name: resource.name, kind: resource.kind, provider: resource.provider },
      });
      await tx.serviceResource.create({ data: { serviceId: service.id, resourceId: saved.id, relation: resource.relation } });
    }
  });

  const unknown = [...plan.unknownServices, ...plan.rejected];
  await audit({ actorId, action: "hub.applied", targetType: "service", targetId: service.id, metadata: { repository: src.repo.fullName, unknown } });
  return { status: "applied", detail: unknown.length ? unknown.join(" ") : undefined };
}

/** Monta o hub.json atual e grava no repositório quando o token puder e o arquivo remoto não divergiu. */
export async function publishHubFile(serviceId: string, actorId: string | null, opts?: { force?: boolean }): Promise<{ text: string | null; note: string }> {
  const text = await renderServiceHubFile(serviceId);
  if (!text) return { text: null, note: "" };
  const src = await loadSourceRepo(serviceId);
  if (!src) return { text, note: "Copie o hub.json para a raiz do repositório de código-fonte." };
  if (!src.token) return { text, note: "Sem token de repositório. Copie o hub.json para subir à mão." };
  const sync = await loadRepoSync(serviceId);
  const remote = await readRepoText(src.repo.provider as SourceProvider, src.baseUrl, src.repo.fullName, src.repo.defaultBranch, src.token, HUB_FILE);
  if (remote.text === null && remote.status !== 404) return { text, note: `Não li o hub.json (resposta ${remote.status}). O texto continua aqui para copiar.` };
  const decision = opts?.force ? "write" : fileWriteDecision(sync.files[HUB_FILE], remote.status === 404 ? null : remote.text, text);
  if (decision === "conflict") {
    sync.conflicts = [...sync.conflicts.filter((c) => c.field !== "hub"), { field: "hub", hub: text, git: remote.text ?? "", path: HUB_FILE }];
    await saveRepoSync(serviceId, sync);
    return { text, note: "O hub.json no repositório divergiu. Escolha qual versão fica em Configurações." };
  }
  if (decision === "skip") {
    sync.files[HUB_FILE] = contentHash(text);
    sync.conflicts = sync.conflicts.filter((c) => c.field !== "hub");
    await saveRepoSync(serviceId, sync);
    return { text, note: `hub.json já está igual em ${src.repo.fullName}.` };
  }
  const written = await writeRepoText(src.repo.provider as SourceProvider, src.baseUrl, src.repo.fullName, src.repo.defaultBranch, src.token, HUB_FILE, text, "Atualiza hub.json a partir do Rizoma");
  if (written.ok) {
    sync.files[HUB_FILE] = contentHash(text);
    sync.conflicts = sync.conflicts.filter((c) => c.field !== "hub");
    await saveRepoSync(serviceId, sync);
    await audit({ actorId, action: "hub.written", targetType: "service", targetId: serviceId, metadata: { repository: src.repo.fullName } });
    return { text, note: `hub.json gravado em ${src.repo.fullName}.` };
  }
  if (written.status === 401 || written.status === 403) return { text, note: "O token não escreve no repositório. Copie o hub.json abaixo e suba à mão." };
  return { text, note: `Não gravei o hub.json (resposta ${written.status}). O texto continua aqui para copiar.` };
}
