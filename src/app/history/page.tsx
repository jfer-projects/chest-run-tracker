'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/lib/hooks';
import { chestOnly, sessionsInWeek, startOfWeek } from '@/lib/stats';
import { BottomNav } from '@/components/ui';
import { SessionCard } from '@/components/SessionCard';
import type { WorkoutType } from '@/lib/types';

const RANGES = [
  { id: '7', label: '7 days', days: 7 },
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: '90 days', days: 90 },
  { id: 'all', label: 'All', days: Infinity },
] as const;

const WEEKS_SHOWN = 8;

export default function HistoryPage() {
  const hydrated = useHydrated();
  const { history, settings, deleteLog } = useStore();
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('30');
  const [type, setType] = useState<WorkoutType | 'all'>('all');

  if (!hydrated) return <div className="min-h-dvh" />;

  const days = RANGES.find((r) => r.id === range)!.days;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const filtered = history.filter(
    (h) => (type === 'all' || h.workoutType === type) && new Date(h.date).getTime() >= cutoff,
  );

  const thisWeek = startOfWeek(new Date());
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - (WEEKS_SHOWN - 1 - i) * 7);
    return { start, count: sessionsInWeek(chestOnly(history), start).length };
  });

  return (
    <main className="px-4 pt-safe pb-28">
      <h1 className="mb-5 text-2xl font-bold tracking-tight">History</h1>

      <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="mb-3 flex justify-between text-sm">
          <span className="font-semibold">Weekly chest sessions</span>
          <span className="text-zinc-500">target {settings.weeklyTarget}</span>
        </div>
        <div className="flex h-24 items-end gap-2">
          {weeks.map((w) => {
            const hit = w.count >= settings.weeklyTarget;
            const h = Math.min(1, w.count / Math.max(settings.weeklyTarget, 1));
            return (
              <div key={w.start.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-zinc-500">{w.count || ''}</span>
                <div className="flex h-16 w-full items-end rounded-md bg-zinc-800">
                  <div
                    className={`w-full rounded-md ${hit ? 'bg-emerald-500' : 'bg-emerald-500/40'}`}
                    style={{ height: `${h * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-600">
                  {w.start.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mb-2 flex gap-2 overflow-x-auto">
        {RANGES.map((r) => (
          <Chip key={r.id} active={range === r.id} onClick={() => setRange(r.id)}>
            {r.label}
          </Chip>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        {(['all', 'A', 'B', 'L'] as const).map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>
            {t === 'all' ? 'All' : t === 'L' ? 'Legs' : `Workout ${t}`}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
          No sessions in this range.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <SessionCard key={log.id} log={log} onDelete={() => deleteLog(log.id)} />
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
        active ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400'
      }`}
    >
      {children}
    </button>
  );
}
