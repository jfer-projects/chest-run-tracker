'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardioMode, ExerciseId, Settings, SetLog, WorkoutSessionLog, WorkoutType } from './types';
import { EXERCISES, buildSteps } from './workouts';
import { RUN_PHASES, RUN_TOTAL_SEC, phaseIndexAt } from './run';

export type SessionPhase = 'strength' | 'run-offer' | 'run' | 'summary';

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

  startSession: (type: WorkoutType) => void;
  completeSet: (reps: number, weightLbs?: number) => void;
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
      settings: { useRoutineRest: true, restSeconds: 60, transitionSeconds: 15, soundEnabled: true, vibrationEnabled: true, weeklyTarget: 3, defaultCardio: 'run' },
      lastWeights: {},
      lastReps: {},
      active: null,
      pendingDeletes: [],
      settingsUpdatedAt: 0,

      startSession: (type) =>
        set({
          active: {
            id: uuid(),
            workoutType: type,
            startedAt: Date.now(),
            phase: 'strength',
            stepIndex: 0,
            sets: {},
            restEndsAt: null,
            run: freshRun(),
          },
        }),

      completeSet: (reps, weightLbs) => {
        const { active, settings, lastWeights, lastReps } = get();
        if (!active) return;
        const steps = buildSteps(active.workoutType);
        const step = steps[active.stepIndex];
        const exercise = EXERCISES[step.exerciseId];
        const logs = [...(active.sets[step.exerciseId] ?? [])];
        logs[step.round - 1] = {
          setNumber: step.round,
          targetReps: exercise.targetReps,
          completedReps: reps,
          weightLbs: exercise.weighted ? weightLbs : undefined,
          completed: true,
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
            ? { ...lastWeights, [step.exerciseId]: weightLbs }
            : lastWeights,
          lastReps: { ...lastReps, [step.exerciseId]: reps },
          active: {
            ...active,
            sets: { ...active.sets, [step.exerciseId]: logs },
            stepIndex: isLast ? active.stepIndex : active.stepIndex + 1,
            phase: isLast ? 'run-offer' : 'strength',
            restEndsAt: isLast || rest <= 0 ? null : Date.now() + rest * 1000,
            restKind: midPair ? 'transition' : 'rest',
          },
        });
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

/** Alternates A/B based on the most recent saved session. */
export function nextWorkoutType(history: WorkoutSessionLog[]): WorkoutType {
  const last = history[0];
  return last?.workoutType === 'A' ? 'B' : 'A';
}
