'use client';

import { useState } from 'react';

export interface ChartPoint {
  label: string; // shown in the tooltip, e.g. a date
  value: number;
  /** Epoch ms; when every point has one, x is spaced by real time instead of evenly. */
  t?: number;
}

// Validated against the zinc-950 surface (OKLCH L inside the dark band, >= 3:1 contrast).
const LINE = '#0ca678';
const SURFACE = '#18181b';

/** Single-series line chart: 2px line, 8px markers, recessive axis, hover/tap tooltip. */
export function LineChart({ points, unit, height = 150 }: { points: ChartPoint[]; unit: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length === 0) return null;

  const W = 320;
  const H = height;
  const pad = { l: 8, r: 8, t: 14, b: 22 };
  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const timed = points.every((p) => p.t !== undefined);
  const t0 = timed ? points[0].t! : 0;
  const span = timed ? points[points.length - 1].t! - t0 : 0;
  const x = (i: number) => {
    if (points.length === 1) return W / 2;
    const frac = timed && span > 0 ? (points[i].t! - t0) / span : i / (points.length - 1);
    return pad.l + frac * (W - pad.l - pad.r);
  };
  const y = (v: number) => pad.t + ((max - v) * (H - pad.t - pad.b)) / (max - min);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.value)}`).join(' ');

  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setHover(best);
  };

  const h = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Trend: ${points.map((p) => `${p.label} ${p.value}${unit}`).join(', ')}`}
      >
        {/* recessive gridlines at min and max */}
        {[max, min].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#27272a" strokeWidth="1" />
            <text x={W - pad.r} y={y(v) - 3} textAnchor="end" fontSize="10" fill="#71717a">
              {Number.isInteger(v) ? v : v.toFixed(1)}
              {unit}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#52525b" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={hover === i ? 5 : 4} fill={LINE} stroke={SURFACE} strokeWidth="2" />
        ))}
        <text x={pad.l} y={H - 6} fontSize="10" fill="#71717a">
          {points[0].label}
        </text>
        {points.length > 1 && (
          <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="10" fill="#71717a">
            {points[points.length - 1].label}
          </text>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs whitespace-nowrap text-zinc-100 shadow"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <span className="text-zinc-400">{h.label}:</span> {h.value}
          {unit}
        </div>
      )}
    </div>
  );
}
