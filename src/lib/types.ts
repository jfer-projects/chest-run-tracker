export type ExerciseId =
  | 'perfect-pushup-deficit'
  | 'low-bar-inverted-row'
  | 'incline-pushup-bar'
  | 'db-bicep-curl'
  | 'perfect-pushup-iso-hold'
  | 'glute-bridge-floor-press'
  | 'bent-over-db-row'
  | 'close-grip-perfect-pushup'
  | 'overhead-db-tricep-ext'
  | 'bench-dips';

export type WorkoutType = 'A' | 'B';

export type Equipment = 'Perfect Pushups' | 'Low Bar' | 'Dumbbells' | 'Chair / Couch';

export interface SetLog {
  setNumber: number;
  targetReps: string; // e.g., "8-12"
  completedReps?: number; // seconds when the exercise unit is 'seconds'
  weightLbs?: number;
  completed: boolean;
}

export interface MediaCredit {
  text: string; // e.g. "Photo: Jane Doe / Pexels" or "AI-generated"
  url?: string;
}

export interface ExerciseMedia {
  /**
   * Preferred demo, in order: video loop, then photo pair, then the bundled drawings.
   * Anything that fails to load falls through to the next option.
   */
  video?: string;
  /** Start / end position photos (real or AI-generated) that alternate like the drawings, or one still. */
  photos?: [string] | [string, string];
  credit?: MediaCredit;
  /** Bundled drawings (scripts/generate-demos.mjs): the always-available fallback. */
  frames: [string, string];
  badge: string;
}

export interface ExerciseDefinition {
  id: ExerciseId;
  name: string;
  equipment: Equipment;
  /** Equipment setup reminder, e.g. which height to mount the doorway bar. */
  setup?: string;
  targetMuscle: string;
  formCues: string[];
  anatomicalTip: string;
  targetReps: string;
  /** Routine rest after this exercise, used unless a custom rest is set. */
  defaultRest: number;
  media: ExerciseMedia;
  /** What completedReps measures. Iso-holds are logged in seconds. */
  unit: 'reps' | 'seconds';
  /** Whether a dumbbell weight input is shown. */
  weighted: boolean;
}

export interface WorkoutBlock {
  id: string;
  name: string; // e.g., "Superset 1"
  rounds: number;
  exercises: ExerciseId[];
}

export interface WorkoutTemplate {
  type: WorkoutType;
  name: string;
  subtitle: string;
  equipment: string[];
  blocks: WorkoutBlock[];
}

export interface WorkoutSessionLog {
  id: string; // UUID
  date: string; // ISO String
  workoutType: WorkoutType;
  sets: Partial<Record<ExerciseId, SetLog[]>>;
  /** True when the 20-minute cardio block was completed (run or ride; name kept for saved data). */
  runCompleted: boolean;
  /** Which cardio was done. Missing on older logs, which were all runs. */
  cardioMode?: CardioMode;
  notes?: string;
  durationSeconds: number;
}

export type CardioMode = 'run' | 'bike';

export type RunPhaseId = 'warmup' | 'zone2' | 'push' | 'cooldown';

export interface RunPhase {
  id: RunPhaseId;
  label: string;
  cue: string;
  /** Peloton / indoor bike version of the cue. */
  bikeCue: string;
  startSec: number;
  endSec: number;
  color: string; // hex, used for rings/bars
}

export interface Settings {
  /** When true, rest follows each exercise's defaultRest (60s superset 1, 45s superset 2). */
  useRoutineRest: boolean;
  restSeconds: number;
  /** Quick switch between the two exercises of a superset pair. 0 = go straight to the next one. */
  transitionSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  weeklyTarget: number;
  /** Cardio offered first after strength; updates to whatever was last chosen. */
  defaultCardio: CardioMode;
}
