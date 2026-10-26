'use client';

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useStore } from './store';
import { mergeHistory, type CloudRow, type DatedRecord, type MergeResult } from './merge';
import type { Measurement, Settings, WorkoutSessionLog } from './types';

export type SyncState = 'signed-out' | 'idle' | 'syncing' | 'error';

interface SyncStatus {
  state: SyncState;
  email: string | null;
  lastSyncedAt: number | null;
  error: string | null;
}

export const useSyncStatus = create<SyncStatus>(() => ({
  state: 'signed-out',
  email: null,
  lastSyncedAt: null,
  error: null,
}));

let running = false;
let rerun = false;
let applyingRemote = false;
let debounce: number | undefined;

type Writes = PromiseLike<{ error: unknown }>[];

/** Queues uploads for new local records and tombstones for local deletions. */
function queueRecordWrites<T extends DatedRecord>(table: string, merged: MergeResult<T>, writes: Writes) {
  const sb = supabase();
  if (merged.toUpload.length) {
    writes.push(
      sb.from(table).upsert(
        merged.toUpload.map((r) => ({ id: r.id, data: r, logged_at: r.date, deleted: false })),
        { onConflict: 'user_id,id' },
      ),
    );
  }
  if (merged.toDelete.length) {
    const now = new Date().toISOString();
    writes.push(
      sb.from(table).upsert(
        merged.toDelete.map((id) => ({ id, data: {}, logged_at: now, deleted: true, updated_at: now })),
        { onConflict: 'user_id,id' },
      ),
    );
  }
}

/** Two-way sync: pulls cloud history and settings, pushes anything this device has that the cloud lacks. */
export async function syncNow(): Promise<void> {
  const sb = supabase();
  const { data: auth } = await sb.auth.getSession();
  if (!auth.session) return;
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  useSyncStatus.setState({ state: 'syncing', error: null });

  try {
    const [sessionsRes, measurementsRes, settingsRes] = await Promise.all([
      sb.from('chestrun_sessions').select('id, data, deleted'),
      sb.from('chestrun_measurements').select('id, data, deleted'),
      sb.from('chestrun_settings').select('data, updated_at').maybeSingle(),
    ]);
    if (sessionsRes.error) throw sessionsRes.error;
    if (measurementsRes.error) throw measurementsRes.error;
    if (settingsRes.error) throw settingsRes.error;
    const cloudSessions = sessionsRes.data as CloudRow<WorkoutSessionLog>[];
    const cloudMeasurements = measurementsRes.data as CloudRow<Measurement>[];

    // Merge against the freshest local state so a workout saved mid-sync isn't lost.
    const local = useStore.getState();
    const merged = mergeHistory(local.history, local.pendingDeletes, cloudSessions);
    const mergedMeasurements = mergeHistory(local.measurements, local.pendingMeasurementDeletes, cloudMeasurements);

    const writes: Writes = [];
    queueRecordWrites('chestrun_sessions', merged, writes);
    queueRecordWrites('chestrun_measurements', mergedMeasurements, writes);

    // Settings: last write wins between this device and the cloud.
    const cloudSettings = settingsRes.data as { data: Settings; updated_at: string } | null;
    const cloudSettingsAt = cloudSettings ? new Date(cloudSettings.updated_at).getTime() : 0;
    const takeCloudSettings = cloudSettings !== null && cloudSettingsAt > local.settingsUpdatedAt;
    if (!takeCloudSettings && local.settingsUpdatedAt > cloudSettingsAt) {
      writes.push(
        sb.from('chestrun_settings').upsert(
          { data: local.settings, updated_at: new Date(local.settingsUpdatedAt).toISOString() },
          { onConflict: 'user_id' },
        ),
      );
    }

    for (const res of await Promise.all(writes)) if (res.error) throw res.error;

    applyingRemote = true;
    const now = useStore.getState();
    useStore.setState({
      history: mergeHistory(now.history, now.pendingDeletes, cloudSessions).history,
      pendingDeletes: now.pendingDeletes.filter((id) => !merged.toDelete.includes(id)),
      measurements: mergeHistory(now.measurements, now.pendingMeasurementDeletes, cloudMeasurements).history,
      pendingMeasurementDeletes: now.pendingMeasurementDeletes.filter((id) => !mergedMeasurements.toDelete.includes(id)),
      ...(takeCloudSettings
        ? { settings: { ...now.settings, ...cloudSettings.data }, settingsUpdatedAt: cloudSettingsAt }
        : {}),
    });
    applyingRemote = false;
    useSyncStatus.setState({ state: 'idle', lastSyncedAt: Date.now() });
  } catch (err) {
    applyingRemote = false;
    const message = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String(err.message) : 'Sync failed';
    useSyncStatus.setState({ state: 'error', error: navigator.onLine ? message : 'Offline: will sync when back online' });
  } finally {
    running = false;
    if (rerun) {
      rerun = false;
      void syncNow();
    }
  }
}

function scheduleSync(delayMs = 1500) {
  window.clearTimeout(debounce);
  debounce = window.setTimeout(() => void syncNow(), delayMs);
}

function applySession(session: Session | null) {
  useSyncStatus.setState(
    session ? { email: session.user.email ?? null, state: 'idle' } : { email: null, state: 'signed-out', lastSyncedAt: null },
  );
}

let started = false;

/** Wires up auth tracking and automatic sync triggers. Safe to call more than once. */
export function startSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const sb = supabase();

  sb.auth.getSession().then(({ data }) => {
    applySession(data.session);
    if (data.session) void syncNow();
  });
  sb.auth.onAuthStateChange((event, session) => {
    applySession(session);
    if (event === 'SIGNED_IN') void syncNow();
  });

  // Push local changes shortly after they happen (saved workout, deletion, settings).
  useStore.subscribe((state, prev) => {
    if (applyingRemote) return;
    if (
      state.history !== prev.history ||
      state.pendingDeletes !== prev.pendingDeletes ||
      state.measurements !== prev.measurements ||
      state.pendingMeasurementDeletes !== prev.pendingMeasurementDeletes ||
      state.settings !== prev.settings
    ) {
      scheduleSync();
    }
  });
  window.addEventListener('online', () => void syncNow());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  await supabase().auth.signOut();
}
