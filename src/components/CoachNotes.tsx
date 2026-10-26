'use client';

import { useState } from 'react';
import { ChevronDown, GraduationCap } from 'lucide-react';

const NOTES: { title: string; body: string }[] = [
  {
    title: 'Progress every week',
    body: 'Use double progression: once you hit the top of the rep range on every set, make it harder next time (slower lowering, pauses, deeper deficit, a band or backpack, or more weight). The "Last time" card on each exercise tells you when.',
  },
  {
    title: 'Leave 1-2 reps in the tank',
    body: 'Main sets should end 1-2 reps short of failure, rated "Solid". Save true failure for the finisher. Rating "Max" every set means the load is too heavy to progress yet.',
  },
  {
    title: 'Lower chest: angle plus squeeze',
    body: "Downward pressing (incline bar push-ups, bridge presses, dips) loads the lower fibers. Flyes and squeeze presses load the chest's squeezing job, which push-ups barely touch. You get both every session.",
  },
  {
    title: 'Visibility is body fat',
    body: 'Training builds the lower pec, but how sharp that bottom edge looks depends mostly on body fat. Nutrition and your run or ride matter as much as the push-ups. Track it here with monthly measurements and photos.',
  },
  {
    title: 'Deload every 6-8 weeks',
    body: 'A planned easy week (half the sets) lets joints and tendons catch up so the next block goes better. The app will suggest it.',
  },
  {
    title: 'Pain rules',
    body: 'Muscle burn is fine; sharp or joint pain is not. If the front of a shoulder pinches on deep push-ups or dips, use the Swap button for the shoulder-friendly version.',
  },
];

export function CoachNotes() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="rounded-3xl bg-surface p-4 ring-1 ring-line" aria-label="Coach notes">
      <h2 className="mb-1 flex items-center gap-2 font-bold">
        <GraduationCap className="size-5 text-emerald-400" aria-hidden="true" /> Coach notes
      </h2>
      <div className="divide-y divide-line">
        {NOTES.map((n, i) => (
          <div key={n.title}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="press flex min-h-12 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-zinc-100"
            >
              {n.title}
              <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${open === i ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {open === i && <p className="animate-fade pb-3 text-sm leading-relaxed text-zinc-300">{n.body}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
