# Chest & Run Companion

Mobile-first workout companion for an alternating home routine: Workout A / Workout B (~25 min, lower-chest focus with Perfect Pushups, a low bar and dumbbells) followed by a guided 20-minute run.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. To test on your phone, run `npm run dev -- -H 0.0.0.0` and open `http://<your-pc-ip>:3000` on the same Wi-Fi.

## Program

- **Workout A / B** (alternating, 3x/week, chest focus with lower-chest bias): two antagonist supersets, a squeeze-focused third superset (floor flyes + band pull-aparts in A; bridge squeeze press + chin-ups in B), then a finisher.
- **Leg Day** (separate and optional): goblet squat + DB RDL, Bulgarian split squat + calf raise, wall-sit finisher. It doesn't affect the A/B rotation, weekly target, or streak.
- Every session starts with an optional ~3 minute guided warm-up.
- **Progression**: each set shows a personal rep target from last session that adapts to what you actually log today, plus a nudge to progress (with a per-exercise ladder of harder variations) once you hit the top of the range.
- **Swaps** for shoulder-friendly or easier alternatives stick until you swap back; **deload weeks** (half the sets) are suggested every 7 weeks.
- **Instructions for every exercise** (`src/lib/instructions.ts`): set up, the movement step by step, common mistakes and breathing. They open automatically the first time you meet an exercise, and are one tap away after that. Level-up ideas are listed separately.
- **Doorway bar at its lowest setting is about waist height**, so the incline push-up uses tempo and pauses to compensate, and a chair version (lower surface, harder angle) is offered as the swap.
- **Warm-up timer can be paused**, and during rest you can open a full preview of the next exercise without stopping the countdown.

## Features

- **Home**: next workout auto-alternates A/B with Start right on the first screen, Mon-Sun week strip (goal 3 chest sessions/week), week streak, optional Leg Day, recent sessions, resume an in-progress session.
- **Strength player**: demo, personal rep target that adapts to what you log, last-time card, key form cue (more behind a tap), pinned reps/weight steppers, full-screen rest with next-exercise preview and 3-2-1-0 beeps and vibration.
- **Run timer**: Warm-up 3 min, Zone 2 14 min, Push 2 min, Cool-down 1 min, with a color-coded segmented bar, phase ring, transition alerts, pause/resume/skip.
- **History**: month calendar (tap a day), A/B/Legs filter, per-set reps and weights.
- **Settings**: rest mode, sound/vibration, weekly target, JSON export/import.

Everything is stored in `localStorage` first, so the app works offline. Signing in (Settings → Cloud backup, using a MealApp account) syncs history and settings to the MealApp Supabase project's `chestrun_sessions` / `chestrun_settings` tables, which are row-level-secured per user. Sync runs on sign-in, after each change, when the app regains focus, and when the device comes back online. Deletions sync as tombstones so they don't reappear from another device. Timers use timestamps, so they stay accurate across refreshes and background tabs, and the screen is kept awake during workouts where the browser supports it.

## Design notes

Designed for use mid-workout: sweaty hands, glancing at a phone propped on the floor.

- **Glanceable workout screen:** pair label (1A / 1B), big rep target and last-time card first, then the demo and one key cue. Everything else (more cues, tips, ways to level up) is one tap away. Rare actions (tempo beeps, skip, finish, discard) live behind the ... menu.
- **Logging is pinned:** reps and weight steppers and Complete set sit at the bottom, in thumb reach. How a set felt (Easy / Solid / Max) is rated on the rest screen, where it also updates the next target.
- **Rest is preparation:** full-screen countdown plus the next exercise (picture, target, last time), and Edit to fix a mis-tapped set.
- **Tokens** live in `src/app/globals.css` (`@theme`): `page < surface < raised < line` for surfaces and a `muted` text colour that keeps at least 5:1 contrast (6.2:1 on the page). Do not use `zinc-500` or darker for text.
- **Tap targets are at least 44 px**, everything interactive has an accessible name, timers use `role="timer"`, animations respect `prefers-reduced-motion`, and taps give a short haptic.
- **Safe areas:** `pt-safe`, `pb-safe` and friends use `--sat` / `--sab`, which take the larger of the browser's `env()` insets and the ones the Android app injects.

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

## Equipment rules

The plan targets the lower chest ("bottom cuff": costal and lower sternal pec fibers) using only Perfect Pushup rotating handles, a doorway bar (waist or thigh height), a pair of dumbbells, and a chair/couch. No benches, cables, dip stations, barbells, or machines. That includes the demos.

Exercise demos are two-frame illustrations in `public/demos`, generated by `node scripts/generate-demos.mjs`. Edit the poses there and re-run to change them. Push-up demos include a top-down inset showing the handles going from neutral to turned in.
