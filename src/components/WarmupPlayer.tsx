'use client';

import { useEffect, useRef } from 'react';
import { Flame, SkipForward } from 'lucide-react';
import { useStore, type ActiveSession } from '@/lib/store';
import { useNow } from '@/lib/hooks';
import { warmupFor } from '@/lib/workouts';
import { countdownDone, countdownTick } from '@/lib/cues';
import { formatClock } from '@/lib/format';
import { ProgressRing } from './ui';

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
    <div className="flex flex-1 flex-col px-4 pt-2">
      <div className="flex h-1.5 gap-1">
        {steps.map((s, i) => (
          <div key={s.name} className={`flex-1 rounded-full ${i < index ? 'bg-orange-400' : i === index ? 'bg-orange-300' : 'bg-zinc-800'}`} />
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="flex items-center gap-1.5 rounded-full bg-orange-500/15 px-4 py-1.5 text-sm font-bold tracking-wider text-orange-400 uppercase">
          <Flame className="size-4" /> Warm-up {index + 1} of {steps.length}
        </span>
        <h2 className="mt-4 text-3xl font-bold">{step.name}</h2>
        <p className="mt-2 max-w-xs text-lg text-zinc-300">{step.cue}</p>
        <div className="my-8">
          <ProgressRing value={remaining} max={step.seconds} size={220} stroke={14} color="#fb923c">
            <span className="text-7xl font-black tabular-nums">{formatClock(remaining)}</span>
          </ProgressRing>
        </div>
        {steps[index + 1] && (
          <p className="text-sm text-zinc-500">
            Then: <span className="text-zinc-300">{steps[index + 1].name}</span>
          </p>
        )}
      </div>

      <div className="pb-safe grid grid-cols-2 gap-3">
        <button type="button" onClick={skipWarmup} className="rounded-2xl bg-zinc-900 py-4 font-medium text-zinc-400">
          Skip warm-up
        </button>
        <button
          type="button"
          onClick={nextWarmup}
          className="flex items-center justify-center gap-2 rounded-2xl bg-orange-400 py-4 font-bold text-zinc-950"
        >
          <SkipForward className="size-5" /> Next
        </button>
      </div>
    </div>
  );
}
