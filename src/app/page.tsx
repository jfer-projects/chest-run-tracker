'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BatteryLow,
  ChevronDown,
  ChevronRight,
  Cloud,
  CloudOff,
  Dumbbell,
  Flame,
  Footprints,
  Play,
  Repeat,
  RotateCcw,
} from 'lucide-react';
import { useSyncStatus } from '@/lib/sync';
import { CardioIcon } from '@/components/RunTimer';
import { useStore, nextWorkoutType, deloadDue, isDeloading, type ActiveSession } from '@/lib/store';
import { useHydrated } from '@/lib/hooks';
import { WORKOUTS, buildSteps, estimateMinutes, resolveExercise } from '@/lib/workouts';
import { chestOnly, sessionsInWeek, startOfWeek, weekStreak } from '@/lib/stats';
import { formatDate, relativeDay } from '@/lib/format';
import { unlockAudio } from '@/lib/cues';
import { BADGE_COLORS, BottomNav, WorkoutBadge } from '@/components/ui';
import { SessionCard } from '@/components/SessionCard';
import type { WorkoutSessionLog, WorkoutType } from '@/lib/types';

/** "yesterday", "Tuesday", "Oct 12": reads naturally after "last done". */
function lastDone(iso: string): string {
  const rel = relativeDay(iso);
  return rel === 'Today' || rel === 'Yesterday' ? rel.toLowerCase() : rel;
}

const HERO_TINT: Record<WorkoutType, string> = {
  A: 'rgba(16,185,129,0.16)',
  B: 'rgba(245,158,11,0.16)',
  L: 'rgba(139,92,246,0.18)',
};

export default function Dashboard() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { history, settings, active, startSession, startDeload, endDeload } = useStore();
  const sync = useSyncStatus((s) => s.state);
  const [showPlan, setShowPlan] = useState(false);
  const [override, setOverride] = useState<WorkoutType | null>(null);

  if (!hydrated) return <div className="min-h-dvh" />;

  const suggested = nextWorkoutType(history);
  const next: WorkoutType = override ?? suggested;
  const alt: WorkoutType = next === 'A' ? 'B' : 'A';
  const template = WORKOUTS[next];
  const streak = weekStreak(history, settings.weeklyTarget);
  const deloading = isDeloading(settings);
  const lastLegDay = history.find((h) => h.workoutType === 'L');
  const minutes = estimateMinutes(next, {
    deload: deloading,
    warmup: settings.warmupEnabled,
    transitionSeconds: settings.transitionSeconds,
    swaps: settings.swaps,
  });
  const setCount = buildSteps(next, deloading).length;

  const begin = (type: WorkoutType) => {
    unlockAudio();
    startSession(type);
    router.push('/workout/active');
  };

  return (
    <main className="animate-rise space-y-4 px-4 pt-safe pb-28">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-black tracking-tight">Chest &amp; Run</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-amber-500/12 px-3.5 text-sm font-bold text-amber-300"
            aria-label={`Weekly streak: ${streak} ${streak === 1 ? 'week' : 'weeks'}`}
          >
            <Flame className="size-4" aria-hidden="true" />
            <span className="num">{streak}</span> wk
          </span>
          <Link
            href="/settings"
            aria-label={sync === 'signed-out' ? 'Cloud backup is off. Open settings to sign in.' : 'Cloud backup is on'}
            className="press relative flex size-11 items-center justify-center rounded-full bg-surface ring-1 ring-line"
          >
            {sync === 'signed-out' ? (
              <>
                <CloudOff className="size-5 text-zinc-300" aria-hidden="true" />
                <span className="absolute top-2 right-2 size-2.5 rounded-full bg-amber-400 ring-2 ring-page" aria-hidden="true" />
              </>
            ) : (
              <Cloud className="size-5 text-emerald-400" aria-hidden="true" />
            )}
          </Link>
        </div>
      </header>

      {active ? (
        <ResumeCard active={active} />
      ) : (
        <section
          className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line"
          style={{ backgroundImage: `linear-gradient(155deg, ${HERO_TINT[next]}, transparent 60%)` }}
        >
          <div className="p-4 pb-3">
            <div className="flex items-start gap-3">
              <WorkoutBadge type={next} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
                  {override && override !== suggested ? 'Your pick' : 'Up next'}
                </p>
                <h2 className="text-2xl leading-tight font-black tracking-tight">{template.name}</h2>
                <p className="text-sm text-zinc-300">{template.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOverride(alt)}
                className="press flex min-h-11 items-center gap-1.5 rounded-xl bg-black/30 px-3 text-xs font-semibold text-zinc-200"
                aria-label={`Switch to Workout ${alt}`}
              >
                <Repeat className="size-3.5" aria-hidden="true" /> {alt}
              </button>
            </div>

            <ul className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-zinc-200">
              <li className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5">
                <Dumbbell className="size-3.5" aria-hidden="true" /> ~{minutes} min{deloading ? ' (deload)' : ''}
              </li>
              <li className="num rounded-full bg-black/30 px-3 py-1.5">{setCount} sets</li>
              <li className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5">
                <CardioIcon mode={settings.defaultCardio} className="size-3.5" /> + 20 min cardio
              </li>
            </ul>
          </div>

          <div className="px-4 pb-2">
            <button
              type="button"
              onClick={() => begin(next)}
              className="press flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-lg font-bold text-zinc-950"
            >
              <Play className="size-5 fill-current" aria-hidden="true" /> Start {template.name}
            </button>
            <button
              type="button"
              onClick={() => setShowPlan((s) => !s)}
              aria-expanded={showPlan}
              className="press flex min-h-11 w-full items-center justify-center gap-1.5 text-sm font-medium text-zinc-300"
            >
              {showPlan ? 'Hide the plan' : "See what's inside"}
              <ChevronDown className={`size-4 transition-transform ${showPlan ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>

          {showPlan && (
            <div className="animate-fade border-t border-line/70 bg-black/20 p-4">
              <ul className="space-y-2.5">
                {template.blocks.map((b) => (
                  <li key={b.id} className="flex gap-3 text-sm">
                    <span className="w-[4.5rem] shrink-0 text-muted">
                      {b.name}
                      <span className="block text-xs">{b.rounds > 1 ? `${b.rounds} rounds` : '1 round'}</span>
                    </span>
                    <span className="text-zinc-200">{b.exercises.map((id) => resolveExercise(id, settings.swaps).name).join(' + ')}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">
                <span className="font-semibold text-zinc-300">Gear:</span> {template.equipment.join(' · ')}
              </p>
            </div>
          )}
        </section>
      )}

      {deloading ? (
        <div className="flex items-center gap-3 rounded-2xl bg-sky-500/10 px-4 py-3 text-sm ring-1 ring-sky-500/30">
          <BatteryLow className="size-5 shrink-0 text-sky-300" aria-hidden="true" />
          <span className="flex-1 text-sky-100">
            Deload week: half the sets until {formatDate(new Date(settings.deloadUntil!).toISOString())}.
          </span>
          <button type="button" onClick={endDeload} className="press min-h-11 px-2 text-xs font-semibold text-sky-300 underline">
            End early
          </button>
        </div>
      ) : (
        deloadDue(settings, history) && (
          <div className="flex items-center gap-3 rounded-2xl bg-sky-500/10 py-2 pr-2 pl-4 text-sm ring-1 ring-sky-500/30">
            <BatteryLow className="size-5 shrink-0 text-sky-300" aria-hidden="true" />
            <p className="flex-1 leading-snug text-sky-100">
              <span className="font-bold">Deload week due.</span> Half the sets lets your joints catch up.
            </p>
            <button type="button" onClick={startDeload} className="press min-h-11 shrink-0 rounded-xl bg-sky-400 px-3.5 font-bold text-zinc-950">
              Start
            </button>
          </div>
        )
      )}

      <WeekStrip history={history} target={settings.weeklyTarget} />

      <section className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-line">
        <WorkoutBadge type="L" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Leg Day</p>
          <p className="text-sm text-muted">
            Optional · {lastLegDay ? `last done ${lastDone(lastLegDay.date)}` : 'not done yet'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => begin('L')}
          className="press flex min-h-11 items-center gap-1.5 rounded-xl bg-violet-400 px-4 font-bold text-zinc-950"
        >
          <Footprints className="size-4" aria-hidden="true" /> Start
        </button>
      </section>

      {history.length === 0 ? (
        <section className="rounded-3xl bg-surface p-4 ring-1 ring-line">
          <h3 className="font-bold">How it works</h3>
          <ol className="mt-2 space-y-1.5 text-sm text-zinc-300">
            <li>1. Alternate Workout A and B, about three times a week.</li>
            <li>2. Each starts with a quick warm-up, then pairs of exercises with a short switch between them.</li>
            <li>3. Finish with 20 minutes of cardio: a run or a Peloton ride.</li>
            <li>4. Log your reps and the app adjusts your targets as you get stronger.</li>
          </ol>
        </section>
      ) : (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">Recent sessions</h3>
            <Link href="/history" className="press flex min-h-11 items-center gap-0.5 px-1 text-sm font-semibold text-emerald-400">
              See all <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="space-y-2">
            {history.slice(0, 3).map((log) => (
              <SessionCard key={log.id} log={log} />
            ))}
          </div>
        </section>
      )}

      <BottomNav />
    </main>
  );
}

function ResumeCard({ active }: { active: ActiveSession }) {
  const steps = buildSteps(active.workoutType, active.deload);
  const where =
    active.phase === 'warmup'
      ? 'In the warm-up'
      : active.phase === 'strength'
        ? `Set ${active.stepIndex + 1} of ${steps.length}`
        : active.phase === 'summary'
          ? 'Ready to save'
          : 'In cardio';
  return (
    <Link
      href="/workout/active"
      className="press block rounded-3xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/40"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20">
          <RotateCcw className="size-6 text-emerald-300" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">In progress</p>
          <p className="text-xl font-black">{WORKOUTS[active.workoutType].name}</p>
          <p className="text-sm text-emerald-100/80">{where}</p>
        </div>
      </div>
      <span className="mt-3 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-lg font-bold text-zinc-950">
        <Play className="size-5 fill-current" aria-hidden="true" /> Resume workout
      </span>
    </Link>
  );
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Monday to Sunday, with the workout letter on each day you trained. Leg Day shows but doesn't count toward the goal. */
function WeekStrip({ history, target }: { history: WorkoutSessionLog[]; target: number }) {
  const weekStart = startOfWeek(new Date());
  const today = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const sessions = history.filter((h) => sameDay(new Date(h.date), d));
    const chest = sessions.find((s) => s.workoutType !== 'L');
    return { date: d, chest, legs: sessions.find((s) => s.workoutType === 'L'), isToday: sameDay(d, today), isFuture: d > today && !sameDay(d, today) };
  });
  const done = sessionsInWeek(chestOnly(history), weekStart).length;
  const remaining = Math.max(0, target - done);
  const daysLeft = days.filter((d) => d.isToday || d.isFuture).length;

  return (
    <section className="rounded-3xl bg-surface p-4 ring-1 ring-line" aria-label="This week">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-bold">This week</h3>
        <p className="num text-sm text-muted">
          <span className="font-bold text-zinc-100">{done}</span> of {target} chest sessions
        </p>
      </div>
      <ol className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const type = d.chest?.workoutType ?? (d.legs ? 'L' : null);
          const label = type ? `${DAY_NAMES[i]}: ${WORKOUTS[type].name} done` : `${DAY_NAMES[i]}${d.isToday ? ' (today)' : ''}`;
          return (
            <li key={i} className="flex flex-col items-center gap-1.5" aria-label={label}>
              <span className={`text-[11px] font-semibold ${d.isToday ? 'text-zinc-100' : 'text-muted'}`}>{DAY_LETTERS[i]}</span>
              <span
                aria-hidden="true"
                className={`flex size-10 items-center justify-center rounded-full text-sm font-black ${
                  type
                    ? BADGE_COLORS[type]
                    : d.isToday
                      ? 'bg-emerald-500/10 text-emerald-300 ring-2 ring-emerald-500/60'
                      : d.isFuture
                        ? 'bg-raised/50'
                        : 'bg-raised'
                }`}
              >
                {type ?? (d.isToday ? '·' : '')}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-zinc-300">
        {remaining === 0
          ? 'Weekly target hit. Nice work.'
          : remaining > daysLeft
            ? `${remaining} to go, but only ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left. Do what you can.`
            : `${remaining} more ${remaining === 1 ? 'session' : 'sessions'} to hit your target.`}
      </p>
    </section>
  );
}
