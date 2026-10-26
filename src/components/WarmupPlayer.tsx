'use client';

import { useEffect, useRef } from 'react';
import { Flame, SkipForward } from 'lucide-react';
import { useStore, type ActiveSession } from '@/lib/store';
import { useNow } from '@/lib/hooks';
import { warmupFor } from '@/lib/workouts';
import { countdownDone, countdownTick } from '@/lib/cues';
import { formatClock } from '@/lib/format';
import { ProgressRing } from './ui';

const ORANGE = '#fb923c';

export function WarmupPlayer({ session }: { session: ActiveSession }) {
  const { nextWarmup, skipWarmup } = useStore();
  const steps = warmupFor(session.workoutType);
  const index = session.warmupIndex ?? 0;
  const step = steps[index];
  const now = useNow(true, 200);
  const remaining = Math.max(0, Math.ceil(((session.warmupEndsAt ?? now) - now) / 1000));
  const announced = useRef<string | null>(null);

  // 3-2-1 ticks, then move on automatically.
  useEffect(() => {
    const key = `${index}:${remaining}`;
    if (announced.current === key) return;
    announced.current = key;
    if (remaining >= 1 && remaining <= 3) countdownTick();
    if (remaining === 0) {
      countdownDone();
      nextWarmup();
    }
  }, [index, remaining, nextWarmup]);

  return (
    <div
      className="flex flex-1 flex-col px-4 pt-2"
      style={{ background: `radial-gradient(120% 55% at 50% 38%, ${ORANGE}1c, transparent 70%)` }}
    >
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-label="Warm-up progress"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
      >
        {steps.map((s, i) => (
          <div key={s.name} className={`h-1.5 flex-1 rounded-full ${i < index ? 'bg-orange-400' : i === index ? 'bg-orange-300' : 'bg-line'}`} />
        ))}
      </div>

      <div key={index} className="animate-rise flex flex-1 flex-col items-center justify-center text-center">
        <span className="flex items-center gap-1.5 rounded-full bg-orange-500/15 px-4 py-1.5 text-xs font-bold tracking-wider text-orange-300 uppercase">
          <Flame className="size-4" aria-hidden="true" /> Warm-up {index + 1} of {steps.length}
        </span>
        <h2 className="mt-4 text-3xl font-black tracking-tight">{step.name}</h2>
        <p className="mt-2 max-w-xs text-lg leading-snug text-zinc-300">{step.cue}</p>
        <div className="my-6" role="timer" aria-label={`${remaining} seconds left`}>
          <ProgressRing value={remaining} max={step.seconds} size={220} stroke={14} color={ORANGE}>
            <span className="num text-7xl font-black">{formatClock(remaining)}</span>
          </ProgressRing>
        </div>
        {steps[index + 1] && (
          <p className="text-sm text-muted">
            Then: <span className="text-zinc-300">{steps[index + 1].name}</span>
          </p>
        )}
      </div>

      <div className="pb-safe grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={skipWarmup}
          className="press min-h-14 rounded-2xl bg-surface font-semibold text-zinc-300 ring-1 ring-line"
        >
          Skip warm-up
        </button>
        <button
          type="button"
          onClick={nextWarmup}
          className="press flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-400 font-bold text-zinc-950"
        >
          <SkipForward className="size-5" aria-hidden="true" /> Next
        </button>
      </div>
    </div>
  );
}
