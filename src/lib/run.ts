import type { RunPhase } from './types';

export const RUN_TOTAL_SEC = 20 * 60;

export const RUN_PHASES: RunPhase[] = [
  {
    id: 'warmup',
    label: 'Warm-up',
    cue: 'Brisk walk or light conversational jog. Warm up the knees and ankles.',
    startSec: 0,
    endSec: 3 * 60,
    color: '#10b981',
  },
  {
    id: 'zone2',
    label: 'Zone 2 Aerobic',
    cue: 'Steady conversational pace, heart rate around 130-145 bpm.',
    startSec: 3 * 60,
    endSec: 17 * 60,
    color: '#06b6d4',
  },
  {
    id: 'push',
    label: 'Surge Push',
    cue: 'Hard acceleration! Fast stride for 2 minutes!',
    startSec: 17 * 60,
    endSec: 19 * 60,
    color: '#f59e0b',
  },
  {
    id: 'cooldown',
    label: 'Cool-Down',
    cue: 'Easy walk with deep, diaphragmatic nasal breathing.',
    startSec: 19 * 60,
    endSec: 20 * 60,
    color: '#94a3b8',
  },
];

export function phaseIndexAt(elapsedSec: number): number {
  const idx = RUN_PHASES.findIndex((p) => elapsedSec < p.endSec);
  return idx === -1 ? RUN_PHASES.length - 1 : idx;
}
