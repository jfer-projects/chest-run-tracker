import type { ExerciseDefinition, ExerciseId, WorkoutTemplate, WorkoutType } from './types';

// Demo stills from the public-domain free-exercise-db project.
const IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const frames = (slug: string): [string, string] => [`${IMG}/${slug}/0.jpg`, `${IMG}/${slug}/1.jpg`];

export const EXERCISES: Record<ExerciseId, ExerciseDefinition> = {
  'perfect-pushup-deficit': {
    id: 'perfect-pushup-deficit',
    name: 'Perfect Pushup Deep Deficit Press',
    equipment: 'Perfect Pushups',
    targetMuscle: 'Lower Pec Shelf (Costal Head)',
    targetReps: '8-12',
    defaultRest: 60,
    unit: 'reps',
    weighted: false,
    formCues: [
      'Bottom: neutral grip, sink your chest 2 inches below the handles for a loaded stretch',
      'Top: rotate handles inward at top lockout, pinching the lower pecs',
      'Rigid plank, 3-second lowering',
    ],
    anatomicalTip: 'Internal rotation at full extension maximally shortens the costal/sternal pec fibers.',
    media: { frames: frames('Pushups'), badge: 'Lower Pec Shelf' },
  },
  'low-bar-inverted-row': {
    id: 'low-bar-inverted-row',
    name: 'Low-Bar Inverted Rows',
    equipment: 'Low Bar',
    targetMuscle: 'Upper Back & Rear Delts',
    targetReps: '8-12',
    defaultRest: 60,
    unit: 'reps',
    weighted: false,
    formCues: [
      'Hang under the bar, legs straight, heels driven into the floor',
      'Pull your sternum to the bar, pinch the shoulder blades',
      'Lower with control to full arm extension (bend knees to make it easier)',
    ],
    anatomicalTip: 'Scapular retraction balances all the pressing and opens up chest posture.',
    media: { frames: frames('Inverted_Row'), badge: 'Postural Antagonist' },
  },
  'incline-pushup-bar': {
    id: 'incline-pushup-bar',
    name: 'Incline Push-Ups on Low Bar',
    equipment: 'Low Bar',
    targetMuscle: 'Lower Chest (Dip Angle)',
    targetReps: '10-15',
    defaultRest: 45,
    unit: 'reps',
    weighted: false,
    formCues: [
      'Hands shoulder-width on the bar, body in a strict plank',
      'Lower the bottom of your sternum to touch the bar',
      'Press down and away, like the pressing line of a dip',
    ],
    anatomicalTip: 'Elevated hands mimic a chest-dip angle, loading the bottom border of the pec.',
    media: { frames: frames('Incline_Push-Up'), badge: 'Dip Angle Bias' },
  },
  'db-bicep-curl': {
    id: 'db-bicep-curl',
    name: 'Standing DB Bicep Curls',
    equipment: 'Dumbbells',
    targetMuscle: 'Biceps Brachii',
    targetReps: '10-12',
    defaultRest: 45,
    unit: 'reps',
    weighted: true,
    formCues: [
      'Elbows pinned to your ribs',
      'Turn pinkies up toward your shoulders at the top',
      '2 full seconds to lower, no swinging',
    ],
    anatomicalTip: 'Terminal supination maximizes activation of the biceps short head.',
    media: { frames: frames('Dumbbell_Bicep_Curl'), badge: 'Bicep Peak' },
  },
  'perfect-pushup-iso-hold': {
    id: 'perfect-pushup-iso-hold',
    name: 'Perfect Pushup Iso-Hold Burnout',
    equipment: 'Perfect Pushups',
    targetMuscle: 'Total Pec Exhaustion',
    targetReps: 'To failure',
    defaultRest: 0,
    unit: 'seconds',
    weighted: false,
    formCues: [
      'Hold 5s in the deep deficit stretch',
      'Push halfway up, hold 5s',
      'Lock out with maximum inward rotation squeeze, hold 5s',
      'Repeat the cycle until technical failure (hips sag or shoulders shrug)',
    ],
    anatomicalTip: 'Loaded isometrics under stretch drive high mechanical tension and fiber recruitment.',
    media: { frames: frames('Pushups'), badge: 'Metabolic Finisher' },
  },
  'glute-bridge-floor-press': {
    id: 'glute-bridge-floor-press',
    name: 'Glute-Bridge DB Floor Press',
    equipment: 'Dumbbells',
    targetMuscle: 'Lower / Sternal Pec Head',
    targetReps: '8-12',
    defaultRest: 60,
    unit: 'reps',
    weighted: true,
    formCues: [
      'Keep hips in a high bridge the whole set: it creates a ~20° decline',
      'Lower until triceps lightly brush the floor, pause',
      'Press up and slightly toward your hips; squeeze glutes, ribs down',
    ],
    anatomicalTip: 'The bridge angle mimics a decline bench press to emphasize the costal fibers.',
    // No library photo shows the bridge + DB press combo, so this uses a bundled illustration.
    media: {
      frames: ['/demos/glute-bridge-floor-press-0.svg', '/demos/glute-bridge-floor-press-1.svg'],
      badge: 'Decline Angle',
    },
  },
  'bent-over-db-row': {
    id: 'bent-over-db-row',
    name: 'Bent-Over DB Rows',
    equipment: 'Dumbbells',
    targetMuscle: 'Lats & Rhomboids',
    targetReps: '10-12',
    defaultRest: 60,
    unit: 'reps',
    weighted: true,
    formCues: [
      'Hinge at the hips, flat back, chest forward',
      'Pull the dumbbells toward your pockets, not your armpits',
      'Squeeze for 1 full second at the top',
    ],
    anatomicalTip: 'Pulling to the hip biases the lower lats for a wider V-taper.',
    media: { frames: frames('Bent_Over_Two-Dumbbell_Row'), badge: 'Back Density' },
  },
  'close-grip-perfect-pushup': {
    id: 'close-grip-perfect-pushup',
    name: 'Close-Grip Perfect Pushups',
    equipment: 'Perfect Pushups',
    targetMuscle: 'Inner Sternal Seam & Triceps',
    targetReps: '8-12',
    defaultRest: 45,
    unit: 'reps',
    weighted: false,
    formCues: [
      'Handles 6-8 inches apart',
      'Descend with elbows brushing your ribs',
      'Rotate handles inward at top lockout, crushing the inner chest together',
    ],
    anatomicalTip: 'A narrow grip plus the inward twist loads the inner sternal insertions.',
    media: { frames: frames('Close-Grip_Push-Up_off_of_a_Dumbbell'), badge: 'Inner Pec Seam' },
  },
  'overhead-db-tricep-ext': {
    id: 'overhead-db-tricep-ext',
    name: 'Overhead DB Triceps Extensions',
    equipment: 'Dumbbells',
    targetMuscle: 'Triceps Long Head',
    targetReps: '12-15',
    defaultRest: 45,
    unit: 'reps',
    weighted: true,
    formCues: [
      'One dumbbell overhead, both hands in a diamond grip',
      'Lower behind your head to ~90° at the elbow for a full stretch',
      'Extend fully without arching your lower back',
    ],
    anatomicalTip: 'Overhead position stretches the long head from its scapular attachment.',
    media: { frames: frames('Standing_Dumbbell_Triceps_Extension'), badge: 'Tricep Long Head' },
  },
  'bench-dips': {
    id: 'bench-dips',
    name: 'Chair / Bench Dips',
    equipment: 'Bodyweight',
    targetMuscle: 'Lower Pec / Triceps Burnout',
    targetReps: 'To failure',
    defaultRest: 0,
    unit: 'reps',
    weighted: false,
    formCues: [
      'Hands on the chair edge, legs extended forward',
      'Lower hips straight down until elbows hit 90°',
      'Drive palms down hard, pause 2 seconds at lockout',
    ],
    anatomicalTip: 'Downward shoulder extension gives a final burnout to the lower pec perimeter.',
    media: { frames: frames('Bench_Dips'), badge: 'Finisher Burnout' },
  },
};

export const WORKOUTS: Record<WorkoutType, WorkoutTemplate> = {
  A: {
    type: 'A',
    name: 'Workout A',
    subtitle: 'Rotating Deficit & Biceps',
    equipment: ['Perfect Pushups', 'Low bar (hip height)', 'Dumbbells'],
    blocks: [
      { id: 'a1', name: 'Superset 1', rounds: 4, exercises: ['perfect-pushup-deficit', 'low-bar-inverted-row'] },
      { id: 'a2', name: 'Superset 2', rounds: 3, exercises: ['incline-pushup-bar', 'db-bicep-curl'] },
      { id: 'a3', name: 'Finisher', rounds: 1, exercises: ['perfect-pushup-iso-hold'] },
    ],
  },
  B: {
    type: 'B',
    name: 'Workout B',
    subtitle: 'Bridge Decline & Triceps',
    equipment: ['Dumbbells', 'Perfect Pushups', 'Sturdy chair or bench'],
    blocks: [
      { id: 'b1', name: 'Superset 1', rounds: 4, exercises: ['glute-bridge-floor-press', 'bent-over-db-row'] },
      { id: 'b2', name: 'Superset 2', rounds: 3, exercises: ['close-grip-perfect-pushup', 'overhead-db-tricep-ext'] },
      { id: 'b3', name: 'Finisher', rounds: 1, exercises: ['bench-dips'] },
    ],
  },
};

export interface WorkoutStep {
  blockIndex: number;
  blockName: string;
  round: number;
  rounds: number;
  exerciseId: ExerciseId;
}

/** Flattens a template into the ordered list of sets the player walks through. */
export function buildSteps(type: WorkoutType): WorkoutStep[] {
  const steps: WorkoutStep[] = [];
  WORKOUTS[type].blocks.forEach((block, blockIndex) => {
    for (let round = 1; round <= block.rounds; round++) {
      for (const exerciseId of block.exercises) {
        steps.push({ blockIndex, blockName: block.name, round, rounds: block.rounds, exerciseId });
      }
    }
  });
  return steps;
}

/** Lower bound of a "8-12" style target, used as the default reps value. */
export function defaultReps(exercise: ExerciseDefinition): number {
  if (exercise.unit === 'seconds') return 30;
  const match = exercise.targetReps.match(/^(\d+)/);
  return match ? Number(match[1]) : 10;
}
