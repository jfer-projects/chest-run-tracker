'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, Home, Minus, Plus, Settings, TrendingUp } from 'lucide-react';
import type { WorkoutType } from '@/lib/types';

export function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/history', label: 'History', icon: History },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 pt-3 text-xs font-medium ${
                active ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              <Icon className="size-6" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 12,
  color = '#10b981',
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 300ms linear, stroke 300ms' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  unit?: string;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.round(v * 10) / 10));
  return (
    <div className="rounded-2xl bg-zinc-900 p-3">
      <div className="mb-2 text-center text-xs font-semibold tracking-wider text-zinc-400 uppercase">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => set(value - step)}
          className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-100 active:scale-95 active:bg-zinc-700"
        >
          <Minus className="size-7" />
        </button>
        <div className="flex min-w-0 items-baseline justify-center">
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => set(Number(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className="w-16 bg-transparent text-center text-4xl font-bold text-white outline-none"
          />
          {unit && <span className="text-sm text-zinc-500">{unit}</span>}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => set(value + step)}
          className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-100 active:scale-95 active:bg-zinc-700"
        >
          <Plus className="size-7" />
        </button>
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-zinc-700'}`}
    >
      <span
        className={`absolute top-1 left-1 size-6 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : ''}`}
      />
    </button>
  );
}

const BADGE_COLORS: Record<WorkoutType, string> = {
  A: 'bg-emerald-500/15 text-emerald-400',
  B: 'bg-amber-500/15 text-amber-400',
  L: 'bg-violet-500/15 text-violet-400',
};

export function WorkoutBadge({ type }: { type: WorkoutType }) {
  return (
    <span
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-base font-black ${BADGE_COLORS[type]}`}
    >
      {type}
    </span>
  );
}
