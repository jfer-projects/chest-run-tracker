import type { ExerciseDefinition, ExerciseId, SetLog, WorkoutSessionLog } from './types';
import { EXERCISES, defaultReps, topReps } from './workouts';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** The weekly target and streak track the chest program; Leg Day is extra. */
export function chestOnly(history: WorkoutSessionLog[]): WorkoutSessionLog[] {
  return history.filter((h) => h.workoutType !== 'L');
}

/** Monday 00:00 local time of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = (out.getDay() + 6) % 7; // Mon = 0
  out.setDate(out.getDate() - day);
  return out;
}

export function sessionsInWeek(history: WorkoutSessionLog[], weekStart: Date): WorkoutSessionLog[] {
  const start = weekStart.getTime();
  return history.filter((h) => {
    const t = new Date(h.date).getTime();
    return t >= start && t < start + WEEK_MS;
  });
}

/**
 * Consecutive weeks that met the target. The current week counts once it hits the target,
 * but an unfinished current week doesn't break the streak.
 */
export function weekStreak(allHistory: WorkoutSessionLog[], target: number, now = new Date()): number {
  const history = chestOnly(allHistory);
  let week = startOfWeek(now);
  let streak = 0;
  if (sessionsInWeek(history, week).length >= target) streak++;
  for (;;) {
    week = new Date(week.getTime() - WEEK_MS);
    // Re-anchor to Monday in case a DST shift moved us off midnight.
    week = startOfWeek(new Date(week.getTime() + 12 * 60 * 60 * 1000));
    if (sessionsInWeek(history, week).length >= target) streak++;
    else break;
  }
  return streak;
}

export interface SessionTotals {
  sets: number;
  reps: number;
  holdSeconds: number;
  volumeLbs: number;
}

export function sessionTotals(log: Pick<WorkoutSessionLog, 'sets'>): SessionTotals {
  const totals: SessionTotals = { sets: 0, reps: 0, holdSeconds: 0, volumeLbs: 0 };
  for (const [id, sets] of Object.entries(log.sets)) {
    const exercise = EXERCISES[id as keyof typeof EXERCISES];
    for (const s of sets ?? []) {
      if (!s?.completed) continue;
      totals.sets++;
      const n = s.completedReps ?? 0;
      if (exercise?.unit === 'seconds') totals.holdSeconds += n;
      else totals.reps += n;
      if (s.weightLbs) totals.volumeLbs += s.weightLbs * n;
    }
  }
  return totals;
}

/** Completed sets from the most recent session that included this exercise. */
export function lastSetsFor(history: WorkoutSessionLog[], id: ExerciseId): { date: string; sets: SetLog[] } | null {
  for (const log of history) {
    const sets = (log.sets[id] ?? []).filter((s) => s?.completed);
    if (sets.length) return { date: log.date, sets };
  }
  return null;
}

export function formatSets(exercise: ExerciseDefinition, sets: SetLog[]): string {
  const reps = sets.map((s) => `${s.completedReps ?? '–'}${exercise.unit === 'seconds' ? 's' : ''}`).join(' · ');
  const weights = [...new Set(sets.map((s) => s.weightLbs).filter(Boolean))];
  return weights.length ? `${reps} @ ${weights.join('/')} lb` : reps;
}

export interface Advice {
  tone: 'progress' | 'repeat' | 'beat';
  text: string;
}

/**
 * Double progression: once every set reached the top of the rep range, make it harder next time.
 * Sets logged as "max" effort mean own that load first rather than jumping ahead.
 */
export function progressionAdvice(exercise: ExerciseDefinition, last: SetLog[] | undefined): Advice | null {
  if (!last?.length) return null;
  const top = topReps(exercise);
  if (top === null) {
    const best = Math.max(...last.map((s) => s.completedReps ?? 0));
    return { tone: 'beat', text: `Beat last time: ${best}${exercise.unit === 'seconds' ? 's' : ' reps'}` };
  }
  const hitTop = last.every((s) => (s.completedReps ?? 0) >= top);
  const allMax = last.every((s) => s.effort === 'max');
  if (hitTop && !allMax) return { tone: 'progress', text: `You hit ${top} on every set. Progress: ${exercise.progressions[0]}` };
  if (hitTop) return { tone: 'repeat', text: `Top of the range, but it was max effort. Repeat this and own it, then: ${exercise.progressions[0]}` };
  return { tone: 'repeat', text: `Aim for ${top} on every set before progressing` };
}

/**
 * Personal rep target for one set. Starts from last session (same set + 1, capped at the top of the range;
 * back to the bottom when the weight goes up), then follows today's session: a set that fell short or felt
 * "max" sets the next round at what you actually did, an "easy" set adds one, and a "solid" set holds.
 * Returns null for "to failure" work, which has no target.
 */
export function suggestReps(
  exercise: ExerciseDefinition,
  round: number,
  last: SetLog[] | undefined,
  today: SetLog[] | undefined,
  currentWeight?: number,
): number | null {
  const lo = defaultReps(exercise);
  const hi = topReps(exercise);
  if (hi === null || exercise.unit === 'seconds') return null;

  const prevLast = last?.[round - 1] ?? last?.[last.length - 1];
  let target = prevLast?.completedReps === undefined ? lo : Math.min(hi, prevLast.completedReps + 1);
  const lastWeight = Math.max(0, ...(last ?? []).map((s) => s.weightLbs ?? 0));
  if (exercise.weighted && currentWeight !== undefined && lastWeight > 0 && currentWeight > lastWeight) target = lo;

  // Once today has a previous round, today's performance governs, not last session's.
  const prior = today?.[round - 2];
  if (prior?.completedReps !== undefined) {
    const priorTarget = suggestReps(exercise, round - 1, last, today, currentWeight) ?? target;
    const did = prior.completedReps;
    if (did < priorTarget || prior.effort === 'max') target = did;
    else if (prior.effort === 'easy') target = Math.min(hi, did + 1);
    else target = Math.min(target, did);
  }
  return Math.max(1, target);
}

export interface ExercisePoint {
  date: string;
  bestReps: number;
  bestWeight: number;
  volume: number; // reps x weight, or total reps/seconds when unweighted
}

/** One point per session for charts and PRs, oldest first. */
export function exerciseSeries(history: WorkoutSessionLog[], id: ExerciseId): ExercisePoint[] {
  const out: ExercisePoint[] = [];
  for (const log of history) {
    const sets = (log.sets[id] ?? []).filter((s) => s?.completed);
    if (!sets.length) continue;
    out.push({
      date: log.date,
      bestReps: Math.max(...sets.map((s) => s.completedReps ?? 0)),
      bestWeight: Math.max(0, ...sets.map((s) => s.weightLbs ?? 0)),
      volume: sets.reduce((n, s) => n + (s.completedReps ?? 0) * (s.weightLbs || 1), 0),
    });
  }
  return out.reverse();
}
