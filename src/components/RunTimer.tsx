'use client';

import { useEffect, useRef, useState } from 'react';
import { Bike, CheckCircle2, Footprints, Pause, Play, SkipForward, Square } from 'lucide-react';
import { useStore, runElapsedSec, type ActiveSession } from '@/lib/store';
import { useNow } from '@/lib/hooks';
import { CARDIO_LABEL, RUN_PHASES, RUN_TOTAL_SEC, phaseIndexAt } from '@/lib/run';
import type { CardioMode } from '@/lib/types';
import { countdownTick, phaseChange, sessionComplete, tap, unlockAudio } from '@/lib/cues';
import { formatClock } from '@/lib/format';
import { ProgressRing, Sheet } from './ui';

export function CardioIcon({ mode, className }: { mode: CardioMode; className?: string }) {
  return mode === 'bike' ? <Bike className={className} /> : <Footprints className={className} />;
}

/** The 20-minute plan as one proportional bar. `elapsed` fills it (omit for the plain preview). */
function PhaseBar({ elapsed, tall = false }: { elapsed?: number; tall?: boolean }) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {RUN_PHASES.map((p) => {
        const len = p.endSec - p.startSec;
        const fill = elapsed === undefined ? 1 : Math.min(1, Math.max(0, (elapsed - p.startSec) / len));
        return (
          <div
            key={p.id}
            className={`relative overflow-hidden rounded-full bg-line ${tall ? 'h-3' : 'h-2'}`}
            style={{ flex: len }}
          >
            <div className="absolute inset-y-0 left-0" style={{ width: `${fill * 100}%`, background: p.color }} />
          </div>
        );
      })}
    </div>
  );
}

export function RunOffer({ session }: { session: ActiveSession }) {
  const { startRun, finishRun, settings } = useStore();
  const logged = Object.values(session.sets).reduce((n, s) => n + (s?.filter(Boolean).length ?? 0), 0);
  // The last-used cardio is the big primary button; the other sits beneath it.
  const preferred = settings.defaultCardio;
  const other: CardioMode = preferred === 'run' ? 'bike' : 'run';
  const start = (mode: CardioMode) => {
    unlockAudio();
    startRun(mode);
  };
  return (
    <div className="animate-rise flex flex-1 flex-col px-4">
      <div className="flex-1 pt-4 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="size-9 text-emerald-400" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-black tracking-tight">Strength done</h2>
        <p className="mt-1 text-zinc-300">
          {logged} {logged === 1 ? 'set' : 'sets'} logged. Now 20 minutes of cardio.
        </p>

        <div className="mt-6 rounded-3xl bg-surface p-4 text-left ring-1 ring-line">
          <PhaseBar />
          <ul className="mt-3 space-y-2.5">
            {RUN_PHASES.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="size-3 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden="true" />
                <span className="flex-1 font-medium">{p.label}</span>
                <span className="num text-sm text-muted">
                  {formatClock(p.startSec)}–{formatClock(p.endSec)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pb-safe space-y-2 pt-4">
        <button
          type="button"
          onClick={() => start(preferred)}
          className="press flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-lg font-bold text-zinc-950"
        >
          <CardioIcon mode={preferred} className="size-6" /> Start {CARDIO_LABEL[preferred].title}
        </button>
        <button
          type="button"
          onClick={() => start(other)}
          className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-surface font-semibold text-zinc-200 ring-1 ring-line"
        >
          <CardioIcon mode={other} className="size-5" /> {CARDIO_LABEL[other].title} instead
        </button>
        <button
          type="button"
          onClick={() => finishRun(false)}
          className="press min-h-12 w-full rounded-2xl text-sm font-semibold text-muted underline underline-offset-4"
        >
          Skip cardio and finish
        </button>
      </div>
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
  const [confirmEnd, setConfirmEnd] = useState(false);

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
  const nextMinutes = nextPhase ? (nextPhase.endSec - nextPhase.startSec) / 60 : 0;

  return (
    <div
      className="flex flex-1 flex-col px-4 pt-2 transition-[background] duration-700"
      style={{ background: `radial-gradient(120% 55% at 50% 38%, ${phase.color}22, transparent 70%)` }}
    >
      <div>
        <PhaseBar elapsed={elapsed} tall />
        <div className="num mt-1 flex justify-between text-xs text-muted">
          <span>{formatClock(elapsed)} elapsed</span>
          <span>{formatClock(totalRemaining)} left</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span
          className="rounded-full px-4 py-1.5 text-sm font-bold tracking-wider uppercase"
          style={{ background: `${phase.color}26`, color: phase.color }}
        >
          {phase.label}
        </span>

        <div className="my-5" role="timer" aria-label={`${phaseRemaining} seconds left in ${phase.label}`}>
          <ProgressRing value={elapsed - phase.startSec} max={phase.endSec - phase.startSec} size={248} stroke={14} color={phase.color}>
            <span className="num text-7xl font-black">{formatClock(phaseRemaining)}</span>
            <span className="mt-1 text-sm text-muted">{running || session.run.elapsedMs === 0 ? 'left in phase' : 'Paused'}</span>
          </ProgressRing>
        </div>

        <p className="max-w-xs text-lg leading-snug font-medium text-zinc-200">{mode === 'bike' ? phase.bikeCue : phase.cue}</p>

        {nextPhase && (
          <p className="mt-3 flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm text-zinc-300 ring-1 ring-line">
            <span className="size-2.5 rounded-full" style={{ background: nextPhase.color }} aria-hidden="true" />
            Next: {nextPhase.label} · {nextMinutes} min
          </p>
        )}
      </div>

      <div className="pb-safe grid grid-cols-[1fr_1.6fr_1fr] gap-3">
        <button
          type="button"
          onClick={() => setConfirmEnd(true)}
          className="press flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-surface text-sm font-medium text-zinc-300 ring-1 ring-line"
        >
          <Square className="size-5" aria-hidden="true" /> End
        </button>
        <button
          type="button"
          onClick={() => {
            tap();
            if (running) pauseRun();
            else resumeRun();
          }}
          className={`press flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-sm font-bold text-zinc-950 ${
            running ? 'bg-amber-400' : 'bg-emerald-500'
          }`}
        >
          {running ? <Pause className="size-7 fill-current" aria-hidden="true" /> : <Play className="size-7 fill-current" aria-hidden="true" />}
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          type="button"
          onClick={skipRunPhase}
          className="press flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-surface text-sm font-medium text-zinc-300 ring-1 ring-line"
        >
          <SkipForward className="size-5" aria-hidden="true" /> Skip
        </button>
      </div>

      <Sheet open={confirmEnd} onClose={() => setConfirmEnd(false)} title={`End the ${CARDIO_LABEL[mode].noun} now?`}>
        <p className="mb-4 text-zinc-300">It will be logged as not completed.</p>
        <div className="grid grid-cols-2 gap-3 pb-2">
          <button type="button" onClick={() => setConfirmEnd(false)} className="press min-h-14 rounded-2xl bg-raised font-semibold">
            Keep going
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmEnd(false);
              finishRun(false);
            }}
            className="press min-h-14 rounded-2xl bg-rose-500 font-bold text-white"
          >
            End {CARDIO_LABEL[mode].noun}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
