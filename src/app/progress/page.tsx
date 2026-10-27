'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, Trash2, Trophy } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/lib/hooks';
import { EXERCISES, WORKOUTS } from '@/lib/workouts';
import { exerciseSeries } from '@/lib/stats';
import { formatDate } from '@/lib/format';
import { addPhoto, deletePhoto, listPhotos, type ProgressPhoto } from '@/lib/photos';
import { BottomNav, Segmented } from '@/components/ui';
import { CoachNotes } from '@/components/CoachNotes';
import { LineChart } from '@/components/LineChart';
import type { ExerciseId, Measurement } from '@/lib/types';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });

// Program order (chest first, then legs), including swap alternatives.
const PROGRAM_ORDER: ExerciseId[] = [
  ...new Set(
    (['A', 'B', 'L'] as const).flatMap((t) =>
      WORKOUTS[t].blocks.flatMap((b) => b.exercises).flatMap((id) => [id, ...(EXERCISES[id].swaps ?? [])]),
    ),
  ),
];

export default function ProgressPage() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="min-h-dvh" />;
  return (
    <>
    <main className="animate-rise space-y-4 px-4 pt-safe pb-28">
      <h1 className="text-2xl font-black tracking-tight">Progress</h1>
      <ExerciseProgress />
      <BodyTracking />
      <Photos />
      <CoachNotes />
    </main>
      <BottomNav />
    </>
  );
}

function ExerciseProgress() {
  const history = useStore((s) => s.history);
  const logged = PROGRAM_ORDER.filter((id) => history.some((h) => h.sets[id]?.some((s) => s?.completed)));
  const [id, setId] = useState<ExerciseId | null>(null);
  const [metric, setMetric] = useState<'best' | 'volume'>('best');
  const [showAll, setShowAll] = useState(false);
  const current = id && logged.includes(id) ? id : logged[0];

  if (!current) {
    return (
      <section className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
        Exercise charts and personal records show up after your first logged workout.
      </section>
    );
  }

  const ex = EXERCISES[current];
  const series = exerciseSeries(history, current);
  const seconds = ex.unit === 'seconds';
  // Weighted lifts chart the heaviest weight; bodyweight moves chart the best set's reps.
  const best = series.map((p) => ({ label: shortDate(p.date), t: Date.parse(p.date), value: ex.weighted ? p.bestWeight : p.bestReps }));
  const volume = series.map((p) => ({ label: shortDate(p.date), t: Date.parse(p.date), value: p.volume }));
  const bestUnit = ex.weighted ? ' lb' : seconds ? 's' : ' reps';
  const volumeUnit = ex.weighted ? ' lb' : seconds ? 's' : ' reps';
  const prReps = Math.max(...series.map((p) => p.bestReps));
  const prWeight = Math.max(...series.map((p) => p.bestWeight));
  const prVolume = Math.max(...series.map((p) => p.volume));

  return (
    <section className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
      <h2 className="font-bold">Exercises</h2>
      <select
        value={current}
        aria-label="Exercise"
        onChange={(e) => setId(e.target.value as ExerciseId)}
        className="min-h-12 w-full rounded-xl bg-raised px-3 text-zinc-100 ring-1 ring-line"
      >
        {logged.map((x) => (
          <option key={x} value={x}>
            {EXERCISES[x].name}
          </option>
        ))}
      </select>

      <div className={`grid gap-2 ${ex.weighted ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Pr label={seconds ? 'Longest hold' : 'Most reps'} value={`${prReps}${seconds ? 's' : ''}`} />
        {ex.weighted && <Pr label="Heaviest" value={prWeight ? `${prWeight} lb` : '–'} />}
        <Pr label="Best session" value={`${prVolume.toLocaleString()}${volumeUnit}`} />
      </div>

      <Segmented
        label="Chart"
        value={metric}
        onChange={setMetric}
        options={[
          { id: 'best', label: ex.weighted ? 'Heaviest weight' : seconds ? 'Longest hold' : 'Best set' },
          { id: 'volume', label: 'Session total' },
        ]}
      />
      <LineChart points={metric === 'best' ? best : volume} unit={metric === 'best' ? bestUnit : volumeUnit} />

      <div className="text-sm">
        {[...series]
          .reverse()
          .slice(0, showAll ? undefined : 5)
          .map((p) => (
            <div key={p.date} className="flex justify-between gap-3 border-b border-line py-2 text-zinc-300">
              <span className="shrink-0">{formatDate(p.date)}</span>
              <span className="num text-right text-zinc-200">
                best {p.bestReps}
                {seconds ? 's' : ''}
                {p.bestWeight ? ` @ ${p.bestWeight} lb` : ''} · total {p.volume.toLocaleString()}
              </span>
            </div>
          ))}
        {series.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAll((a) => !a)}
            className="press min-h-11 w-full text-sm font-semibold text-emerald-400"
          >
            {showAll ? 'Show fewer' : `Show all ${series.length} sessions`}
          </button>
        )}
      </div>
    </section>
  );
}

function Pr({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-raised p-3 text-center">
      <Trophy className="mx-auto mb-1 size-4 text-amber-400" aria-hidden="true" />
      <div className="num text-lg font-black">{value}</div>
      <div className="text-[10px] tracking-wider text-muted uppercase">{label}</div>
    </div>
  );
}

const BODY_FIELDS: { key: keyof Omit<Measurement, 'id' | 'date'>; label: string; unit: string }[] = [
  { key: 'weightLbs', label: 'Weight', unit: ' lb' },
  { key: 'chestIn', label: 'Chest', unit: '"' },
  { key: 'waistIn', label: 'Waist', unit: '"' },
];

function BodyTracking() {
  const { measurements: stored, addMeasurement, deleteMeasurement } = useStore();
  // Newest first for the list; the chart reverses it to oldest first.
  const measurements = [...stored].sort((a, b) => b.date.localeCompare(a.date));
  const [form, setForm] = useState({ weightLbs: '', chestIn: '', waistIn: '' });
  const [metric, setMetric] = useState<(typeof BODY_FIELDS)[number]['key']>('weightLbs');
  const field = BODY_FIELDS.find((f) => f.key === metric)!;
  const points = [...measurements]
    .reverse()
    .filter((m) => m[metric] !== undefined)
    .map((m) => ({ label: shortDate(m.date), t: Date.parse(m.date), value: m[metric] as number }));

  return (
    <section className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
      <h2 className="font-bold">Body</h2>
      <p className="text-sm text-muted">
        Measure monthly, same time of day. Chest: around the nipples, arms down. Waist: at the navel, relaxed.
      </p>
      <form
        className="grid grid-cols-3 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
          const entry = { weightLbs: num(form.weightLbs), chestIn: num(form.chestIn), waistIn: num(form.waistIn) };
          if (Object.values(entry).every((v) => v === undefined || Number.isNaN(v))) return;
          addMeasurement({ date: new Date().toISOString(), ...entry });
          setForm({ weightLbs: '', chestIn: '', waistIn: '' });
        }}
      >
        {BODY_FIELDS.map((f) => (
          <label key={f.key} className="text-xs text-muted">
            {f.label} ({f.unit.trim()})
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="mt-1 w-full rounded-xl bg-raised px-3 py-2.5 text-base text-zinc-100 ring-1 ring-line outline-none focus:ring-emerald-500"
            />
          </label>
        ))}
        <button type="submit" className="col-span-3 press min-h-12 rounded-xl bg-emerald-500 font-bold text-zinc-950">
          Log measurement
        </button>
      </form>

      {measurements.length > 0 && (
        <>
          <Segmented
            label="Measurement"
            value={metric}
            onChange={setMetric}
            options={BODY_FIELDS.map((f) => ({ id: f.key, label: f.label }))}
          />
          {points.length > 0 ? (
            <LineChart points={points} unit={field.unit} />
          ) : (
            <p className="text-sm text-muted">No {field.label.toLowerCase()} entries yet.</p>
          )}
          <div className="space-y-1 text-sm">
            {measurements.map((m) => (
              <div key={m.id} className="flex items-center gap-2 border-b border-line py-2 text-zinc-300">
                <span className="w-24 shrink-0">{formatDate(m.date)}</span>
                <span className="flex-1 text-zinc-200">
                  {BODY_FIELDS.filter((f) => m[f.key] !== undefined)
                    .map((f) => `${f.label} ${m[f.key]}${f.unit}`)
                    .join(' · ')}
                </span>
                <button
                  type="button"
                  aria-label={`Delete measurement from ${formatDate(m.date)}`}
                  onClick={() => deleteMeasurement(m.id)}
                  className="press -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Photos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urls = useMemo(() => new Map(photos.map((p) => [p.id, URL.createObjectURL(p.blob)])), [photos]);

  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  useEffect(() => {
    listPhotos().then(setPhotos).catch(() => setError('Photos are not available in this browser.'));
  }, []);

  return (
    <section className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
      <h2 className="font-bold">Photos</h2>
      <p className="text-sm text-muted">
        Monthly front and side photos, same lighting, are the honest way to judge the lower chest. These stay on this
        device only and are never uploaded.
      </p>
      <label className="press flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-raised font-semibold text-zinc-200 ring-1 ring-line">
        <Camera className="size-5" /> Add photo
        <input
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              await addPhoto(file);
              setPhotos(await listPhotos());
            } catch {
              setError('Could not save that photo.');
            }
          }}
        />
      </label>
      {error && <p className="text-sm text-amber-400">{error}</p>}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <button key={p.id} type="button" onClick={() => setViewing(p)} className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urls.get(p.id)} alt={`Progress photo ${formatDate(p.date)}`} className="aspect-[3/4] w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-[11px] text-zinc-100">{shortDate(p.date)}</span>
            </button>
          ))}
        </div>
      )}
      {viewing && (
        <div className="fixed inset-0 z-40 flex flex-col bg-page/95 p-4" onClick={() => setViewing(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls.get(viewing.id)} alt="Progress photo" className="min-h-0 flex-1 object-contain" />
          <div className="flex items-center justify-between pt-3 text-sm text-zinc-400">
            <span>{formatDate(viewing.date)}</span>
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirm('Delete this photo? It is only stored on this device.')) return;
                await deletePhoto(viewing.id);
                setViewing(null);
                setPhotos(await listPhotos());
              }}
              className="flex items-center gap-1 text-rose-400"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
