'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronRight, Eye, Lightbulb, Pencil, Play, Plus, Timer, Wrench } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useNow } from '@/lib/hooks';
import { countdownDone, countdownTick, tap } from '@/lib/cues';
import { formatClock } from '@/lib/format';
import type { Effort, ExerciseDefinition } from '@/lib/types';
import { ExerciseDemo, demoThumb } from './Demo';
import { HowToDetails } from './HowTo';
import { ProgressRing, Segmented, Sheet } from './ui';

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
  /** Name of the exercise after this one, if any. */
  afterName: string | null;
}

/**
 * Full-screen rest between sets. The time is for recovering and getting ready, so it shows what's coming
 * (picture, target, last time), lets you open a full preview of the next exercise without stopping the
 * countdown, and lets you fix a mis-tapped set.
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
  const [preview, setPreview] = useState(false);
  // The ring's full length is the first value seen, and grows when +15s is tapped.
  const total = useRef(0);
  total.current = Math.max(total.current, remaining);

  // The countdown lives here, so it keeps beeping and finishing while the preview sheet is open.
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
  const ex = next.exercise;

  return (
    <div className="animate-fade pb-safe pt-safe-sm fixed inset-0 z-30 mx-auto flex max-w-md flex-col bg-page px-4">
      <div className="flex min-h-11 shrink-0 items-center justify-between gap-2">
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

      {/* Only this middle part scrolls (large text sizes); the card and buttons below stay put. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
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

        <div className="flex min-h-[18rem] flex-col items-center justify-center py-3">
          <span
            className="rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase"
            style={{ background: `${accent}26`, color: accent }}
          >
            {transition ? 'Switch to your partner exercise' : 'Rest and recover'}
          </span>
          <div className="my-5" role="timer" aria-label={`${remaining} seconds remaining`}>
            <ProgressRing value={remaining} max={total.current} size={216} stroke={14} color={accent}>
              <span className={`num text-7xl font-black ${urgent ? 'text-amber-400' : 'text-white'}`}>{formatClock(remaining)}</span>
            </ProgressRing>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPreview(true)}
        aria-label={`Preview ${ex.name}`}
        className="press mt-1 w-full shrink-0 rounded-3xl bg-surface p-3 text-left ring-1 ring-line"
      >
        <div className="flex items-center gap-3">
          <div className={`h-[4.5rem] w-24 shrink-0 overflow-hidden rounded-2xl ${thumb.dark ? 'bg-zinc-950' : 'bg-white'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.src} alt="" className="size-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">
              Up next · {next.label} · Set {next.round} of {next.rounds}
            </p>
            <p className="mt-0.5 leading-tight font-bold">{ex.name}</p>
            <p className="mt-1 text-sm text-zinc-300">
              {next.target !== null ? (
                <>
                  Target <span className="font-bold text-white">{next.target} reps</span>
                </>
              ) : (
                <>Target {ex.targetReps.toLowerCase()}</>
              )}
              {next.last && <span className="text-muted"> · last {next.last}</span>}
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
          <Eye className="size-3.5" aria-hidden="true" /> Tap to preview. The timer keeps running.
        </p>
      </button>

      <div className="mt-3 grid shrink-0 grid-cols-[auto_1fr] gap-3">
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

      <Sheet open={preview} onClose={() => setPreview(false)} title={ex.name}>
        <div className="pb-3">
          {/* Live countdown so it is obvious the rest is still ticking. */}
          <div
            className="num sticky top-0 z-10 -mx-4 mb-3 flex items-center justify-between gap-3 bg-surface px-4 py-2"
            role="timer"
            aria-label={`${remaining} seconds of rest left`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Timer className="size-4" style={{ color: accent }} aria-hidden="true" /> Rest continues
            </span>
            <span className="text-xl font-black" style={{ color: accent }}>
              {formatClock(remaining)}
            </span>
          </div>

          <p className="mb-1 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
            {next.label} · Set {next.round} of {next.rounds} · {ex.targetMuscle}
          </p>

          <div className="mb-3 flex items-end justify-between gap-3">
            <p className="num text-4xl leading-none font-black">
              {next.target !== null ? (
                <>
                  {next.target}
                  <span className="ml-1.5 text-base font-semibold text-muted">reps</span>
                </>
              ) : (
                <span className="text-2xl">{ex.targetReps}</span>
              )}
            </p>
            {next.last && (
              <p className="num rounded-xl bg-raised px-3 py-1.5 text-right text-sm">
                <span className="block text-[10px] font-semibold tracking-wider text-muted uppercase">Last time</span>
                {next.last}
              </p>
            )}
          </div>

          {ex.setup && (
            <p className="mb-3 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-300">
              <Wrench className="size-4 shrink-0" aria-hidden="true" /> Setup: {ex.setup}
            </p>
          )}

          <ExerciseDemo exercise={ex} />

          <p className="mt-3 flex gap-2.5 rounded-2xl bg-surface p-3 text-[15px] leading-snug font-medium ring-1 ring-line">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
            {ex.formCues[0]}
          </p>
          <div className="mt-4">
            <HowToDetails exercise={ex} showLevelUp={false} />
          </div>

          {next.afterName && (
            <p className="mt-3 text-sm text-muted">
              After that: <span className="text-zinc-300">{next.afterName}</span>
            </p>
          )}

          <button
            type="button"
            onClick={() => setPreview(false)}
            className="press mt-4 min-h-14 w-full rounded-2xl bg-raised text-lg font-bold"
          >
            Back to rest
          </button>
        </div>
      </Sheet>
    </div>
  );
}
