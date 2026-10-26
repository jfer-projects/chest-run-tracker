import type { WorkoutSessionLog } from './types';
import { EXERCISES } from './workouts';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
export function weekStreak(history: WorkoutSessionLog[], target: number, now = new Date()): number {
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
