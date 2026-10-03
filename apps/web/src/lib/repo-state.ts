import { prisma, type Prisma } from "@api-hub/db";
import type { SyncField } from "@api-hub/core";

export type StoredConflict = { field: SyncField | "doc"; hub: string; git: string; path: string };

export type RepoSyncState = {
  files: Record<string, string>;
  conflicts: StoredConflict[];
};

function isConflict(value: unknown): value is StoredConflict {
  if (!value || typeof value !== "object") return false;
  const row = value as StoredConflict;
  return typeof row.field === "string" && typeof row.hub === "string" && typeof row.git === "string" && typeof row.path === "string";
}

export function parseRepoSync(raw: Prisma.JsonValue | null): RepoSyncState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { files: {}, conflicts: [] };
  const body = raw as { files?: unknown; conflicts?: unknown };
  const files = body.files && typeof body.files === "object" && !Array.isArray(body.files)
    ? Object.fromEntries(Object.entries(body.files).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
    : {};
  const conflicts = Array.isArray(body.conflicts) ? body.conflicts.filter(isConflict) : [];
  return { files, conflicts };
}

export async function loadRepoSync(serviceId: string): Promise<RepoSyncState> {
  const row = await prisma.service.findUnique({ where: { id: serviceId }, select: { repoSync: true } });
  return parseRepoSync(row?.repoSync ?? null);
}

export async function saveRepoSync(serviceId: string, state: RepoSyncState): Promise<void> {
  await prisma.service.update({ where: { id: serviceId }, data: { repoSync: state } });
}
