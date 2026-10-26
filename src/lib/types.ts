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

export type Equipment = 'Perfect Pushups' | 'Low Bar' | 'Dumbbells' | 'Bodyweight';

export interface SetLog {
  setNumber: number;
  targetReps: string; // e.g., "8-12"
  completedReps?: number; // seconds when the exercise unit is 'seconds'
  weightLbs?: number;
  completed: boolean;
}

export interface ExerciseMedia {
  /** Two still frames (start / end position) that alternate as a simple demo animation. */
  frames: [string, string];
  badge: string;
}

export interface ExerciseDefinition {
  id: ExerciseId;
  name: string;
  equipment: Equipment;
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
  runCompleted: boolean;
  notes?: string;
  durationSeconds: number;
}

export type RunPhaseId = 'warmup' | 'zone2' | 'push' | 'cooldown';

export interface RunPhase {
  id: RunPhaseId;
  label: string;
  cue: string;
  startSec: number;
  endSec: number;
  color: string; // hex, used for rings/bars
}

export interface Settings {
  /** When true, rest follows each exercise's defaultRest (60s superset 1, 45s superset 2). */
  useRoutineRest: boolean;
  restSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  weeklyTarget: number;
}
