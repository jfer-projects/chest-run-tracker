import type { WorkoutSessionLog } from './types';

export interface CloudSessionRow {
  id: string;
  data: WorkoutSessionLog;
  deleted: boolean;
}

export interface MergeResult {
  /** Combined history to keep locally, newest first. */
  history: WorkoutSessionLog[];
  /** Local sessions the cloud doesn't have yet. */
  toUpload: WorkoutSessionLog[];
  /** Local deletions the cloud still shows as live. */
  toDelete: string[];
}

/**
 * Sessions are never edited after saving, so merging is a union by id where a deletion
 * from either side wins.
 */
export function mergeHistory(
  local: WorkoutSessionLog[],
  pendingDeletes: string[],
  cloud: CloudSessionRow[],
): MergeResult {
  const cloudById = new Map(cloud.map((r) => [r.id, r]));
  const deletedHere = new Set(pendingDeletes);
  const merged = new Map<string, WorkoutSessionLog>();

  for (const log of local) {
    if (!cloudById.get(log.id)?.deleted) merged.set(log.id, log);
  }
  for (const row of cloud) {
    if (!row.deleted && !deletedHere.has(row.id) && !merged.has(row.id)) merged.set(row.id, row.data);
  }

  return {
    history: [...merged.values()].sort((a, b) => b.date.localeCompare(a.date)),
    toUpload: [...merged.values()].filter((log) => !cloudById.has(log.id)),
    toDelete: pendingDeletes.filter((id) => !cloudById.get(id)?.deleted),
  };
}
