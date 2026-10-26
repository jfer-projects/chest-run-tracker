'use client';

import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { CardioIcon } from './RunTimer';
import type { ExerciseId, WorkoutSessionLog } from '@/lib/types';
import { EXERCISES, WORKOUTS } from '@/lib/workouts';
import { formatDuration, formatTime, relativeDay } from '@/lib/format';
import { sessionTotals } from '@/lib/stats';
import { Sheet, WorkoutBadge } from './ui';

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totals = sessionTotals(log);
  const template = WORKOUTS[log.workoutType];
  // Show exercises in template order (swaps sit where the original would), rather than object-key order.
  const order = [
    ...new Set(template.blocks.flatMap((b) => b.exercises).flatMap((id) => [id, ...(EXERCISES[id].swaps ?? [])])),
  ].filter((id) => log.sets[id]?.length);
  const cardio = log.cardioMode ?? 'run';

  return (
    <div className="rounded-2xl bg-surface ring-1 ring-line">
      <button
        type="button"
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => setOpen((o) => !o)}
        className="press flex min-h-16 w-full items-center gap-3 p-3 text-left"
      >
        <WorkoutBadge type={log.workoutType} />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{template.name}</p>
          <p className="num text-sm text-muted">
            {relativeDay(log.date)} · {formatTime(log.date)} · {formatDuration(log.durationSeconds)}
          </p>
          <p className="num mt-0.5 text-sm text-zinc-300">
            {totals.sets} sets · {totals.reps} reps
            {totals.volumeLbs > 0 && ` · ${totals.volumeLbs.toLocaleString()} lb`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {log.runCompleted && (
            <span className="flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-300">
              <CardioIcon mode={cardio} className="size-3.5" />
              {cardio === 'bike' ? 'Ride' : 'Run'}
            </span>
          )}
          {expandable && <ChevronDown className={`size-5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />}
        </div>
      </button>

      {open && (
        <div className="animate-fade space-y-3 border-t border-line px-3 pt-3 pb-3">
          {order.map((id) => (
            <ExerciseSets key={id} id={id} log={log} />
          ))}
          {log.notes && <p className="rounded-xl bg-raised p-3 text-sm text-zinc-300 italic">{log.notes}</p>}
          {onDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="press flex min-h-11 items-center gap-1.5 text-sm font-semibold text-rose-400"
            >
              <Trash2 className="size-4" aria-hidden="true" /> Delete session
            </button>
          )}
        </div>
      )}

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this session?">
        <p className="mb-4 text-zinc-300">
          {template.name} from {relativeDay(log.date)} will be removed from your history and any synced devices.
        </p>
        <div className="grid grid-cols-2 gap-3 pb-2">
          <button type="button" onClick={() => setConfirmDelete(false)} className="press min-h-14 rounded-2xl bg-raised font-semibold">
            Keep it
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmDelete(false);
              onDelete?.();
            }}
            className="press min-h-14 rounded-2xl bg-rose-500 font-bold text-white"
          >
            Delete
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function ExerciseSets({ id, log }: { id: ExerciseId; log: WorkoutSessionLog }) {
  const ex = EXERCISES[id];
  const sets = (log.sets[id] ?? []).filter(Boolean);
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-zinc-200">{ex.name}</p>
      <div className="flex flex-wrap gap-1.5">
        {sets.map((s) => (
          <span key={s.setNumber} className="num rounded-lg bg-raised px-2 py-1 text-xs text-zinc-200">
            {s.completedReps ?? '–'}
            {ex.unit === 'seconds' ? 's' : ''}
            {s.weightLbs ? ` × ${s.weightLbs} lb` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
