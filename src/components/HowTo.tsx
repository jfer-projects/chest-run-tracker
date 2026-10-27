import { AlertTriangle, Wind } from 'lucide-react';
import { HOW_TO } from '@/lib/instructions';
import type { ExerciseDefinition } from '@/lib/types';

/**
 * Full instructions for one exercise: set up, the movement step by step, common mistakes and breathing.
 * "Ways to level up" is separate and optional, so the basics are never buried under progression ideas.
 */
export function HowToDetails({ exercise, showLevelUp = true }: { exercise: ExerciseDefinition; showLevelUp?: boolean }) {
  const how = HOW_TO[exercise.id];
  return (
    <div className="space-y-4 text-sm text-zinc-200">
      <section>
        <h3 className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">Set up</h3>
        <ul className="space-y-1.5">
          {how.setup.map((line) => (
            <li key={line} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-500" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1.5 text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">The movement</h3>
        <ol className="space-y-2">
          {how.steps.map((line, i) => (
            <li key={line} className="flex gap-3">
              <span
                className="num flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-black text-emerald-300"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="pt-0.5">{line}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl bg-amber-500/8 p-3 ring-1 ring-amber-500/20">
        <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
          <AlertTriangle className="size-3.5" aria-hidden="true" /> Common mistakes
        </h3>
        <ul className="space-y-1.5">
          {how.mistakes.map((line) => (
            <li key={line} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <p className="flex gap-2.5 rounded-2xl bg-surface p-3 ring-1 ring-line">
        <Wind className="mt-0.5 size-4 shrink-0 text-sky-300" aria-hidden="true" /> {how.breathing}
      </p>

      <p className="rounded-xl bg-raised p-3 text-xs leading-relaxed text-muted">{exercise.anatomicalTip}</p>

      {showLevelUp && (
        <section>
          <h3 className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">Ways to level up</h3>
          <ol className="list-decimal space-y-0.5 pl-5 text-zinc-300">
            {exercise.progressions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
