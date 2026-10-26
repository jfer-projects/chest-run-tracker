import type { RunPhase } from './types';

export const RUN_TOTAL_SEC = 20 * 60;

export const RUN_PHASES: RunPhase[] = [
  {
    id: 'warmup',
    label: 'Warm-up',
    cue: 'Easy jog or brisk walk for 3 minutes',
    startSec: 0,
    endSec: 3 * 60,
    color: '#22c55e',
  },
  {
    id: 'zone2',
    label: 'Zone 2 Steady',
    cue: 'Steady aerobic pace: you can still talk in full sentences',
    startSec: 3 * 60,
    endSec: 17 * 60,
    color: '#3b82f6',
  },
  {
    id: 'push',
    label: 'Push Pace',
    cue: 'Push pace for 2 minutes!',
    startSec: 17 * 60,
    endSec: 19 * 60,
    color: '#f59e0b',
  },
  {
    id: 'cooldown',
    label: 'Cool-down',
    cue: 'Walk it out, breathe through your nose',
    startSec: 19 * 60,
    endSec: 20 * 60,
    color: '#14b8a6',
  },
];

export function phaseIndexAt(elapsedSec: number): number {
  const idx = RUN_PHASES.findIndex((p) => elapsedSec < p.endSec);
  return idx === -1 ? RUN_PHASES.length - 1 : idx;
}
