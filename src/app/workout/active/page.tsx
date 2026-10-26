'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useHydrated, useNow, useWakeLock } from '@/lib/hooks';
import { WORKOUTS } from '@/lib/workouts';
import { formatClock } from '@/lib/format';
import { CARDIO_LABEL } from '@/lib/run';
import { StrengthPlayer } from '@/components/StrengthPlayer';
import { RunOffer, RunTimer } from '@/components/RunTimer';
import { SummaryModal } from '@/components/SummaryModal';
import { WarmupPlayer } from '@/components/WarmupPlayer';
import type { ActiveSession } from '@/lib/store';

function phaseLabel(active: ActiveSession): string {
  switch (active.phase) {
    case 'warmup':
      return 'Warm-up';
    case 'run':
      return CARDIO_LABEL[active.run.mode ?? 'run'].title;
    case 'run-offer':
      return 'Cardio';
    default:
      return 'Strength';
  }
}

export default function ActiveWorkoutPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const active = useStore((s) => s.active);
  const finishRun = useStore((s) => s.finishRun);
  const inProgress = !!active && active.phase !== 'summary';
  const now = useNow(inProgress, 1000);
  useWakeLock(inProgress);

  useEffect(() => {
    if (hydrated && !active) router.replace('/');
  }, [hydrated, active, router]);

  if (!hydrated || !active) return <div className="min-h-dvh" />;

  if (active.phase === 'summary') return <SummaryModal session={active} />;

  const template = WORKOUTS[active.workoutType];

  return (
    <main>
      <header className="sticky top-0 z-10 flex items-center justify-between bg-zinc-950/95 px-4 pt-safe-sm pb-2 backdrop-blur">
        <div>
          <div className="text-sm font-semibold">
            {template.name} <span className="font-normal text-zinc-500">· {phaseLabel(active)}</span>
          </div>
          <div className="text-xs text-zinc-500 tabular-nums">{formatClock((now - active.startedAt) / 1000)} elapsed</div>
        </div>
        <button
          type="button"
          aria-label="End workout"
          onClick={() => {
            if (confirm('End this workout now? You can still save what you logged.')) finishRun(active.run.completed);
          }}
          className="flex size-11 items-center justify-center rounded-full bg-zinc-900 text-zinc-400"
        >
          <X className="size-6" />
        </button>
      </header>
      {active.phase === 'warmup' && <WarmupPlayer session={active} />}
      {active.phase === 'strength' && <StrengthPlayer session={active} />}
      {active.phase === 'run-offer' && <RunOffer session={active} />}
      {active.phase === 'run' && <RunTimer session={active} />}
    </main>
  );
}
