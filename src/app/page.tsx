'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Dumbbell, Flame, Footprints, Play, RotateCcw } from 'lucide-react';
import { useStore, nextWorkoutType } from '@/lib/store';
import { useHydrated } from '@/lib/hooks';
import { EXERCISES, WORKOUTS } from '@/lib/workouts';
import { sessionsInWeek, startOfWeek, weekStreak } from '@/lib/stats';
import { unlockAudio } from '@/lib/cues';
import { BottomNav, ProgressRing, WorkoutBadge } from '@/components/ui';
import { SessionCard } from '@/components/SessionCard';
import type { WorkoutType } from '@/lib/types';

export default function Dashboard() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { history, settings, active, startSession } = useStore();

  if (!hydrated) return <div className="min-h-dvh" />;

  const next = nextWorkoutType(history);
  const template = WORKOUTS[next];
  const thisWeek = sessionsInWeek(history, startOfWeek(new Date())).length;
  const streak = weekStreak(history, settings.weeklyTarget);

  const begin = (type: WorkoutType) => {
    unlockAudio();
    startSession(type);
    router.push('/workout/active');
  };

  return (
    <main className="px-4 pt-6 pb-28">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Chest &amp; Run</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-400">
          <Flame className="size-4" />
          {streak} wk streak
        </div>
      </header>

      {active && (
        <Link
          href="/workout/active"
          className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4"
        >
          <RotateCcw className="size-6 text-emerald-400" />
          <div className="flex-1">
            <div className="font-semibold text-emerald-300">Resume {WORKOUTS[active.workoutType].name}</div>
            <div className="text-sm text-emerald-400/70">You have a session in progress</div>
          </div>
          <ChevronRight className="size-5 text-emerald-400" />
        </Link>
      )}

      <section className="mb-4 overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">
        <div className="p-5">
          <div className="mb-1 text-xs font-semibold tracking-wider text-emerald-400 uppercase">Up next</div>
          <div className="flex items-center gap-3">
            <WorkoutBadge type={next} />
            <div>
              <h2 className="text-xl font-bold">{template.name}</h2>
              <p className="text-sm text-zinc-400">{template.subtitle}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {template.blocks.map((b) => (
              <li key={b.id} className="flex gap-3 text-sm">
                <span className="w-20 shrink-0 text-zinc-500">
                  {b.name}
                  <span className="block text-xs">{b.rounds > 1 ? `${b.rounds} rounds` : '1 round'}</span>
                </span>
                <span className="text-zinc-200">{b.exercises.map((id) => EXERCISES[id].name).join(' + ')}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-zinc-400">
            <span className="text-zinc-500">Gear:</span> {template.equipment.join(' · ')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">
              <Dumbbell className="size-3.5" /> ~25 min strength
            </span>
            <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">
              <Footprints className="size-3.5" /> 20 min run
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => begin(next)}
          className="flex w-full items-center justify-center gap-2 bg-emerald-500 py-5 text-lg font-bold text-zinc-950 active:bg-emerald-400"
        >
          <Play className="size-6 fill-current" /> Start {template.name}
        </button>
      </section>

      <button
        type="button"
        onClick={() => begin(next === 'A' ? 'B' : 'A')}
        className="mb-6 w-full rounded-2xl border border-zinc-800 py-3 text-sm font-medium text-zinc-400 active:bg-zinc-900"
      >
        Do {WORKOUTS[next === 'A' ? 'B' : 'A'].name} instead
      </button>

      <section className="mb-6 flex items-center gap-5 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
        <ProgressRing value={thisWeek} max={settings.weeklyTarget} size={104} stroke={10}>
          <span className="text-3xl font-black">{thisWeek}</span>
          <span className="text-xs text-zinc-500">of {settings.weeklyTarget}</span>
        </ProgressRing>
        <div>
          <h3 className="font-semibold">This week</h3>
          <p className="text-sm text-zinc-400">
            {thisWeek >= settings.weeklyTarget
              ? 'Weekly target hit. Nice work.'
              : `${settings.weeklyTarget - thisWeek} more session${settings.weeklyTarget - thisWeek === 1 ? '' : 's'} to hit your target.`}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Recent sessions</h3>
          {history.length > 0 && (
            <Link href="/history" className="text-sm text-emerald-400">
              See all
            </Link>
          )}
        </div>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
            No sessions yet. Your first one starts above.
          </p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 3).map((log) => (
              <SessionCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
