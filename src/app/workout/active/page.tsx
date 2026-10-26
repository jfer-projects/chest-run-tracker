'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, FastForward, MoreHorizontal, Timer, Trash2 } from 'lucide-react';
import { useStore, type ActiveSession } from '@/lib/store';
import { useHydrated, useNow, useWakeLock } from '@/lib/hooks';
import { WORKOUTS } from '@/lib/workouts';
import { formatClock } from '@/lib/format';
import { CARDIO_LABEL } from '@/lib/run';
import { StrengthPlayer } from '@/components/StrengthPlayer';
import { RunOffer, RunTimer } from '@/components/RunTimer';
import { SummaryModal } from '@/components/SummaryModal';
import { WarmupPlayer } from '@/components/WarmupPlayer';
import { Sheet, SheetRow, Toggle, WorkoutBadge } from '@/components/ui';

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

type Confirm = 'skip' | 'finish' | 'discard';

const CONFIRM_COPY: Record<Confirm, { title: string; body: string; action: string; danger: boolean }> = {
  skip: {
    title: 'Skip to cardio?',
    body: 'The rest of the strength work will be skipped. Sets you already logged are kept.',
    action: 'Skip to cardio',
    danger: false,
  },
  finish: {
    title: 'Finish workout now?',
    body: 'You will see the summary and can save what you logged.',
    action: 'Finish workout',
    danger: false,
  },
  discard: {
    title: 'Discard this workout?',
    body: 'Nothing from this session will be saved.',
    action: 'Discard',
    danger: true,
  },
};

export default function ActiveWorkoutPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const active = useStore((s) => s.active);
  const settings = useStore((s) => s.settings);
  const { finishRun, skipStrength, discardSession, updateSettings } = useStore();
  const inProgress = !!active && active.phase !== 'summary';
  const now = useNow(inProgress, 1000);
  useWakeLock(inProgress);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  useEffect(() => {
    if (hydrated && !active) router.replace('/');
  }, [hydrated, active, router]);

  if (!hydrated || !active) return <div className="min-h-dvh" />;

  if (active.phase === 'summary') return <SummaryModal session={active} />;

  const template = WORKOUTS[active.workoutType];
  const canSkip = active.phase === 'warmup' || active.phase === 'strength';

  const close = () => {
    setMenuOpen(false);
    setConfirm(null);
  };
  const run = (c: Confirm) => {
    close();
    if (c === 'skip') skipStrength();
    if (c === 'finish') finishRun(active.run.completed);
    if (c === 'discard') {
      discardSession();
      router.replace('/');
    }
  };

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="pt-safe-sm sticky top-0 z-10 bg-page px-4 pb-2">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <WorkoutBadge type={active.workoutType} size="sm" />
            <div className="min-w-0">
              <p className="truncate leading-tight font-bold">{template.name}</p>
              <p className="num text-xs text-muted">
                {phaseLabel(active)} · {formatClock((now - active.startedAt) / 1000)}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Workout menu"
            onClick={() => setMenuOpen(true)}
            className="press flex size-11 items-center justify-center rounded-full bg-surface text-zinc-300 ring-1 ring-line"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </header>

      {active.phase === 'warmup' && <WarmupPlayer session={active} />}
      {active.phase === 'strength' && <StrengthPlayer session={active} />}
      {active.phase === 'run-offer' && <RunOffer session={active} />}
      {active.phase === 'run' && <RunTimer session={active} />}

      <Sheet open={menuOpen} onClose={close} title={confirm ? CONFIRM_COPY[confirm].title : 'Workout options'}>
        {confirm ? (
          <div className="pb-2">
            <p className="mb-4 text-zinc-300">{CONFIRM_COPY[confirm].body}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="press min-h-14 rounded-2xl bg-raised font-semibold text-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => run(confirm)}
                className={`press min-h-14 rounded-2xl font-bold ${
                  CONFIRM_COPY[confirm].danger ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-zinc-950'
                }`}
              >
                {CONFIRM_COPY[confirm].action}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pb-2">
            {active.phase === 'strength' && (
              <SheetRow
                icon={<Timer className="size-5" />}
                label="Tempo beeps"
                hint="3 counts down, 1 up, during each set"
                trailing={
                  <Toggle label="Tempo beeps" checked={settings.tempoEnabled} onChange={(v) => updateSettings({ tempoEnabled: v })} />
                }
              />
            )}
            {canSkip && (
              <SheetRow icon={<FastForward className="size-5" />} label="Skip to cardio" onClick={() => setConfirm('skip')} />
            )}
            <SheetRow
              icon={<Flag className="size-5" />}
              label="Finish workout now"
              hint="Go to the summary and save what you logged"
              onClick={() => setConfirm('finish')}
            />
            <SheetRow icon={<Trash2 className="size-5" />} label="Discard workout" danger onClick={() => setConfirm('discard')} />
          </div>
        )}
      </Sheet>
    </main>
  );
}
