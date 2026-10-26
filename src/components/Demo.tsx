'use client';

import { useEffect, useRef, useState } from 'react';
import type { ExerciseDefinition } from '@/lib/types';

type DemoSource = 'video' | 'photos' | 'frames';

/** Shows the best available demo: video loop, then photo pair, then the bundled drawings. */
export function ExerciseDemo({ exercise, paused = false }: { exercise: ExerciseDefinition; paused?: boolean }) {
  const { media } = exercise;
  const sources: DemoSource[] = [
    ...(media.video ? (['video'] as const) : []),
    ...(media.photos ? (['photos'] as const) : []),
    'frames',
  ];
  const [index, setIndex] = useState(0);
  const source = sources[Math.min(index, sources.length - 1)];
  const fallBack = () => setIndex((i) => i + 1);
  // Credit belongs to the sourced media, not to the drawings.
  const credit = source !== 'frames' ? media.credit : undefined;

  return (
    <figure>
      {source === 'video' && <DemoVideo src={media.video!} badge={media.badge} paused={paused} onFail={fallBack} />}
      {source === 'photos' && (
        <DemoFrames frames={media.photos!} badge={media.badge} paused={paused} onFail={fallBack} dark />
      )}
      {source === 'frames' && <DemoFrames frames={media.frames} badge={media.badge} paused={paused} />}
      {credit && (
        <figcaption className="mt-1 text-right text-[11px] text-muted">
          {credit.url ? (
            <a href={credit.url} target="_blank" rel="noreferrer" className="underline">
              {credit.text}
            </a>
          ) : (
            credit.text
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** First still of an exercise's best available demo, for small thumbnails. */
export function demoThumb(exercise: ExerciseDefinition): { src: string; dark: boolean } {
  const photo = exercise.media.photos?.[0];
  return photo ? { src: photo, dark: true } : { src: exercise.media.frames[0], dark: false };
}

const BADGE = 'absolute top-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur';

function DemoVideo({ src, badge, paused, onFail }: { src: string; badge: string; paused: boolean; onFail: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (paused) v.pause();
    else void v.play().catch(() => {});
  }, [paused]);

  return (
    <div className="relative aspect-[11/5] overflow-hidden rounded-2xl bg-black ring-1 ring-line">
      <video
        ref={ref}
        src={src}
        autoPlay={!paused}
        muted
        loop
        playsInline
        preload="auto"
        onError={onFail}
        className="h-full w-full object-contain"
      />
      <span className={BADGE}>{badge}</span>
    </div>
  );
}

/** Alternates start/end position stills as a lightweight demo animation. */
function DemoFrames({
  frames,
  badge,
  paused,
  onFail,
  dark = false,
}: {
  frames: [string] | [string, string];
  badge: string;
  paused: boolean;
  onFail?: () => void;
  dark?: boolean;
}) {
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);
  const animated = frames.length > 1;
  useEffect(() => {
    if (paused || !animated) return;
    const id = window.setInterval(() => setFrame((f) => 1 - f), 1250);
    return () => window.clearInterval(id);
  }, [paused, animated]);

  // If a frame fails to load, hand off to the next source, or drop the demo rather than show a broken box.
  if (failed) return null;
  return (
    <div className={`relative aspect-[11/5] overflow-hidden rounded-2xl ring-1 ring-line ${dark ? 'bg-zinc-950' : 'bg-white'}`}>
      {frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === 0 ? 'Start position' : 'End position'}
          onError={() => (onFail ? onFail() : setFailed(true))}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${frame === i ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <span className={BADGE}>{badge}</span>
      {animated && (
        <div className="absolute right-2 bottom-2 flex gap-1.5 rounded-full bg-black/60 px-2 py-1" aria-hidden="true">
          {[0, 1].map((i) => (
            <span key={i} className={`h-1.5 w-4 rounded-full ${frame === i ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
