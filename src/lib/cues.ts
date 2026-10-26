'use client';

import { useStore } from './store';

// Tones are synthesized with the Web Audio API so there are no sound assets to load or miss.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Must be called from a user gesture (e.g. Start button) so mobile browsers allow playback later. */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

function tone(freq: number, durationMs: number, delayMs = 0, volume = 0.3) {
  if (!useStore.getState().settings.soundEnabled) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const start = c.currentTime + delayMs / 1000;
  const end = start + durationMs / 1000;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

export function vibrate(pattern: number | number[]) {
  if (!useStore.getState().settings.vibrationEnabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
}

/** Tiny haptic acknowledgement for taps on steppers and toggles (no sound). */
export function tap() {
  vibrate(8);
}

/** Firmer haptic for logging a set. */
export function confirmTap() {
  vibrate(28);
}

/** 3-2-1 ticks. */
export function countdownTick() {
  tone(880, 120);
  vibrate(60);
}

/** Tempo metronome: soft ticks while lowering, a brighter one to press up. No vibration. */
export function tempoTick(accent: boolean) {
  tone(accent ? 1046 : 523, accent ? 90 : 60, 0, accent ? 0.22 : 0.12);
}

/** The zero / go signal at the end of a countdown. */
export function countdownDone() {
  tone(1320, 180);
  tone(1320, 320, 220);
  vibrate([200, 100, 200]);
}

/** Run phase transition alert. */
export function phaseChange() {
  tone(660, 150);
  tone(880, 150, 170);
  tone(1100, 300, 340);
  vibrate([300, 120, 300]);
}

export function sessionComplete() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 220, i * 160));
  vibrate([150, 80, 150, 80, 400]);
}
