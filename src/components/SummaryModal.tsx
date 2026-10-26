'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Footprints, Trophy } from 'lucide-react';
import { useStore, type ActiveSession } from '@/lib/store';
import { WORKOUTS } from '@/lib/workouts';
import { sessionTotals } from '@/lib/stats';
import { formatDuration } from '@/lib/format';

export function SummaryModal({ session }: { session: ActiveSession }) {
  const router = useRouter();
  const { saveSession, discardSession } = useStore();
  const [notes, setNotes] = useState('');
  const totals = sessionTotals(session);
  const duration = Math.round(((session.endedAt ?? Date.now()) - session.startedAt) / 1000);

  const stats = [
    { label: 'Sets', value: totals.sets },
    { label: 'Reps', value: totals.reps },
    { label: 'Volume', value: totals.volumeLbs ? `${totals.volumeLbs.toLocaleString()} lb` : '–' },
    { label: 'Time', value: formatDuration(duration) },
  ];

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-10">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-amber-500/15">
          <Trophy className="size-10 text-amber-400" />
        </div>
        <h2 className="text-3xl font-bold">Session complete</h2>
        <p className="mt-1 text-zinc-400">
          {WORKOUTS[session.workoutType].name} · {WORKOUTS[session.workoutType].subtitle}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-zinc-900 p-4 text-center">
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-xs tracking-wider text-zinc-500 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div
        className={`mt-3 flex items-center gap-2 rounded-2xl p-4 ${
          session.run.completed ? 'bg-sky-500/10 text-sky-300' : 'bg-zinc-900 text-zinc-500'
        }`}
      >
        <Footprints className="size-5" />
        {session.run.completed ? '20-minute run completed' : 'Run not completed'}
      </div>

      <label className="mt-5 block text-sm font-medium text-zinc-300" htmlFor="notes">
        Notes
      </label>
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="How did it feel? Anything to change next time?"
        className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-500"
      />

      <div className="pb-safe mt-auto space-y-2 pt-6">
        <button
          type="button"
          onClick={() => {
            saveSession(notes);
            router.replace('/');
          }}
          className="w-full rounded-2xl bg-emerald-500 py-5 text-xl font-bold text-zinc-950 active:bg-emerald-400"
        >
          Save to History
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Discard this session? Nothing will be saved.')) {
              discardSession();
              router.replace('/');
            }
          }}
          className="w-full py-3 text-zinc-500"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
