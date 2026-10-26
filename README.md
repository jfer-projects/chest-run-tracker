# Chest & Run Companion

Mobile-first workout companion for an alternating home routine: Workout A / Workout B (~25 min, lower-chest focus with Perfect Pushups, a low bar and dumbbells) followed by a guided 20-minute run.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. To test on your phone, run `npm run dev -- -H 0.0.0.0` and open `http://<your-pc-ip>:3000` on the same Wi-Fi.

## Features

- **Dashboard**: next workout auto-alternates A/B, weekly progress ring (target 3/week), week streak, recent sessions, resume an in-progress session.
- **Strength player**: exercise demo frames, target muscle, form cues, anatomy tip, reps/weight steppers, auto rest timer (routine 60s/45s or custom) with 3-2-1-0 beeps and vibration, +15s/skip.
- **Run timer**: Warm-up 3 min, Zone 2 14 min, Push 2 min, Cool-down 1 min, with a color-coded segmented bar, phase ring, transition alerts, pause/resume/skip.
- **History**: 8-week bar chart, date-range and A/B filters, per-set reps and weights.
- **Settings**: rest mode, sound/vibration, weekly target, JSON export/import.

Everything is stored in `localStorage` (no account). Timers use timestamps, so they stay accurate across refreshes and background tabs, and the screen is kept awake during workouts where the browser supports it.

## Structure

```
src/lib/types.ts      data model
src/lib/workouts.ts   exercise + Workout A/B definitions
src/lib/run.ts        run phases
src/lib/store.ts      Zustand store (persisted)
src/lib/cues.ts       Web Audio tones + vibration
src/app/              routes: /, /workout/active, /history, /settings
src/components/       player, run timer, summary, shared UI
```

Exercise demo images come from the public-domain [free-exercise-db](https://github.com/yuhonas/free-exercise-db) and load at runtime. If they can't load, the demo panel is hidden.
