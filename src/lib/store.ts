'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardioMode, Effort, ExerciseId, Measurement, Settings, SetLog, WorkoutSessionLog, WorkoutType } from './types';
import { buildSteps, resolveExercise, warmupFor } from './workouts';
import { RUN_PHASES, RUN_TOTAL_SEC, phaseIndexAt } from './run';

export type SessionPhase = 'warmup' | 'strength' | 'run-offer' | 'run' | 'summary';

export interface RunState {
  elapsedMs: number; // accumulated while paused
  resumedAt: number | null; // epoch ms when last resumed, null when paused
  started: boolean;
  completed: boolean;
  /** Run or Peloton ride. Missing on sessions saved before rides existed, which means run. */
  mode?: CardioMode;
}

export interface ActiveSession {
  id: string;
  workoutType: WorkoutType;
  startedAt: number;
  endedAt?: number;
  phase: SessionPhase;
  /** Halved rounds for a deload week, fixed when the session starts. */
  deload?: boolean;
  warmupIndex?: number;
  warmupEndsAt?: number | null;
  /** Milliseconds left when the warm-up timer is paused; null while it runs. */
  warmupPausedMs?: number | null;
  stepIndex: number;
  sets: Partial<Record<ExerciseId, SetLog[]>>;
  restEndsAt: number | null;
  /** 'transition' is the quick switch between the two exercises of a superset pair. */
  restKind?: 'transition' | 'rest';
  run: RunState;
}

interface StoreState {
  history: WorkoutSessionLog[];
  settings: Settings;
  lastWeights: Partial<Record<ExerciseId, number>>;
  lastReps: Partial<Record<ExerciseId, number>>;
  active: ActiveSession | null;
  /** Session ids deleted locally that the cloud hasn't been told about yet. */
  pendingDeletes: string[];
  /** When settings last changed on this device, for last-write-wins cloud sync. 0 = never. */
  settingsUpdatedAt: number;
  measurements: Measurement[];
  pendingMeasurementDeletes: string[];

  startSession: (type: WorkoutType) => void;
  nextWarmup: () => void;
  pauseWarmup: () => void;
  resumeWarmup: () => void;
  skipWarmup: () => void;
  completeSet: (reps: number, weightLbs?: number, effort?: Effort) => void;
  /** Sets how a logged set felt (done from the rest screen). */
  rateSet: (exerciseId: ExerciseId, round: number, effort: Effort) => void;
  previousStep: () => void;
  addRest: (seconds: number) => void;
  endRest: () => void;
  skipStrength: () => void;
  startRun: (mode: CardioMode) => void;
  pauseRun: () => void;
  resumeRun: () => void;
  skipRunPhase: () => void;
  finishRun: (completed: boolean) => void;
  saveSession: (notes?: string) => void;
  discardSession: () => void;
  deleteLog: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  importHistory: (logs: WorkoutSessionLog[]) => void;
  setSwap: (original: ExerciseId, replacement: ExerciseId | null) => void;
  startDeload: () => void;
  endDeload: () => void;
  addMeasurement: (m: Omit<Measurement, 'id'>) => void;
  deleteMeasurement: (id: string) => void;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function isDeloading(settings: Settings, now = Date.now()): boolean {
  return settings.deloadUntil !== null && now < settings.deloadUntil;
}

export function runElapsedSec(run: RunState, now = Date.now()): number {
  const ms = run.elapsedMs + (run.resumedAt ? now - run.resumedAt : 0);
  return Math.min(RUN_TOTAL_SEC, ms / 1000);
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const freshRun = (): RunState => ({ elapsedMs: 0, resumedAt: null, started: false, completed: false });

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      history: [],
      settings: {
        useRoutineRest: true,
        restSeconds: 60,
        transitionSeconds: 15,
        soundEnabled: true,
        vibrationEnabled: true,
        weeklyTarget: 3,
        defaultCardio: 'run',
        warmupEnabled: true,
        swaps: {},
        deloadEveryWeeks: 7,
        lastDeloadAt: null,
        deloadUntil: null,
        tempoEnabled: false,
      },
      lastWeights: {},
      lastReps: {},
      active: null,
      pendingDeletes: [],
      settingsUpdatedAt: 0,
      measurements: [],
      pendingMeasurementDeletes: [],

      startSession: (type) => {
        const { settings } = get();
        const warmup = settings.warmupEnabled;
        set({
          active: {
            id: uuid(),
            workoutType: type,
            startedAt: Date.now(),
            phase: warmup ? 'warmup' : 'strength',
            deload: isDeloading(settings),
            warmupIndex: 0,
            warmupEndsAt: warmup ? Date.now() + warmupFor(type)[0].seconds * 1000 : null,
            stepIndex: 0,
            sets: {},
            restEndsAt: null,
            run: freshRun(),
          },
        });
      },

      nextWarmup: () => {
        const { active } = get();
        if (!active || active.phase !== 'warmup') return;
        const steps = warmupFor(active.workoutType);
        const next = (active.warmupIndex ?? 0) + 1;
        if (next >= steps.length) {
          get().skipWarmup();
          return;
        }
        // Moving on always starts the next move running, even if the last one was paused.
        set({
          active: { ...active, warmupIndex: next, warmupEndsAt: Date.now() + steps[next].seconds * 1000, warmupPausedMs: null },
        });
      },

      pauseWarmup: () => {
        const { active } = get();
        if (!active || active.phase !== 'warmup' || active.warmupPausedMs != null || !active.warmupEndsAt) return;
        set({ active: { ...active, warmupPausedMs: Math.max(0, active.warmupEndsAt - Date.now()) } });
      },

      resumeWarmup: () => {
        const { active } = get();
        if (!active || active.warmupPausedMs == null) return;
        set({ active: { ...active, warmupEndsAt: Date.now() + active.warmupPausedMs, warmupPausedMs: null } });
      },

      skipWarmup: () => {
        const { active } = get();
        if (!active) return;
        set({ active: { ...active, phase: 'strength', warmupEndsAt: null, warmupPausedMs: null } });
      },

      completeSet: (reps, weightLbs, effort) => {
        const { active, settings, lastWeights, lastReps } = get();
        if (!active) return;
        const steps = buildSteps(active.workoutType, active.deload);
        const step = steps[active.stepIndex];
        // Logged under the exercise actually performed, which may be a swap.
        const exercise = resolveExercise(step.exerciseId, settings.swaps);
        const logs = [...(active.sets[exercise.id] ?? [])];
        logs[step.round - 1] = {
          setNumber: step.round,
          targetReps: exercise.targetReps,
          completedReps: reps,
          weightLbs: exercise.weighted ? weightLbs : undefined,
          completed: true,
          effort,
        };
        const isLast = active.stepIndex >= steps.length - 1;
        // Within a superset pair, only a quick switch; the full rest comes after the pair.
        const next = steps[active.stepIndex + 1];
        const midPair = !!next && next.blockIndex === step.blockIndex && next.round === step.round;
        const rest = midPair
          ? settings.transitionSeconds
          : settings.useRoutineRest
            ? exercise.defaultRest
            : settings.restSeconds;
        set({
          lastWeights: exercise.weighted && weightLbs !== undefined
            ? { ...lastWeights, [exercise.id]: weightLbs }
            : lastWeights,
          lastReps: { ...lastReps, [exercise.id]: reps },
          active: {
            ...active,
            sets: { ...active.sets, [exercise.id]: logs },
            stepIndex: isLast ? active.stepIndex : active.stepIndex + 1,
            phase: isLast ? 'run-offer' : 'strength',
            restEndsAt: isLast || rest <= 0 ? null : Date.now() + rest * 1000,
            restKind: midPair ? 'transition' : 'rest',
          },
        });
      },

      rateSet: (exerciseId, round, effort) => {
        const { active } = get();
        const log = active?.sets[exerciseId]?.[round - 1];
        if (!active || !log) return;
        const logs = [...(active.sets[exerciseId] ?? [])];
        logs[round - 1] = { ...log, effort };
        set({ active: { ...active, sets: { ...active.sets, [exerciseId]: logs } } });
      },

      previousStep: () => {
        const { active } = get();
        if (!active || active.stepIndex === 0) return;
        set({ active: { ...active, stepIndex: active.stepIndex - 1, restEndsAt: null, phase: 'strength' } });
      },

      addRest: (seconds) => {
        const { active } = get();
        if (!active?.restEndsAt) return;
        set({ active: { ...active, restEndsAt: active.restEndsAt + seconds * 1000 } });
      },

      endRest: () => {
        const { active } = get();
        if (!active) return;
        set({ active: { ...active, restEndsAt: null } });
      },

      skipStrength: () => {
        const { active } = get();
        if (!active) return;
        set({ active: { ...active, phase: 'run-offer', restEndsAt: null } });
      },

      startRun: (mode) => {
        const { active, settings } = get();
        if (!active) return;
        set({
          settings: { ...settings, defaultCardio: mode },
          settingsUpdatedAt: Date.now(),
          active: { ...active, phase: 'run', run: { ...freshRun(), mode, started: true, resumedAt: Date.now() } },
        });
      },

      pauseRun: () => {
        const { active } = get();
        if (!active?.run.resumedAt) return;
        const now = Date.now();
        set({
          active: {
            ...active,
            run: { ...active.run, elapsedMs: active.run.elapsedMs + (now - active.run.resumedAt), resumedAt: null },
          },
        });
      },

      resumeRun: () => {
        const { active } = get();
        if (!active || active.run.resumedAt) return;
        set({ active: { ...active, run: { ...active.run, resumedAt: Date.now() } } });
      },

      skipRunPhase: () => {
        const { active } = get();
        if (!active) return;
        const idx = phaseIndexAt(runElapsedSec(active.run));
        if (idx >= RUN_PHASES.length - 1) {
          get().finishRun(true);
          return;
        }
        const running = active.run.resumedAt !== null;
        set({
          active: {
            ...active,
            run: { ...active.run, elapsedMs: RUN_PHASES[idx + 1].startSec * 1000, resumedAt: running ? Date.now() : null },
          },
        });
      },

      finishRun: (completed) => {
        const { active } = get();
        if (!active) return;
        set({
          active: {
            ...active,
            phase: 'summary',
            endedAt: Date.now(),
            run: { ...active.run, resumedAt: null, completed },
          },
        });
      },

      saveSession: (notes) => {
        const { active, history } = get();
        if (!active) return;
        const endedAt = active.endedAt ?? Date.now();
        const log: WorkoutSessionLog = {
          id: active.id,
          date: new Date(active.startedAt).toISOString(),
          workoutType: active.workoutType,
          sets: active.sets,
          runCompleted: active.run.completed,
          cardioMode: active.run.started ? (active.run.mode ?? 'run') : undefined,
          notes: notes?.trim() || undefined,
          durationSeconds: Math.round((endedAt - active.startedAt) / 1000),
        };
        set({ history: [log, ...history], active: null });
      },

      discardSession: () => set({ active: null }),

      deleteLog: (id) =>
        set({
          history: get().history.filter((h) => h.id !== id),
          pendingDeletes: [...get().pendingDeletes, id],
        }),

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch }, settingsUpdatedAt: Date.now() }),

      importHistory: (logs) => {
        const byId = new Map(get().history.map((h) => [h.id, h]));
        for (const log of logs) byId.set(log.id, log);
        set({ history: [...byId.values()].sort((a, b) => b.date.localeCompare(a.date)) });
      },

      setSwap: (original, replacement) => {
        const swaps = { ...get().settings.swaps };
        if (replacement && replacement !== original) swaps[original] = replacement;
        else delete swaps[original];
        get().updateSettings({ swaps });
      },

      startDeload: () => {
        const now = Date.now();
        get().updateSettings({ lastDeloadAt: now, deloadUntil: now + WEEK_MS });
      },

      endDeload: () => get().updateSettings({ deloadUntil: null }),

      addMeasurement: (m) =>
        set({
          measurements: [{ ...m, id: uuid() }, ...get().measurements].sort((a, b) => b.date.localeCompare(a.date)),
        }),

      deleteMeasurement: (id) =>
        set({
          measurements: get().measurements.filter((m) => m.id !== id),
          pendingMeasurementDeletes: [...get().pendingMeasurementDeletes, id],
        }),
    }),
    {
      name: 'chest-run-companion',
      version: 1,
      // Deep-merge settings so newly added settings get their defaults for existing users.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StoreState>;
        return { ...current, ...p, settings: { ...current.settings, ...p.settings } };
      },
    },
  ),
);

/** Alternates A/B based on the most recent chest session; Leg Day doesn't affect the rotation. */
export function nextWorkoutType(history: WorkoutSessionLog[]): WorkoutType {
  const last = history.find((h) => h.workoutType !== 'L');
  return last?.workoutType === 'A' ? 'B' : 'A';
}

/** Deload is suggested once this many weeks have passed since training started or the last deload. */
export function deloadDue(settings: Settings, history: WorkoutSessionLog[], now = Date.now()): boolean {
  if (isDeloading(settings, now) || history.length === 0) return false;
  const first = Math.min(...history.map((h) => new Date(h.date).getTime()));
  const since = Math.max(first, settings.lastDeloadAt ?? 0);
  return now - since >= settings.deloadEveryWeeks * WEEK_MS;
}
