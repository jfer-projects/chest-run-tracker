/** Anything synced as an immutable, dated record: workout sessions and body measurements. */
export interface DatedRecord {
  id: string;
  date: string;
}

export interface CloudRow<T> {
  id: string;
  data: T;
  deleted: boolean;
}

export interface MergeResult<T> {
  /** Combined records to keep locally, newest first. */
  history: T[];
  /** Local records the cloud doesn't have yet. */
  toUpload: T[];
  /** Local deletions the cloud still shows as live. */
  toDelete: string[];
}

/**
 * Records are never edited after saving, so merging is a union by id where a deletion
 * from either side wins.
 */
export function mergeHistory<T extends DatedRecord>(local: T[], pendingDeletes: string[], cloud: CloudRow<T>[]): MergeResult<T> {
  const cloudById = new Map(cloud.map((r) => [r.id, r]));
  const deletedHere = new Set(pendingDeletes);
  const merged = new Map<string, T>();

  for (const record of local) {
    if (!cloudById.get(record.id)?.deleted) merged.set(record.id, record);
  }
  for (const row of cloud) {
    if (!row.deleted && !deletedHere.has(row.id) && !merged.has(row.id)) merged.set(row.id, row.data);
  }

  return {
    history: [...merged.values()].sort((a, b) => b.date.localeCompare(a.date)),
    toUpload: [...merged.values()].filter((r) => !cloudById.has(r.id)),
    toDelete: pendingDeletes.filter((id) => !cloudById.get(id)?.deleted),
  };
}
