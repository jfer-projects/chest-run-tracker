'use client';

import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { CardioIcon } from './RunTimer';
import type { ExerciseId, WorkoutSessionLog } from '@/lib/types';
import { EXERCISES, WORKOUTS } from '@/lib/workouts';
import { formatDate, formatDuration, formatTime } from '@/lib/format';
import { sessionTotals } from '@/lib/stats';
import { WorkoutBadge } from './ui';

export function SessionCard({
  log,
  expandable = true,
  onDelete,
}: {
  log: WorkoutSessionLog;
  expandable?: boolean;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const totals = sessionTotals(log);
  const template = WORKOUTS[log.workoutType];
  // Show exercises in template order (swaps sit where the original would), rather than object-key order.
  const order = [
    ...new Set(template.blocks.flatMap((b) => b.exercises).flatMap((id) => [id, ...(EXERCISES[id].swaps ?? [])])),
  ].filter((id) => log.sets[id]?.length);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <button
        type="button"
        disabled={!expandable}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <WorkoutBadge type={log.workoutType} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-semibold text-zinc-100">
            {formatDate(log.date)}
            <span className="text-xs font-normal text-zinc-500">{formatTime(log.date)}</span>
          </div>
          <div className="truncate text-sm text-zinc-400">
            {totals.sets} sets · {totals.reps} reps
            {totals.volumeLbs > 0 && ` · ${totals.volumeLbs.toLocaleString()} lb`} · {formatDuration(log.durationSeconds)}
          </div>
        </div>
        {log.runCompleted && (
          <span className="flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-400">
            <CardioIcon mode={log.cardioMode ?? 'run'} className="size-3.5" />
            {log.cardioMode === 'bike' ? 'Ride' : 'Run'}
          </span>
        )}
        {expandable && <ChevronDown className={`size-5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-zinc-800 px-4 pt-3 pb-4">
          {order.map((id) => (
            <ExerciseSets key={id} id={id} log={log} />
          ))}
          {log.notes && <p className="rounded-xl bg-zinc-800/60 p-3 text-sm text-zinc-300 italic">{log.notes}</p>}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this session from history?')) onDelete();
              }}
              className="flex items-center gap-1.5 text-sm text-rose-400"
            >
              <Trash2 className="size-4" /> Delete session
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseSets({ id, log }: { id: ExerciseId; log: WorkoutSessionLog }) {
  const ex = EXERCISES[id];
  const sets = (log.sets[id] ?? []).filter(Boolean);
  return (
    <div>
      <div className="mb-1 text-sm font-medium text-zinc-200">{ex.name}</div>
      <div className="flex flex-wrap gap-1.5">
        {sets.map((s) => (
          <span key={s.setNumber} className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
            {s.completedReps ?? '–'}
            {ex.unit === 'seconds' ? 's' : ''}
            {s.weightLbs ? ` × ${s.weightLbs} lb` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
