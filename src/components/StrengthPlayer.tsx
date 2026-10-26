'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Check, ChevronLeft, History, Lightbulb, Plus, SkipForward, Timer, TrendingUp, Wrench } from 'lucide-react';
import { useStore, type ActiveSession } from '@/lib/store';
import { useNow } from '@/lib/hooks';
import { EXERCISES, WORKOUTS, buildSteps, defaultReps, resolveExercise } from '@/lib/workouts';
import { countdownDone, countdownTick, tempoTick } from '@/lib/cues';
import { formatClock, formatDate } from '@/lib/format';
import { formatSets, lastSetsFor, progressionAdvice, suggestReps } from '@/lib/stats';
import type { Effort, ExerciseDefinition, ExerciseId } from '@/lib/types';
import { ProgressRing, Stepper } from './ui';

const EFFORTS: { id: Effort; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'solid', label: 'Solid' },
  { id: 'max', label: 'Max' },
];

export function StrengthPlayer({ session }: { session: ActiveSession }) {
  const { completeSet, previousStep, lastWeights, lastReps, skipStrength, history, settings, setSwap, updateSettings } = useStore();
  const steps = buildSteps(session.workoutType, session.deload);
  const step = steps[session.stepIndex];
  const exercise = resolveExercise(step.exerciseId, settings.swaps);
  const existing = session.sets[exercise.id]?.[step.round - 1];
  const last = lastSetsFor(history, exercise.id);
  const advice = progressionAdvice(exercise, last?.sets);
  const swapOptions: ExerciseId[] = [step.exerciseId, ...(EXERCISES[step.exerciseId].swaps ?? [])];

  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [effort, setEffort] = useState<Effort>('solid');
  const [showSwap, setShowSwap] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const today = session.sets[exercise.id];
  const target = suggestReps(exercise, step.round, last?.sets, today, exercise.weighted ? weight : undefined);

  // Reset inputs whenever the step or exercise changes: prefer what was logged, then today's target, then the last value used.
  useEffect(() => {
    const startWeight = existing?.weightLbs ?? lastWeights[exercise.id] ?? 15;
    setWeight(startWeight);
    setReps(
      existing?.completedReps ??
        suggestReps(exercise, step.round, last?.sets, today, exercise.weighted ? startWeight : undefined) ??
        lastReps[exercise.id] ??
        defaultReps(exercise),
    );
    setEffort(existing?.effort ?? 'solid');
    setShowSwap(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.stepIndex, exercise.id]);

  useTempo(settings.tempoEnabled && !session.restEndsAt);

  const nextStep = steps[session.stepIndex + 1];
  const block = WORKOUTS[session.workoutType].blocks[step.blockIndex];
  const adviceStyle =
    advice?.tone === 'progress'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      : 'border-zinc-800 bg-zinc-900/60 text-zinc-300';

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="px-4 pt-2">
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>
            {block.name} · Round {step.round} of {step.rounds}
            {session.deload && <span className="ml-2 rounded bg-sky-500/15 px-1.5 py-0.5 font-semibold text-sky-400">Deload</span>}
          </span>
          <span>
            Set {session.stepIndex + 1}/{steps.length}
          </span>
        </div>
        <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i < session.stepIndex ? 'bg-emerald-500' : i === session.stepIndex ? 'bg-emerald-300' : 'bg-zinc-800'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 pt-5 pb-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
              <Wrench className="size-3" /> {exercise.equipment}
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              Set {step.round} of {step.rounds}
            </span>
            {swapOptions.length > 1 && (
              <button
                type="button"
                onClick={() => setShowSwap((s) => !s)}
                className="ml-auto flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300"
              >
                <ArrowLeftRight className="size-3" /> Swap
              </button>
            )}
          </div>
          {showSwap && (
            <div className="mb-3 space-y-1.5 rounded-2xl border border-zinc-800 bg-zinc-900 p-2">
              {swapOptions.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSwap(step.exerciseId, id === step.exerciseId ? null : id);
                    setShowSwap(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm ${
                    id === exercise.id ? 'bg-emerald-500/15 font-semibold text-emerald-300' : 'text-zinc-300'
                  }`}
                >
                  {EXERCISES[id].name}
                  {id === step.exerciseId && <span className="ml-1 text-xs text-zinc-500">(programmed)</span>}
                </button>
              ))}
              <p className="px-3 pb-1 text-xs text-zinc-500">Your choice sticks for future workouts until you swap back.</p>
            </div>
          )}
          <h2 className="text-2xl leading-tight font-bold">{exercise.name}</h2>
          <p className="mt-0.5 text-sm font-medium text-emerald-400">{exercise.targetMuscle}</p>
          {target !== null ? (
            <p className="mt-1 text-lg text-zinc-300">
              Today&apos;s target: <span className="font-semibold text-white">{target} reps</span>
              <span className="ml-2 text-sm text-zinc-500">range {exercise.targetReps}</span>
            </p>
          ) : (
            <p className="mt-1 text-lg text-zinc-300">
              Target: <span className="font-semibold text-white">{exercise.targetReps}</span>
              {exercise.unit === 'reps' && exercise.targetReps !== 'To failure' ? ' reps' : ''}
            </p>
          )}
          {exercise.setup && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-sm font-medium text-amber-300">
              <Wrench className="size-4" /> Setup: {exercise.setup}
            </p>
          )}
        </div>

        {last && (
          <div className={`space-y-1.5 rounded-2xl border p-3 text-sm ${adviceStyle}`}>
            <p className="flex items-center gap-1.5 text-zinc-400">
              <History className="size-4" /> Last time ({formatDate(last.date)}):{' '}
              <span className="font-semibold text-zinc-100">{formatSets(exercise, last.sets)}</span>
            </p>
            {advice && (
              <p className="flex gap-1.5">
                <TrendingUp className="mt-0.5 size-4 shrink-0" /> {advice.text}
              </p>
            )}
            <button type="button" onClick={() => setShowMore((s) => !s)} className="text-xs text-zinc-500 underline">
              {showMore ? 'Hide' : 'More ways to progress'}
            </button>
            {showMore && (
              <ol className="list-decimal space-y-0.5 pl-5 text-xs text-zinc-400">
                {exercise.progressions.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            )}
          </div>
        )}

        <ExerciseDemo key={exercise.id} exercise={exercise} paused={!!session.restEndsAt} />

        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <ul className="space-y-2">
            {exercise.formCues.map((cue) => (
              <li key={cue} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                {cue}
              </li>
            ))}
          </ul>
          <p className="flex gap-2 rounded-xl bg-zinc-950/80 p-3 text-xs leading-normal text-zinc-400">
            <Lightbulb className="size-4 shrink-0 text-emerald-400" />
            {exercise.anatomicalTip}
          </p>
          {exercise.unit === 'reps' && (
            <button
              type="button"
              onClick={() => updateSettings({ tempoEnabled: !settings.tempoEnabled })}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium ${
                settings.tempoEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Timer className="size-4" />
              {settings.tempoEnabled ? 'Tempo beeps on: 3 down, 1 up' : 'Tempo beeps off'}
            </button>
          )}
        </div>

        <div className={`grid gap-3 ${exercise.weighted ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Stepper
            label={exercise.unit === 'seconds' ? 'Hold time' : 'Reps'}
            value={reps}
            onChange={setReps}
            step={exercise.unit === 'seconds' ? 5 : 1}
            unit={exercise.unit === 'seconds' ? 's' : undefined}
          />
          {exercise.weighted && <Stepper label="Weight" value={weight} onChange={setWeight} step={2.5} unit="lb" />}
        </div>

        <div>
          <div className="mb-1.5 text-center text-xs font-semibold tracking-wider text-zinc-500 uppercase">How did it feel?</div>
          <div className="grid grid-cols-3 gap-2">
            {EFFORTS.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEffort(e.id)}
                className={`rounded-xl py-3 text-sm font-semibold ${
                  effort === e.id ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {nextStep && (
          <p className="text-center text-sm text-zinc-500">
            Next: <span className="text-zinc-300">{resolveExercise(nextStep.exerciseId, settings.swaps).name}</span>
          </p>
        )}
      </div>

      <div className="pb-safe sticky bottom-0 space-y-2 border-t border-zinc-900 bg-zinc-950 px-4 pt-3">
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous set"
            disabled={session.stepIndex === 0}
            onClick={previousStep}
            className="flex w-16 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-300 disabled:opacity-30"
          >
            <ChevronLeft className="size-7" />
          </button>
          <button
            type="button"
            onClick={() => completeSet(reps, exercise.weighted ? weight : undefined, effort)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-5 text-xl font-bold text-zinc-950 active:scale-[0.98] active:bg-emerald-400"
          >
            <Check className="size-7" strokeWidth={3} />
            {nextStep ? 'Complete Set' : 'Finish Strength'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm('Skip the rest of the strength work and go to cardio?')) skipStrength();
          }}
          className="w-full py-1 text-xs text-zinc-600"
        >
          Skip to cardio
        </button>
      </div>

      {session.restEndsAt && (
        <RestOverlay endsAt={session.restEndsAt} nextName={exercise.name} transition={session.restKind === 'transition'} />
      )}
    </div>
  );
}

/** 3-1 tempo: three soft beeps while lowering, a higher beep to press up. */
function useTempo(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let count = 0;
    const id = window.setInterval(() => {
      count = (count % 4) + 1;
      tempoTick(count === 4);
    }, 1000);
    return () => window.clearInterval(id);
  }, [enabled]);
}

type DemoSource = 'video' | 'photos' | 'frames';

/** Shows the best available demo: video loop, then photo pair, then the bundled drawings. */
function ExerciseDemo({ exercise, paused }: { exercise: ExerciseDefinition; paused: boolean }) {
  const { media } = exercise;
  const sources: DemoSource[] = [
    ...(media.video ? (['video'] as const) : []),
    ...(media.photos ? (['photos'] as const) : []),
    'frames',
  ];
  const [index, setIndex] = useState(0);
  const source = sources[Math.min(index, sources.length - 1)];
  const fallBack = () => setIndex((i) => i + 1);
  // Credit belongs to the sourced media, not to the drawings.
  const credit = source !== 'frames' ? media.credit : undefined;

  return (
    <div>
      {source === 'video' && <DemoVideo src={media.video!} badge={media.badge} paused={paused} onFail={fallBack} />}
      {source === 'photos' && (
        <DemoFrames frames={media.photos!} badge={media.badge} paused={paused} onFail={fallBack} dark />
      )}
      {source === 'frames' && <DemoFrames frames={media.frames} badge={media.badge} paused={paused} />}
      {credit && (
        <p className="mt-1 text-right text-[11px] text-zinc-600">
          {credit.url ? (
            <a href={credit.url} target="_blank" rel="noreferrer" className="underline">
              {credit.text}
            </a>
          ) : (
            credit.text
          )}
        </p>
      )}
    </div>
  );
}

function DemoVideo({ src, badge, paused, onFail }: { src: string; badge: string; paused: boolean; onFail: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (paused) v.pause();
    else void v.play().catch(() => {});
  }, [paused]);

  return (
    <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-black">
      <video
        ref={ref}
        src={src}
        autoPlay={!paused}
        muted
        loop
        playsInline
        preload="auto"
        onError={onFail}
        className="h-full w-full object-contain"
      />
      <span className="absolute top-2 right-2 rounded-full bg-zinc-900/90 px-3 py-1 text-xs font-semibold text-emerald-400">
        {badge}
      </span>
    </div>
  );
}

/** Alternates start/end position stills as a lightweight demo animation. */
function DemoFrames({
  frames,
  badge,
  paused,
  onFail,
  dark = false,
}: {
  frames: [string] | [string, string];
  badge: string;
  paused: boolean;
  onFail?: () => void;
  dark?: boolean;
}) {
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);
  const animated = frames.length > 1;
  useEffect(() => {
    if (paused || !animated) return;
    const id = window.setInterval(() => setFrame((f) => 1 - f), 1250);
    return () => window.clearInterval(id);
  }, [paused, animated]);

  // If a frame fails to load, hand off to the next source, or drop the demo rather than show a broken box.
  if (failed) return null;
  return (
    <div
      className={`relative flex h-52 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 ${dark ? 'bg-zinc-950' : 'bg-white'}`}
    >
      {frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === 0 ? 'Start position' : 'End position'}
          onError={() => (onFail ? onFail() : setFailed(true))}
          className={`absolute h-full w-full object-contain transition-opacity duration-300 ${frame === i ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <span className="absolute top-2 right-2 rounded-full bg-zinc-900/90 px-3 py-1 text-xs font-semibold text-emerald-400">
        {badge}
      </span>
      {animated && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-zinc-900/80 px-2 py-1">
          {[0, 1].map((i) => (
            <span key={i} className={`h-1.5 w-3.5 rounded-full ${frame === i ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function RestOverlay({ endsAt, nextName, transition }: { endsAt: number; nextName: string; transition: boolean }) {
  const { addRest, endRest } = useStore();
  const now = useNow(true, 100);
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const announced = useRef<number | null>(null);
  // Ring total starts at the first value seen and grows when +15s is tapped.
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

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="pb-safe w-full max-w-md rounded-t-3xl border-t border-zinc-800 bg-zinc-900 px-5 pt-6">
        <div className={`text-center text-sm font-semibold tracking-wider uppercase ${transition ? 'text-emerald-400' : 'text-sky-400'}`}>
          {transition ? 'Switch: superset partner next' : 'Rest'}
        </div>
        <div className="my-4 flex justify-center">
          <ProgressRing value={remaining} max={total.current} size={220} stroke={14} color={remaining <= 3 ? '#f59e0b' : transition ? '#10b981' : '#38bdf8'}>
            <span className={`text-7xl font-black tabular-nums ${remaining <= 3 ? 'text-amber-400' : 'text-white'}`}>
              {formatClock(remaining)}
            </span>
          </ProgressRing>
        </div>
        <p className="mb-5 text-center text-zinc-400">
          Up next: <span className="font-semibold text-zinc-100">{nextName}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => addRest(15)}
            className="flex items-center justify-center gap-1 rounded-2xl bg-zinc-800 py-5 text-lg font-bold active:bg-zinc-700"
          >
            <Plus className="size-5" /> 15s
          </button>
          <button
            type="button"
            onClick={endRest}
            className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 py-5 text-lg font-bold text-zinc-950 active:bg-sky-400"
          >
            <SkipForward className="size-5" /> Skip
          </button>
        </div>
      </div>
    </div>
  );
}
