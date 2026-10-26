'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Check, ChevronDown, ChevronLeft, Lightbulb, TrendingUp, Wrench } from 'lucide-react';
import { useStore, type ActiveSession } from '@/lib/store';
import { EXERCISES, WORKOUTS, buildSteps, defaultReps, resolveExercise } from '@/lib/workouts';
import { confirmTap, tempoTick } from '@/lib/cues';
import { formatSets, lastSetsFor, progressionAdvice, setsSummary, suggestReps } from '@/lib/stats';
import type { ExerciseId } from '@/lib/types';
import { ExerciseDemo } from './Demo';
import { RestScreen } from './RestScreen';
import { Stepper } from './ui';

export function StrengthPlayer({ session }: { session: ActiveSession }) {
  const { completeSet, rateSet, previousStep, lastWeights, lastReps, history, settings, setSwap } = useStore();
  const steps = buildSteps(session.workoutType, session.deload);
  const step = steps[session.stepIndex];
  const exercise = resolveExercise(step.exerciseId, settings.swaps);
  const existing = session.sets[exercise.id]?.[step.round - 1];
  const last = lastSetsFor(history, exercise.id);
  const advice = progressionAdvice(exercise, last?.sets);
  const swapOptions: ExerciseId[] = [step.exerciseId, ...(EXERCISES[step.exerciseId].swaps ?? [])];

  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [showSwap, setShowSwap] = useState(false);
  const [showTips, setShowTips] = useState(false);

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
    setShowSwap(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.stepIndex, exercise.id]);

  useTempo(settings.tempoEnabled && !session.restEndsAt);

  const nextStep = steps[session.stepIndex + 1];
  const block = WORKOUTS[session.workoutType].blocks[step.blockIndex];
  const label = pairLabel(step.blockIndex, block.exercises.length, block.exercises.indexOf(step.exerciseId));
  const lastSummary = last ? setsSummary(exercise, last.sets) : null;

  // For the rest screen: what was just logged, and what is coming.
  const prevStep = steps[session.stepIndex - 1];
  const prevExercise = prevStep ? resolveExercise(prevStep.exerciseId, settings.swaps) : null;
  const prevLog = prevExercise && prevStep ? session.sets[prevExercise.id]?.[prevStep.round - 1] : undefined;
  const recap =
    prevExercise && prevLog
      ? `${prevLog.completedReps ?? '–'}${prevExercise.unit === 'seconds' ? 's' : ' reps'}${prevLog.weightLbs ? ` @ ${prevLog.weightLbs} lb` : ''}`
      : null;

  return (
    <div className="flex flex-1 flex-col">
      <StepProgress steps={steps} current={session.stepIndex} blockName={block.name} round={step.round} rounds={step.rounds} />

      <div key={`step-${session.stepIndex}`} className="animate-rise flex-1 space-y-3 px-4 pt-3 pb-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-black text-emerald-300">{label}</span>
            <span className="rounded-lg bg-raised px-2.5 py-1 text-xs font-medium text-zinc-300">{exercise.equipment}</span>
            {exercise.setup && (
              <span className="flex items-center gap-1 rounded-lg bg-amber-500/12 px-2.5 py-1 text-xs font-semibold text-amber-300">
                <Wrench className="size-3" aria-hidden="true" /> {exercise.setup}
              </span>
            )}
            {swapOptions.length > 1 && (
              <button
                type="button"
                onClick={() => setShowSwap((s) => !s)}
                aria-expanded={showSwap}
                className="press ml-auto flex min-h-9 items-center gap-1.5 rounded-lg bg-raised px-3 text-xs font-semibold text-zinc-200"
              >
                <ArrowLeftRight className="size-3.5" aria-hidden="true" /> Swap
              </button>
            )}
          </div>
          {showSwap && (
            <div className="mb-3 space-y-1 rounded-2xl bg-surface p-2 ring-1 ring-line">
              {swapOptions.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSwap(step.exerciseId, id === step.exerciseId ? null : id);
                    setShowSwap(false);
                  }}
                  className={`press block min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm ${
                    id === exercise.id ? 'bg-emerald-500/15 font-semibold text-emerald-300' : 'text-zinc-200'
                  }`}
                >
                  {EXERCISES[id].name}
                  {id === step.exerciseId && <span className="ml-1 text-xs text-muted">(programmed)</span>}
                </button>
              ))}
              <p className="px-3 pb-1 text-xs text-muted">Your choice sticks for future workouts until you swap back.</p>
            </div>
          )}
          <h2 className="text-[26px] leading-tight font-black tracking-tight">{exercise.name}</h2>
          <p className="mt-0.5 text-sm font-medium text-emerald-400">{exercise.targetMuscle}</p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">
              {target !== null ? "Today's target" : 'Target'}
            </p>
            {target !== null ? (
              <p className="num text-5xl leading-none font-black">
                {target}
                <span className="ml-1.5 text-lg font-semibold text-muted">reps</span>
                <span className="ml-2 text-xs font-medium text-muted">of {exercise.targetReps}</span>
              </p>
            ) : (
              <p className="text-3xl leading-tight font-black">{exercise.targetReps}</p>
            )}
          </div>
          {lastSummary && last && (
            <div className="rounded-2xl bg-surface px-3 py-2 text-right ring-1 ring-line">
              <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">Last time</p>
              <p className="num text-sm font-bold">{lastSummary.reps}</p>
              {lastSummary.weight && <p className="text-xs text-muted">{lastSummary.weight}</p>}
            </div>
          )}
        </div>

        {advice && (
          <p
            className={`flex gap-2 rounded-2xl px-3 py-2.5 text-sm ${
              advice.tone === 'progress' ? 'bg-emerald-500/12 text-emerald-300' : 'bg-surface text-zinc-300 ring-1 ring-line'
            }`}
          >
            <TrendingUp className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {advice.text}
          </p>
        )}

        <ExerciseDemo key={exercise.id} exercise={exercise} paused={!!session.restEndsAt} />

        <section className="rounded-2xl bg-surface ring-1 ring-line">
          <p className="flex gap-2.5 p-3 text-[15px] leading-snug font-medium">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
            {exercise.formCues[0]}
          </p>
          <button
            type="button"
            onClick={() => setShowTips((s) => !s)}
            aria-expanded={showTips}
            className="press flex min-h-11 w-full items-center justify-between border-t border-line px-3 text-sm font-semibold text-zinc-300"
          >
            {showTips ? 'Hide form cues & tips' : 'More form cues & tips'}
            <ChevronDown className={`size-4 transition-transform ${showTips ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {showTips && (
            <div className="space-y-3 border-t border-line p-3 text-sm text-zinc-300">
              <ul className="space-y-2">
                {exercise.formCues.slice(1).map((cue) => (
                  <li key={cue} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                    {cue}
                  </li>
                ))}
              </ul>
              <p className="rounded-xl bg-page p-3 text-xs leading-relaxed text-muted">{exercise.anatomicalTip}</p>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">Ways to level up</p>
                <ol className="list-decimal space-y-0.5 pl-5 text-zinc-300">
                  {exercise.progressions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </section>

        {nextStep && (
          <p className="text-center text-sm text-muted">
            Next: <span className="text-zinc-300">{resolveExercise(nextStep.exerciseId, settings.swaps).name}</span>
          </p>
        )}
      </div>

      {/* What you actually did: pinned so it is always on screen and one thumb away. */}
      <div className="pb-safe sticky bottom-0 space-y-2 border-t border-line bg-page px-4 pt-3">
        <div className={`grid gap-2 ${exercise.weighted ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Stepper
            compact
            label={exercise.unit === 'seconds' ? 'Hold time' : 'Reps done'}
            value={reps}
            onChange={setReps}
            step={exercise.unit === 'seconds' ? 5 : 1}
            unit={exercise.unit === 'seconds' ? 's' : undefined}
          />
          {exercise.weighted && <Stepper compact label="Weight" value={weight} onChange={setWeight} step={2.5} unit="lb" />}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous set"
            disabled={session.stepIndex === 0}
            onClick={previousStep}
            className="press flex w-14 items-center justify-center rounded-2xl bg-surface text-zinc-300 ring-1 ring-line disabled:opacity-30"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => {
              confirmTap();
              completeSet(reps, exercise.weighted ? weight : undefined, existing?.effort ?? 'solid');
            }}
            className="press flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-lg font-bold text-zinc-950 active:bg-emerald-400"
          >
            <Check className="size-6" strokeWidth={3} aria-hidden="true" />
            {nextStep ? 'Complete set' : 'Finish strength'}
          </button>
        </div>
      </div>

      {session.restEndsAt && (
        <RestScreen
          key={`rest-${session.stepIndex}`}
          endsAt={session.restEndsAt}
          transition={session.restKind === 'transition'}
          recap={recap}
          effort={prevLog?.effort ?? 'solid'}
          onRate={(e) => prevExercise && prevStep && rateSet(prevExercise.id, prevStep.round, e)}
          onEditLast={previousStep}
          next={{
            exercise,
            label,
            round: step.round,
            rounds: step.rounds,
            target,
            last: last ? formatSets(exercise, last.sets) : null,
          }}
        />
      )}
    </div>
  );
}

/** "1A" / "1B" for the two exercises of a superset; single-exercise blocks are the finisher. */
function pairLabel(blockIndex: number, blockLength: number, position: number): string {
  return blockLength > 1 ? `${blockIndex + 1}${'AB'[position] ?? ''}` : 'Finisher';
}

/** One segment per block, one tick per set, so you can see where you are in the whole workout. */
function StepProgress({
  steps,
  current,
  blockName,
  round,
  rounds,
}: {
  steps: { blockIndex: number }[];
  current: number;
  blockName: string;
  round: number;
  rounds: number;
}) {
  const groups: { start: number; count: number }[] = [];
  steps.forEach((s, i) => {
    if (groups[s.blockIndex]) groups[s.blockIndex].count++;
    else groups[s.blockIndex] = { start: i, count: 1 };
  });
  return (
    <div className="px-4 pt-1">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-zinc-200">
          {blockName} · Round {round} of {rounds}
        </span>
        <span className="num text-muted">
          Set {current + 1} of {steps.length}
        </span>
      </div>
      <div
        className="flex gap-2"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={current + 1}
        aria-label="Workout progress"
      >
        {groups.map((g) => (
          <div key={g.start} className="flex gap-0.5" style={{ flex: g.count }}>
            {Array.from({ length: g.count }, (_, k) => {
              const i = g.start + k;
              return (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i < current ? 'bg-emerald-500' : i === current ? 'bg-emerald-300' : 'bg-line'}`}
                />
              );
            })}
          </div>
        ))}
      </div>
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
