'use client';

import { useRef } from 'react';
import { Download, Upload, Volume2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/lib/hooks';
import { countdownDone, unlockAudio } from '@/lib/cues';
import { BottomNav, Stepper, Toggle } from '@/components/ui';
import { CardioIcon } from '@/components/RunTimer';
import { CloudBackup } from '@/components/CloudBackup';
import { CARDIO_LABEL } from '@/lib/run';
import type { ExerciseId, WorkoutSessionLog } from '@/lib/types';
import { EXERCISES } from '@/lib/workouts';

export default function SettingsPage() {
  const hydrated = useHydrated();
  const { settings, updateSettings, history, importHistory, setSwap } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);

  if (!hydrated) return <div className="min-h-dvh" />;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chest-run-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as WorkoutSessionLog[];
      if (!Array.isArray(data) || data.some((d) => !d.id || !d.date || !d.workoutType)) throw new Error('bad file');
      importHistory(data);
      alert(`Imported ${data.length} sessions.`);
    } catch {
      alert('That file is not a valid history export.');
    }
  };

  return (
    <main className="space-y-6 px-4 pt-6 pb-28">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Cloud backup</h2>
        <CloudBackup />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Program</h2>
        <Row label="Guided warm-up" hint="About 3 minutes before the first set">
          <Toggle label="Guided warm-up" checked={settings.warmupEnabled} onChange={(v) => updateSettings({ warmupEnabled: v })} />
        </Row>
        <Stepper
          label="Suggest a deload every (weeks)"
          value={settings.deloadEveryWeeks}
          onChange={(v) => updateSettings({ deloadEveryWeeks: Math.min(12, Math.max(4, Math.round(v))) })}
          min={4}
        />
        {Object.entries(settings.swaps).length > 0 && (
          <div className="space-y-2 rounded-2xl bg-zinc-900 p-4">
            <div className="text-sm font-medium">Active swaps</div>
            {Object.entries(settings.swaps).map(([from, to]) => (
              <div key={from} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 text-zinc-400">
                  {EXERCISES[from as ExerciseId].name} → <span className="text-zinc-100">{EXERCISES[to as ExerciseId].name}</span>
                </span>
                <button type="button" onClick={() => setSwap(from as ExerciseId, null)} className="text-xs text-emerald-400">
                  Undo
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Rest timer</h2>
        <Stepper
          label="Switch between superset exercises"
          value={settings.transitionSeconds}
          onChange={(v) => updateSettings({ transitionSeconds: Math.min(60, v) })}
          step={5}
          min={0}
          unit="s"
        />
        <Row label="Routine rest after each pair" hint="60s on superset 1, 45s on superset 2">
          <Toggle
            label="Routine rest"
            checked={settings.useRoutineRest}
            onChange={(v) => updateSettings({ useRoutineRest: v })}
          />
        </Row>
        {!settings.useRoutineRest && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[45, 60, 90].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateSettings({ restSeconds: s })}
                  className={`rounded-2xl py-4 text-lg font-bold ${
                    settings.restSeconds === s ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
            <Stepper
              label="Custom rest after each pair"
              value={settings.restSeconds}
              onChange={(v) => updateSettings({ restSeconds: Math.max(10, v) })}
              step={5}
              min={10}
              unit="s"
            />
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Cues</h2>
        <Row label="Sound" hint="Beeps at 3, 2, 1 and 0">
          <Toggle label="Sound" checked={settings.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
        </Row>
        <Row label="Vibration" hint="Not supported on iPhone Safari">
          <Toggle
            label="Vibration"
            checked={settings.vibrationEnabled}
            onChange={(v) => updateSettings({ vibrationEnabled: v })}
          />
        </Row>
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            countdownDone();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 font-medium text-zinc-300"
        >
          <Volume2 className="size-5" /> Test cue
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Cardio</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['run', 'bike'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => updateSettings({ defaultCardio: m })}
              className={`flex items-center justify-center gap-2 rounded-2xl py-4 font-bold ${
                settings.defaultCardio === m ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300'
              }`}
            >
              <CardioIcon mode={m} className="size-5" /> {CARDIO_LABEL[m].title}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">Offered first after strength. You can still pick the other one each session.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Goal</h2>
        <Stepper
          label="Sessions per week"
          value={settings.weeklyTarget}
          onChange={(v) => updateSettings({ weeklyTarget: Math.max(1, Math.round(v)) })}
          min={1}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Data</h2>
        <p className="text-sm text-zinc-500">
          {history.length} sessions on this device. Cloud backup above keeps them safe; a JSON export is an extra copy you
          keep yourself.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={exportData}
            className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 font-medium text-zinc-300"
          >
            <Download className="size-5" /> Export
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 font-medium text-zinc-300"
          >
            <Upload className="size-5" /> Import
          </button>
        </div>
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
      </section>

      <BottomNav />
    </main>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-zinc-900 p-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-zinc-500">{hint}</div>
      </div>
      {children}
    </div>
  );
}
