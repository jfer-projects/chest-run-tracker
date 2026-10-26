'use client';

import { useState } from 'react';
import { Cloud, CloudOff, LogOut, RefreshCw } from 'lucide-react';
import { signIn, signOut, syncNow, useSyncStatus } from '@/lib/sync';
import { useStore } from '@/lib/store';
import { formatTime } from '@/lib/format';

export function CloudBackup() {
  const { state, email, lastSyncedAt, error } = useSyncStatus();
  const sessions = useStore((s) => s.history.length);
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (state === 'signed-out') {
    return (
      <form
        className="space-y-3 rounded-2xl bg-zinc-900 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setFormError(await signIn(form.email, form.password));
          setBusy(false);
        }}
      >
        <div className="flex items-center gap-2 text-zinc-300">
          <CloudOff className="size-5 text-zinc-500" />
          <span className="font-medium">Not backed up</span>
        </div>
        <p className="text-sm text-zinc-500">
          Sign in with your MealApp account to back up your history and streak and sync across devices.
        </p>
        <input
          type="email"
          autoComplete="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 outline-none focus:border-emerald-500"
        />
        <input
          type="password"
          autoComplete="current-password"
          required
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-zinc-100 outline-none focus:border-emerald-500"
        />
        {formError && <p className="text-sm text-rose-400">{formError}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-zinc-950 disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in & back up'}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-zinc-900 p-4">
      <div className="flex items-center gap-2">
        <Cloud className={`size-5 ${state === 'error' ? 'text-amber-400' : 'text-emerald-400'}`} />
        <span className="min-w-0 flex-1 truncate font-medium">{email}</span>
      </div>
      <p className={`text-sm ${state === 'error' ? 'text-amber-400' : 'text-zinc-500'}`}>
        {state === 'syncing'
          ? 'Syncing…'
          : state === 'error'
            ? error
            : lastSyncedAt
              ? `${sessions} sessions backed up · last synced ${formatTime(new Date(lastSyncedAt).toISOString())}`
              : 'Connected'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void syncNow()}
          disabled={state === 'syncing'}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 font-medium text-zinc-200 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${state === 'syncing' ? 'animate-spin' : ''}`} /> Sync now
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Sign out? Your history stays on this device; it just stops syncing.')) void signOut();
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 font-medium text-zinc-400"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
