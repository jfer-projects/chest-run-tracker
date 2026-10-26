'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/lib/hooks';
import { BADGE_COLORS, BottomNav, Segmented } from '@/components/ui';
import { SessionCard } from '@/components/SessionCard';
import { WORKOUTS } from '@/lib/workouts';
import type { WorkoutSessionLog, WorkoutType } from '@/lib/types';

type Filter = WorkoutType | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'A', label: 'A' },
  { id: 'B', label: 'B' },
  { id: 'L', label: 'Legs' },
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export default function HistoryPage() {
  const hydrated = useHydrated();
  const { history, deleteLog } = useStore();
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const matching = useMemo(() => history.filter((h) => filter === 'all' || h.workoutType === filter), [history, filter]);
  const byDay = useMemo(() => {
    const map = new Map<string, WorkoutSessionLog[]>();
    for (const h of matching) {
      const k = dayKey(new Date(h.date));
      map.set(k, [...(map.get(k) ?? []), h]);
    }
    return map;
  }, [matching]);

  if (!hydrated) return <div className="min-h-dvh" />;

  const thisMonth = monthStart(new Date());
  const earliest = history.length ? monthStart(new Date(history[history.length - 1].date)) : thisMonth;
  const canGoBack = month > earliest;
  const canGoForward = month < thisMonth;

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7; // Monday first
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayKey = dayKey(new Date());

  const inMonth = matching.filter((h) => {
    const d = new Date(h.date);
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  });
  const visible = selected ? (byDay.get(selected) ?? []) : inMonth;
  const monthName = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const selectedLabel = selected
    ? (() => {
        const [y, m, d] = selected.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      })()
    : null;

  const shift = (by: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));
    setSelected(null);
  };

  return (
    <main className="animate-rise space-y-4 px-4 pt-safe pb-28">
      <h1 className="text-2xl font-black tracking-tight">History</h1>

      <Segmented label="Filter by workout" options={FILTERS} value={filter} onChange={setFilter} />

      <section className="rounded-3xl bg-surface p-2 ring-1 ring-line" aria-label="Calendar">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => shift(-1)}
            className="press flex size-11 items-center justify-center rounded-full text-zinc-300 disabled:opacity-25"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="font-bold">{monthName}</h2>
          <button
            type="button"
            aria-label="Next month"
            disabled={!canGoForward}
            onClick={() => shift(1)}
            className="press flex size-11 items-center justify-center rounded-full text-zinc-300 disabled:opacity-25"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="pb-1 text-[11px] font-semibold text-muted">
              {w}
            </span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={`blank-${i}`} />;
            const key = dayKey(new Date(month.getFullYear(), month.getMonth(), day));
            const sessions = byDay.get(key) ?? [];
            const type = sessions[0]?.workoutType;
            const isToday = key === todayKey;
            const isSelected = key === selected;
            const label = `${monthName.split(' ')[0]} ${day}${sessions.length ? `: ${sessions.map((s) => WORKOUTS[s.workoutType].name).join(', ')}` : ''}`;
            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={isSelected}
                disabled={!sessions.length}
                onClick={() => setSelected(isSelected ? null : key)}
                className={`press relative flex aspect-square items-center justify-center rounded-full text-sm ${
                  type ? `${BADGE_COLORS[type]} font-black` : isToday ? 'text-zinc-100' : 'text-muted'
                } ${isSelected ? 'ring-2 ring-white' : isToday ? 'ring-1 ring-emerald-500/70' : ''}`}
              >
                {type ?? day}
                {type && <span className="absolute -top-0.5 -right-0.5 text-[9px] font-semibold text-zinc-300">{day}</span>}
                {sessions.length > 1 && <span className="absolute -bottom-0.5 size-1.5 rounded-full bg-white" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex min-h-11 items-center justify-between">
          <h2 className="min-w-0 font-bold">
            {selectedLabel ?? monthName.split(' ')[0]}
            <span className="num ml-2 text-sm font-normal whitespace-nowrap text-muted">
              {visible.length} {visible.length === 1 ? 'session' : 'sessions'}
            </span>
          </h2>
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="press flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-semibold whitespace-nowrap text-emerald-400"
            >
              <X className="size-4" aria-hidden="true" /> Clear
            </button>
          )}
        </div>
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {history.length === 0 ? 'No sessions yet. Your first workout will show up here.' : 'No sessions in this view.'}
          </p>
        ) : (
          <div className="space-y-2">
            {visible.map((log) => (
              <SessionCard key={log.id} log={log} onDelete={() => deleteLog(log.id)} />
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
