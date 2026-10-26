'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Flame, Medal, Trophy } from 'lucide-react';
import { CARDIO_LABEL } from '@/lib/run';
import { CardioIcon } from './RunTimer';
import { useStore, type ActiveSession } from '@/lib/store';
import { EXERCISES, WORKOUTS } from '@/lib/workouts';
import { chestOnly, findRecords, sessionTotals, sessionsInWeek, startOfWeek, weekStreak } from '@/lib/stats';
import type { WorkoutSessionLog } from '@/lib/types';
import { BADGE_COLORS } from './ui';

export function SummaryModal({ session }: { session: ActiveSession }) {
  const router = useRouter();
  const { saveSession, discardSession, history, settings } = useStore();
  const [notes, setNotes] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const totals = sessionTotals(session);
  const cardio = session.run.mode ?? 'run';
  const duration = Math.round(((session.endedAt ?? Date.now()) - session.startedAt) / 1000);
  const template = WORKOUTS[session.workoutType];

  const records = useMemo(() => findRecords(history, session.sets), [history, session.sets]);

  // Where this session leaves the week, as if it were already saved.
  const week = useMemo(() => {
    const draft: WorkoutSessionLog = {
      id: session.id,
      date: new Date(session.startedAt).toISOString(),
      workoutType: session.workoutType,
      sets: session.sets,
      runCompleted: session.run.completed,
      durationSeconds: duration,
    };
    const all = [draft, ...history];
    return {
      done: sessionsInWeek(chestOnly(all), startOfWeek(new Date())).length,
      streak: weekStreak(all, settings.weeklyTarget),
    };
  }, [session, history, duration, settings.weeklyTarget]);

  const isChest = session.workoutType !== 'L';
  const goalHit = isChest && week.done >= settings.weeklyTarget;

  const stats = [
    { label: 'Sets', value: totals.sets },
    { label: 'Reps', value: totals.reps },
    { label: 'Lb lifted', value: totals.volumeLbs ? totals.volumeLbs.toLocaleString() : '–' },
    { label: 'Minutes', value: String(Math.max(1, Math.round(duration / 60))) },
  ];

  const save = () => {
    saveSession(notes);
    router.replace('/');
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="animate-rise flex-1 space-y-4 px-4 pt-safe-lg pb-4">
        <div className="text-center">
          <div className="animate-pop mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-amber-400/15 ring-1 ring-amber-400/30">
            <Trophy className="size-10 text-amber-300" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{records.length ? 'New personal best!' : 'Session complete'}</h1>
          <p className="mt-1 flex items-center justify-center gap-2 text-zinc-300">
            <span className={`rounded-md px-1.5 py-0.5 text-xs font-black ${BADGE_COLORS[session.workoutType]}`}>{session.workoutType}</span>
            {template.name} · {template.subtitle}
          </p>
        </div>

        {isChest && (
          <section
            className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ${
              goalHit ? 'bg-emerald-500/10 ring-emerald-500/40' : 'bg-surface ring-line'
            }`}
          >
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                goalHit ? 'bg-emerald-500 text-zinc-950' : 'bg-raised text-zinc-300'
              }`}
            >
              {goalHit ? <Check className="size-6" strokeWidth={3} aria-hidden="true" /> : <span className="num font-black">{week.done}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {goalHit ? 'Weekly goal hit' : `${week.done} of ${settings.weeklyTarget} this week`}
              </p>
              <p className="text-sm text-zinc-300">
                {goalHit
                  ? `${week.streak} ${week.streak === 1 ? 'week' : 'weeks'} in a row`
                  : `${settings.weeklyTarget - week.done} more to hit your target`}
              </p>
            </div>
            {goalHit && <Flame className="size-6 shrink-0 text-amber-300" aria-hidden="true" />}
          </section>
        )}

        {records.length > 0 && (
          <section aria-label="Personal records" className="space-y-2">
            {records.map((r) => {
              const ex = EXERCISES[r.id];
              const unit = r.kind === 'weight' ? ' lb' : r.kind === 'hold' ? 's' : ' reps';
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-amber-400/10 p-3 ring-1 ring-amber-400/30">
                  <Medal className="size-6 shrink-0 text-amber-300" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{ex.name}</p>
                    <p className="num text-sm text-amber-100/80">
                      {r.kind === 'weight' ? 'Heaviest yet' : r.kind === 'hold' ? 'Longest hold' : 'Most reps'}: {r.now}
                      {unit} <span className="text-muted">(was {r.before})</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        <dl className="grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-surface p-2.5 text-center ring-1 ring-line">
              <dd className="num text-lg leading-tight font-black whitespace-nowrap">{s.value}</dd>
              <dt className="text-[10px] font-semibold tracking-wider text-muted uppercase">{s.label}</dt>
            </div>
          ))}
        </dl>

        <p
          className={`flex items-center gap-2.5 rounded-2xl p-3 text-sm font-medium ${
            session.run.completed ? 'bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/30' : 'bg-surface text-muted ring-1 ring-line'
          }`}
        >
          <CardioIcon mode={cardio} className="size-5 shrink-0" />
          {!session.run.started
            ? 'Cardio skipped'
            : session.run.completed
              ? `20-minute ${CARDIO_LABEL[cardio].noun} completed`
              : `${CARDIO_LABEL[cardio].title} not completed`}
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-zinc-200" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="How did it feel? Anything to change next time?"
            className="w-full rounded-2xl bg-surface p-3 text-zinc-100 ring-1 ring-line outline-none placeholder:text-muted focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="pb-safe sticky bottom-0 border-t border-line bg-page px-4 pt-3">
        {confirmDiscard ? (
          <div className="animate-fade grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setConfirmDiscard(false)} className="press min-h-14 rounded-2xl bg-raised font-semibold">
              Keep it
            </button>
            <button
              type="button"
              onClick={() => {
                discardSession();
                router.replace('/');
              }}
              className="press min-h-14 rounded-2xl bg-rose-500 font-bold text-white"
            >
              Discard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button
              type="button"
              onClick={() => setConfirmDiscard(true)}
              className="press min-h-14 rounded-2xl px-5 font-semibold text-muted"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              className="press min-h-14 rounded-2xl bg-emerald-500 text-lg font-bold text-zinc-950"
            >
              Save to history
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
