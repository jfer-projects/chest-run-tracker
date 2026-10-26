'use client';

import { useEffect, useRef } from 'react';
import { Bike, Footprints, Pause, Play, SkipForward, Square } from 'lucide-react';
import { useStore, runElapsedSec, type ActiveSession } from '@/lib/store';
import { useNow } from '@/lib/hooks';
import { CARDIO_LABEL, RUN_PHASES, RUN_TOTAL_SEC, phaseIndexAt } from '@/lib/run';
import type { CardioMode } from '@/lib/types';
import { countdownTick, phaseChange, sessionComplete, unlockAudio } from '@/lib/cues';
import { formatClock } from '@/lib/format';
import { ProgressRing } from './ui';

export function CardioIcon({ mode, className }: { mode: CardioMode; className?: string }) {
  return mode === 'bike' ? <Bike className={className} /> : <Footprints className={className} />;
}

export function RunOffer({ session }: { session: ActiveSession }) {
  const { startRun, finishRun, settings } = useStore();
  const logged = Object.values(session.sets).reduce((n, s) => n + (s?.filter(Boolean).length ?? 0), 0);
  // The last-used cardio is the big primary button; the other sits beside it.
  const preferred = settings.defaultCardio;
  const other: CardioMode = preferred === 'run' ? 'bike' : 'run';
  const start = (mode: CardioMode) => {
    unlockAudio();
    startRun(mode);
  };
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-500/15">
        <CardioIcon mode={preferred} className="size-10 text-emerald-400" />
      </div>
      <h2 className="text-3xl font-bold">Strength done</h2>
      <p className="mt-2 text-zinc-400">{logged} sets logged. Time for 20 minutes of cardio: run or Peloton.</p>
      <div className="mt-8 w-full space-y-2 text-left">
        {RUN_PHASES.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3">
            <span className="size-3 rounded-full" style={{ background: p.color }} />
            <span className="flex-1 font-medium">{p.label}</span>
            <span className="text-sm text-zinc-500">{(p.endSec - p.startSec) / 60} min</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => start(preferred)}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-5 text-xl font-bold text-zinc-950 active:bg-emerald-400"
      >
        <CardioIcon mode={preferred} className="size-6" /> Start {CARDIO_LABEL[preferred].title}
      </button>
      <button
        type="button"
        onClick={() => start(other)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 py-4 text-lg font-semibold text-zinc-200 active:bg-zinc-900"
      >
        <CardioIcon mode={other} className="size-5" /> {CARDIO_LABEL[other].title} instead
      </button>
      <button type="button" onClick={() => finishRun(false)} className="mt-3 w-full py-3 text-zinc-500">
        Skip cardio &amp; finish
      </button>
    </div>
  );
}

export function RunTimer({ session }: { session: ActiveSession }) {
  const { pauseRun, resumeRun, skipRunPhase, finishRun } = useStore();
  const running = session.run.resumedAt !== null;
  const mode = session.run.mode ?? 'run';
  const now = useNow(running, 200);
  const elapsed = runElapsedSec(session.run, now);
  const idx = phaseIndexAt(elapsed);
  const phase = RUN_PHASES[idx];
  const phaseRemaining = Math.max(0, Math.ceil(phase.endSec - elapsed));
  const totalRemaining = Math.max(0, RUN_TOTAL_SEC - elapsed);

  const lastPhase = useRef(idx);
  const lastTick = useRef<number | null>(null);

  // Phase transition alert (also fires after Skip).
  useEffect(() => {
    if (idx !== lastPhase.current) {
      lastPhase.current = idx;
      phaseChange();
    }
  }, [idx]);

  // 3-2-1 lead-in before each transition, only while running.
  useEffect(() => {
    if (!running || lastTick.current === phaseRemaining) return;
    lastTick.current = phaseRemaining;
    if (phaseRemaining >= 1 && phaseRemaining <= 3) countdownTick();
  }, [phaseRemaining, running]);

  useEffect(() => {
    if (elapsed >= RUN_TOTAL_SEC) {
      sessionComplete();
      finishRun(true);
    }
  }, [elapsed, finishRun]);

  const nextPhase = RUN_PHASES[idx + 1];

  return (
    <div className="flex flex-1 flex-col px-4 pt-2">
      {/* Segmented 20-min bar */}
      <div className="flex h-3 gap-1">
        {RUN_PHASES.map((p) => {
          const len = p.endSec - p.startSec;
          const fill = Math.min(1, Math.max(0, (elapsed - p.startSec) / len));
          return (
            <div key={p.id} className="relative overflow-hidden rounded-full bg-zinc-800" style={{ flex: len }}>
              <div className="absolute inset-y-0 left-0" style={{ width: `${fill * 100}%`, background: p.color }} />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-zinc-500 tabular-nums">
        <span>{formatClock(elapsed)}</span>
        <span>-{formatClock(totalRemaining)}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <span
          className="rounded-full px-4 py-1.5 text-sm font-bold tracking-wider uppercase"
          style={{ background: `${phase.color}26`, color: phase.color }}
        >
          {phase.label}
        </span>
        <p className="mt-3 max-w-xs text-xl font-semibold text-zinc-100">{mode === 'bike' ? phase.bikeCue : phase.cue}</p>

        <div className="my-8">
          <ProgressRing
            value={elapsed - phase.startSec}
            max={phase.endSec - phase.startSec}
            size={260}
            stroke={16}
            color={phase.color}
          >
            <span className="text-7xl font-black tabular-nums">{formatClock(phaseRemaining)}</span>
            <span className="mt-1 text-sm text-zinc-500">left in phase</span>
          </ProgressRing>
        </div>

        {nextPhase && (
          <p className="text-sm text-zinc-500">
            Then: <span style={{ color: nextPhase.color }}>{nextPhase.label}</span>
          </p>
        )}
        {!running && session.run.elapsedMs > 0 && <p className="mt-2 font-semibold text-amber-400">Paused</p>}
      </div>

      <div className="pb-safe grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            if (confirm(`End the ${CARDIO_LABEL[mode].noun} now? It will be logged as not completed.`)) finishRun(false);
          }}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-zinc-900 py-4 text-sm text-zinc-400"
        >
          <Square className="size-6" /> End
        </button>
        <button
          type="button"
          onClick={running ? pauseRun : resumeRun}
          className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-4 text-sm font-bold text-zinc-950 ${
            running ? 'bg-amber-400' : 'bg-emerald-500'
          }`}
        >
          {running ? <Pause className="size-8 fill-current" /> : <Play className="size-8 fill-current" />}
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          type="button"
          onClick={skipRunPhase}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-zinc-900 py-4 text-sm text-zinc-400"
        >
          <SkipForward className="size-6" /> Skip
        </button>
      </div>
    </div>
  );
}
