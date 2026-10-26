'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BatteryLow, ChevronRight, CloudOff, Dumbbell, Flame, Footprints, Play, RotateCcw } from 'lucide-react';
import { useSyncStatus } from '@/lib/sync';
import { CardioIcon } from '@/components/RunTimer';
import { useStore, nextWorkoutType, deloadDue, isDeloading } from '@/lib/store';
import { useHydrated } from '@/lib/hooks';
import { WORKOUTS, resolveExercise } from '@/lib/workouts';
import { chestOnly, sessionsInWeek, startOfWeek, weekStreak } from '@/lib/stats';
import { formatDate } from '@/lib/format';
import { CoachNotes } from '@/components/CoachNotes';
import { unlockAudio } from '@/lib/cues';
import { BottomNav, ProgressRing, WorkoutBadge } from '@/components/ui';
import { SessionCard } from '@/components/SessionCard';
import type { WorkoutType } from '@/lib/types';

export default function Dashboard() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { history, settings, active, startSession, startDeload, endDeload } = useStore();
  const sync = useSyncStatus((s) => s.state);

  if (!hydrated) return <div className="min-h-dvh" />;

  const next = nextWorkoutType(history);
  const template = WORKOUTS[next];
  const thisWeek = sessionsInWeek(chestOnly(history), startOfWeek(new Date())).length;
  const lastLegDay = history.find((h) => h.workoutType === 'L');
  const deloading = isDeloading(settings);
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

      {sync === 'signed-out' && (
        <Link
          href="/settings"
          className="mb-4 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm"
        >
          <CloudOff className="size-5 shrink-0 text-amber-400" />
          <span className="flex-1 text-zinc-300">Back up your history &amp; streak: sign in</span>
          <ChevronRight className="size-4 text-zinc-500" />
        </Link>
      )}

      {deloading ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm">
          <BatteryLow className="size-5 shrink-0 text-sky-400" />
          <span className="flex-1 text-sky-200">
            Deload week: half the sets, same weights, until {formatDate(new Date(settings.deloadUntil!).toISOString())}.
          </span>
          <button type="button" onClick={endDeload} className="text-xs text-sky-400 underline">
            End early
          </button>
        </div>
      ) : (
        deloadDue(settings, history) && (
          <div className="mb-4 rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm">
            <p className="font-semibold text-sky-200">Time for a deload week</p>
            <p className="mt-1 text-sky-300/80">
              {settings.deloadEveryWeeks}+ weeks of hard training. An easy week (half the sets) lets your joints catch up.
            </p>
            <button type="button" onClick={startDeload} className="mt-3 rounded-xl bg-sky-500 px-4 py-2 font-bold text-zinc-950">
              Start deload week
            </button>
          </div>
        )
      )}

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
                <span className="text-zinc-200">{b.exercises.map((id) => resolveExercise(id, settings.swaps).name).join(' + ')}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-zinc-400">
            <span className="text-zinc-500">Gear:</span> {template.equipment.join(' · ')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">
              <Dumbbell className="size-3.5" /> ~25 min strength{deloading ? ' (deload: ~13)' : ''}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">
              <CardioIcon mode={settings.defaultCardio} className="size-3.5" /> 20 min run or ride
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

      <section className="mb-6 flex items-center gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
        <WorkoutBadge type="L" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Leg Day</h3>
          <p className="truncate text-sm text-zinc-400">
            Separate &amp; optional · {lastLegDay ? `last ${formatDate(lastLegDay.date)}` : 'not done yet'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => begin('L')}
          className="flex items-center gap-1.5 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-bold text-zinc-950"
        >
          <Footprints className="size-4" /> Start
        </button>
      </section>

      <CoachNotes />

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
