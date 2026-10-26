'use client';

import { useState } from 'react';
import { ChevronDown, GraduationCap } from 'lucide-react';

const NOTES: { title: string; body: string }[] = [
  {
    title: 'Progress every week',
    body: 'Use double progression: once you hit the top of the rep range on every set, make it harder next time (slower lowering, pauses, deeper deficit, a band or backpack, or more weight). The "last time" card on each exercise tells you when.',
  },
  {
    title: 'Leave 1-2 reps in the tank',
    body: 'Main sets should end 1-2 reps short of failure, logged as "Solid". Save true failure for the finisher. Logging "Max" every set means the load is too heavy to progress yet.',
  },
  {
    title: 'Lower chest: angle plus squeeze',
    body: 'Downward pressing (incline bar push-ups, bridge presses, dips) loads the lower fibers. Flyes and squeeze presses load the chest\'s squeezing job, which push-ups barely touch. You get both every session.',
  },
  {
    title: 'Visibility is body fat',
    body: 'Training builds the lower pec, but how sharp that bottom edge looks depends mostly on body fat. Nutrition and your run or ride matter as much as the push-ups. Track it in Progress with monthly measurements and photos.',
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
    <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        <GraduationCap className="size-5 text-emerald-400" /> Coach notes
      </h3>
      <div className="divide-y divide-zinc-800">
        {NOTES.map((n, i) => (
          <div key={n.title}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-zinc-200"
            >
              {n.title}
              <ChevronDown className={`size-4 text-zinc-500 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="pb-3 text-sm leading-relaxed text-zinc-400">{n.body}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
