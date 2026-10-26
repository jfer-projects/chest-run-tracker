'use client';

import { useEffect, useId } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, Home, Minus, Plus, Settings, TrendingUp, X } from 'lucide-react';
import { tap } from '@/lib/cues';
import type { WorkoutType } from '@/lib/types';

const normalize = (p: string) => p.replace(/\/$/, '') || '/';

export function BottomNav() {
  const pathname = normalize(usePathname());
  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/history', label: 'History', icon: History },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-page/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-md px-2 pt-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="press flex min-h-12 flex-1 flex-col items-center gap-0.5 text-[11px] font-medium"
            >
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                  active ? 'bg-emerald-500/15 text-emerald-400' : 'text-muted'
                }`}
              >
                <Icon className="size-5.5" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={active ? 'text-zinc-100' : 'text-muted'}>{label}</span>
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
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#202024" strokeWidth={stroke} />
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
  compact = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  unit?: string;
  /** Tighter layout for the pinned logging bar (buttons stay 48px for easy tapping). */
  compact?: boolean;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.round(v * 10) / 10));
  const btn = `press flex shrink-0 items-center justify-center rounded-xl bg-raised text-zinc-100 active:bg-line ${
    compact ? 'size-12' : 'size-14'
  }`;
  return (
    <div className={`rounded-2xl bg-surface ring-1 ring-line ${compact ? 'p-2' : 'p-3'}`}>
      <div
        className={`text-center text-[11px] font-semibold tracking-wider text-muted uppercase ${compact ? 'mb-1' : 'mb-2'}`}
      >
        {label}
      </div>
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => {
            tap();
            set(value - step);
          }}
          className={btn}
        >
          <Minus className={compact ? 'size-5' : 'size-7'} />
        </button>
        <div className="flex min-w-0 items-baseline justify-center">
          <input
            type="number"
            inputMode="decimal"
            aria-label={label}
            value={value}
            onChange={(e) => set(Number(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className={`num h-11 bg-transparent text-center font-black text-white outline-none ${compact ? 'w-14 text-3xl' : 'w-16 text-4xl'}`}
          />
          {unit && <span className="-ml-1 text-sm text-muted">{unit}</span>}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => {
            tap();
            set(value + step);
          }}
          className={btn}
        >
          <Plus className={compact ? 'size-5' : 'size-7'} />
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
      onClick={() => {
        tap();
        onChange(!checked);
      }}
      className="press flex h-11 w-16 shrink-0 items-center justify-center"
    >
      <span className={`relative h-8 w-14 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-line'}`}>
        <span
          className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : ''}`}
        />
      </span>
    </button>
  );
}

/** Equal-width choice control: one option is always selected. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-2xl bg-surface p-1 ring-1 ring-line"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => {
            tap();
            onChange(o.id);
          }}
          className={`press min-h-11 rounded-xl px-2 text-sm font-semibold ${
            value === o.id ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const BADGE_COLORS: Record<WorkoutType, string> = {
  A: 'bg-emerald-500/15 text-emerald-400',
  B: 'bg-amber-500/15 text-amber-400',
  L: 'bg-violet-500/15 text-violet-400',
};

export function WorkoutBadge({ type, size = 'md' }: { type: WorkoutType; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'size-12 text-xl rounded-2xl' : size === 'sm' ? 'size-7 text-xs rounded-lg' : 'size-10 text-base rounded-xl';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center font-black ${dims} ${BADGE_COLORS[type]}`}>{type}</span>
  );
}

/** Bottom sheet for secondary actions. Closes on backdrop tap or Escape. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="animate-fade absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-sheet pb-safe relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-4 pt-3"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        <div className="mb-2 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="press flex size-11 items-center justify-center rounded-full bg-raised text-zinc-300"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SheetRow({
  icon,
  label,
  hint,
  onClick,
  danger = false,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`${onClick ? 'press' : ''} flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left ${danger ? 'text-rose-400' : 'text-zinc-100'}`}
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-rose-500/10' : 'bg-raised'}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      {trailing}
    </Tag>
  );
}
