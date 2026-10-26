'use client';

import { useRef, useState } from 'react';
import { ChevronDown, Cloud, CloudOff, Download, Minus, Plus, Upload, Volume2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/lib/hooks';
import { countdownDone, tap, unlockAudio } from '@/lib/cues';
import { BottomNav, Segmented, Toggle } from '@/components/ui';
import { CloudBackup, useCloudSummary } from '@/components/CloudBackup';
import { CARDIO_LABEL } from '@/lib/run';
import type { CardioMode, ExerciseId, WorkoutSessionLog } from '@/lib/types';
import { EXERCISES } from '@/lib/workouts';

export default function SettingsPage() {
  const hydrated = useHydrated();
  const { settings, updateSettings, history, importHistory, setSwap } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [cloudOpen, setCloudOpen] = useState(false);
  const cloud = useCloudSummary();

  if (!hydrated) return <div className="min-h-dvh" />;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chest-run-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNote({ ok: true, text: `Exported ${history.length} sessions.` });
  };

  const onImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as WorkoutSessionLog[];
      if (!Array.isArray(data) || data.some((d) => !d.id || !d.date || !d.workoutType)) throw new Error('bad file');
      importHistory(data);
      setNote({ ok: true, text: `Imported ${data.length} sessions.` });
    } catch {
      setNote({ ok: false, text: 'That file is not a valid history export.' });
    }
  };

  const swaps = Object.entries(settings.swaps) as [ExerciseId, ExerciseId][];

  return (
    <main className="animate-rise space-y-5 px-4 pt-safe pb-28">
      <h1 className="text-2xl font-black tracking-tight">Settings</h1>

      <Group title="Cloud backup">
        <button
          type="button"
          onClick={() => setCloudOpen((o) => !o)}
          aria-expanded={cloudOpen}
          className="press flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left"
        >
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${cloud.ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/12 text-amber-300'}`}>
            {cloud.ok ? <Cloud className="size-5" aria-hidden="true" /> : <CloudOff className="size-5" aria-hidden="true" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{cloud.title}</span>
            <span className="block text-sm text-muted">{cloud.hint}</span>
          </span>
          <ChevronDown className={`size-5 shrink-0 text-muted transition-transform ${cloudOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {cloudOpen && <CloudBackup />}
      </Group>

      <Group title="Training">
        <Row label="Guided warm-up" hint="About 3 minutes before the first set">
          <Toggle label="Guided warm-up" checked={settings.warmupEnabled} onChange={(v) => updateSettings({ warmupEnabled: v })} />
        </Row>
        <StepperRow
          label="Weekly goal"
          hint="Chest sessions a week"
          value={settings.weeklyTarget}
          onChange={(v) => updateSettings({ weeklyTarget: Math.min(7, Math.max(1, Math.round(v))) })}
          min={1}
          max={7}
        />
        <StepperRow
          label="Deload every"
          hint="Weeks of hard training"
          value={settings.deloadEveryWeeks}
          onChange={(v) => updateSettings({ deloadEveryWeeks: Math.min(12, Math.max(4, Math.round(v))) })}
          min={4}
          max={12}
          unit="wk"
        />
        <Block label="Cardio after strength" hint="Offered first. You can still pick the other each session.">
          <Segmented
            label="Default cardio"
            value={settings.defaultCardio}
            onChange={(v: CardioMode) => updateSettings({ defaultCardio: v })}
            options={(['run', 'bike'] as const).map((m) => ({ id: m, label: CARDIO_LABEL[m].title }))}
          />
        </Block>
      </Group>

      <Group title="Rest">
        <StepperRow
          label="Switch within a pair"
          hint="Within a superset"
          value={settings.transitionSeconds}
          onChange={(v) => updateSettings({ transitionSeconds: Math.min(60, Math.max(0, v)) })}
          step={5}
          min={0}
          max={60}
          unit="s"
        />
        <Row label="Routine rest after each pair" hint="60s on superset 1, 45s on the rest">
          <Toggle label="Routine rest" checked={settings.useRoutineRest} onChange={(v) => updateSettings({ useRoutineRest: v })} />
        </Row>
        {!settings.useRoutineRest && (
          <StepperRow
            label="Rest after each pair"
            value={settings.restSeconds}
            onChange={(v) => updateSettings({ restSeconds: Math.min(300, Math.max(10, v)) })}
            step={5}
            min={10}
            max={300}
            unit="s"
          />
        )}
      </Group>

      <Group title="Alerts">
        <Row label="Sound" hint="Beeps at 3, 2, 1 and 0">
          <Toggle label="Sound" checked={settings.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
        </Row>
        <Row label="Vibration" hint="Not supported on iPhone Safari">
          <Toggle label="Vibration" checked={settings.vibrationEnabled} onChange={(v) => updateSettings({ vibrationEnabled: v })} />
        </Row>
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            countdownDone();
          }}
          className="press flex min-h-14 w-full items-center justify-center gap-2 font-semibold text-emerald-400"
        >
          <Volume2 className="size-5" aria-hidden="true" /> Test sound and vibration
        </button>
      </Group>

      {swaps.length > 0 && (
        <Group title="Exercise swaps">
          {swaps.map(([from, to]) => (
            <div key={from} className="flex min-h-14 items-center gap-3 px-4 py-2 text-sm">
              <span className="min-w-0 flex-1 text-zinc-300">
                {EXERCISES[from].name} <span className="text-muted">→</span> <span className="font-semibold text-zinc-100">{EXERCISES[to].name}</span>
              </span>
              <button type="button" onClick={() => setSwap(from, null)} className="press min-h-11 px-2 font-semibold text-emerald-400">
                Undo
              </button>
            </div>
          ))}
        </Group>
      )}

      <Group title="Your data">
        <p className="px-4 py-3 text-sm text-zinc-300">
          {history.length} {history.length === 1 ? 'session' : 'sessions'} on this device. Cloud backup keeps them safe; an export
          is an extra copy you keep yourself.
        </p>
        <div className="grid grid-cols-2">
          <button type="button" onClick={exportData} className="press flex min-h-14 items-center justify-center gap-2 font-semibold text-zinc-100">
            <Download className="size-5" aria-hidden="true" /> Export
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="press flex min-h-14 items-center justify-center gap-2 border-l border-line font-semibold text-zinc-100"
          >
            <Upload className="size-5" aria-hidden="true" /> Import
          </button>
        </div>
        {note && (
          <p role="status" className={`px-4 py-3 text-sm ${note.ok ? 'text-emerald-300' : 'text-rose-400'}`}>
            {note.text}
          </p>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onImport(file);
            e.target.value = '';
          }}
        />
      </Group>

      <BottomNav />
    </main>
  );
}

/** Related rows in one card, like a phone's settings list. */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold tracking-wider text-muted uppercase">{title}</h2>
      <div className="divide-y divide-line overflow-hidden rounded-2xl bg-surface ring-1 ring-line">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2">
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** A row whose control needs the full width underneath the label. */
function Block({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 px-4 py-3">
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function StepperRow({
  label,
  hint,
  value,
  onChange,
  step = 1,
  min,
  max,
  unit,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min: number;
  max: number;
  unit?: string;
}) {
  const btn = 'press flex size-11 items-center justify-center rounded-xl bg-raised text-zinc-100 ring-1 ring-line disabled:opacity-30';
  return (
    <Row label={label} hint={hint}>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => {
            tap();
            onChange(value - step);
          }}
          className={btn}
        >
          <Minus className="size-4" />
        </button>
        <span className="num w-12 text-center text-lg font-black">
          {value}
          {unit && <span className="ml-0.5 text-xs font-medium text-muted">{unit}</span>}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => {
            tap();
            onChange(value + step);
          }}
          className={btn}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </Row>
  );
}
