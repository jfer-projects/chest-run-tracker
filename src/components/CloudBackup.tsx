'use client';

import { useState } from 'react';
import { Eye, EyeOff, LogOut, RefreshCw } from 'lucide-react';
import { signIn, signOut, syncNow, useSyncStatus } from '@/lib/sync';
import { useStore } from '@/lib/store';
import { formatTime } from '@/lib/format';

const INPUT =
  'min-h-12 w-full rounded-xl bg-raised px-3 text-base text-zinc-100 ring-1 ring-line outline-none placeholder:text-muted focus:ring-emerald-500';

/** Short status for the collapsed settings row. */
export function useCloudSummary(): { title: string; hint: string; ok: boolean } {
  const { state, email, error } = useSyncStatus();
  if (state === 'signed-out') return { title: 'Cloud backup is off', hint: 'Sign in to keep your history and streak safe', ok: false };
  if (state === 'error') return { title: email ?? 'Signed in', hint: error ?? 'Sync problem', ok: false };
  return { title: email ?? 'Signed in', hint: state === 'syncing' ? 'Syncing…' : 'Backed up', ok: true };
}

/** Sign-in form, or sync status and controls once signed in. Rendered inside an expandable settings row. */
export function CloudBackup() {
  const { state, lastSyncedAt, error } = useSyncStatus();
  const sessions = useStore((s) => s.history.length);
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (state === 'signed-out') {
    return (
      <form
        className="space-y-3 px-4 pb-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setFormError(await signIn(form.email, form.password));
          setBusy(false);
        }}
      >
        <p className="text-sm text-zinc-300">
          Sign in with your MealApp account to back up your history and streak and sync across devices.
        </p>
        <input
          type="email"
          autoComplete="email"
          required
          aria-label="Email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={INPUT}
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            aria-label="Password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={`${INPUT} pr-12`}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((s) => !s)}
            className="press absolute top-0 right-0 flex size-12 items-center justify-center text-muted"
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {formError && (
          <p role="alert" className="text-sm text-rose-400">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="press min-h-12 w-full rounded-xl bg-emerald-500 font-bold text-zinc-950 disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in and back up'}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      <p className={`text-sm ${state === 'error' ? 'text-amber-300' : 'text-zinc-300'}`}>
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
          className="press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-raised font-semibold text-zinc-100 ring-1 ring-line disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${state === 'syncing' ? 'animate-spin' : ''}`} aria-hidden="true" /> Sync now
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-raised font-semibold text-zinc-300 ring-1 ring-line"
        >
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </div>
      <p className="text-xs text-muted">Signing out keeps your history on this device. It just stops syncing.</p>
    </div>
  );
}
