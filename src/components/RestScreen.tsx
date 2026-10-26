'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, Pencil, Play, Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useNow } from '@/lib/hooks';
import { countdownDone, countdownTick, tap } from '@/lib/cues';
import { formatClock } from '@/lib/format';
import type { Effort, ExerciseDefinition } from '@/lib/types';
import { demoThumb } from './Demo';
import { ProgressRing, Segmented } from './ui';

export interface UpNext {
  exercise: ExerciseDefinition;
  /** "1B", "Finisher", etc. */
  label: string;
  round: number;
  rounds: number;
  /** Personal rep target for the coming set, or null for to-failure work. */
  target: number | null;
  /** Last session's sets for this exercise, formatted. */
  last: string | null;
}

/**
 * Full-screen rest between sets. The time is for recovering and getting ready, so it shows what's coming
 * (picture, target, last time) and lets you fix a mis-tapped set.
 */
export function RestScreen({
  endsAt,
  transition,
  recap,
  effort,
  onRate,
  next,
  onEditLast,
}: {
  endsAt: number;
  transition: boolean;
  /** What was just logged, e.g. "12 reps @ 35 lb". */
  recap: string | null;
  /** How the set just logged felt; changing it updates the next set's target. */
  effort: Effort;
  onRate: (e: Effort) => void;
  next: UpNext;
  onEditLast: () => void;
}) {
  const { addRest, endRest } = useStore();
  const now = useNow(true, 100);
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const announced = useRef<number | null>(null);
  // The ring's full length is the first value seen, and grows when +15s is tapped.
  const total = useRef(0);
  total.current = Math.max(total.current, remaining);

  useEffect(() => {
    if (announced.current === remaining) return;
    announced.current = remaining;
    if (remaining >= 1 && remaining <= 3) countdownTick();
    if (remaining === 0) {
      countdownDone();
      endRest();
    }
  }, [remaining, endRest]);

  const urgent = remaining <= 3;
  const accent = urgent ? '#f59e0b' : transition ? '#10b981' : '#38bdf8';
  const thumb = demoThumb(next.exercise);

  return (
    <div className="animate-fade pb-safe pt-safe-sm fixed inset-0 z-30 mx-auto flex max-w-md flex-col bg-page px-4">
      <div className="flex min-h-11 items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-sm text-zinc-300">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden="true" />
          <span className="truncate">{recap ? `Logged ${recap}` : 'Set logged'}</span>
        </p>
        <button
          type="button"
          onClick={onEditLast}
          className="press flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-emerald-400"
        >
          <Pencil className="size-4" aria-hidden="true" /> Edit
        </button>
      </div>

      <div className="mt-1">
        <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">How did that set feel?</p>
        <Segmented
          label="How did that set feel?"
          options={[
            { id: 'easy', label: 'Easy' },
            { id: 'solid', label: 'Solid' },
            { id: 'max', label: 'Max' },
          ]}
          value={effort}
          onChange={onRate}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <span
          className="rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase"
          style={{ background: `${accent}26`, color: accent }}
        >
          {transition ? 'Switch to your partner exercise' : 'Rest and recover'}
        </span>
        <div className="my-6" role="timer" aria-label={`${remaining} seconds remaining`}>
          <ProgressRing value={remaining} max={total.current} size={232} stroke={14} color={accent}>
            <span className={`num text-7xl font-black ${urgent ? 'text-amber-400' : 'text-white'}`}>{formatClock(remaining)}</span>
          </ProgressRing>
        </div>
      </div>

      <section aria-label="Up next" className="rounded-3xl bg-surface p-3 ring-1 ring-line">
        <div className="flex gap-3">
          <div className={`h-[4.5rem] w-24 shrink-0 overflow-hidden rounded-2xl ${thumb.dark ? 'bg-zinc-950' : 'bg-white'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.src} alt="" className="size-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">
              Up next · {next.label} · Set {next.round} of {next.rounds}
            </p>
            <p className="mt-0.5 leading-tight font-bold">{next.exercise.name}</p>
            <p className="mt-1 text-sm text-zinc-300">
              {next.target !== null ? (
                <>
                  Target <span className="font-bold text-white">{next.target} reps</span>
                </>
              ) : (
                <>Target {next.exercise.targetReps.toLowerCase()}</>
              )}
              {next.last && <span className="text-muted"> · last {next.last}</span>}
            </p>
          </div>
        </div>
        {next.exercise.setup && (
          <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300">
            Setup: {next.exercise.setup}
          </p>
        )}
      </section>

      <div className="mt-3 grid grid-cols-[auto_1fr] gap-3">
        <button
          type="button"
          onClick={() => {
            tap();
            addRest(15);
          }}
          className="press flex min-h-14 items-center justify-center gap-1 rounded-2xl bg-raised px-5 text-lg font-bold"
        >
          <Plus className="size-5" aria-hidden="true" /> 15s
        </button>
        <button
          type="button"
          onClick={endRest}
          className="press flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-lg font-bold text-zinc-950"
        >
          <Play className="size-5 fill-current" aria-hidden="true" /> I&apos;m ready
        </button>
      </div>
    </div>
  );
}
