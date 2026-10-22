// Tunables for the hero reveal engine (src/hero/Reveal.tsx).
// Style constants live here so the effect can be re-balanced in one place.

// Lifetime of one particle, ms. Randomised ±15% per particle.
export const LIFE_MS = 3600;

// Pool size (desktop / phone). Zero per-frame allocation; phone gets fewer.
export const MAX_PARTICLES = 140;
export const MAX_PARTICLES_PHONE = 80;

// A median frame time over this during the 3 s sampling window counts as
// too slow: the canvas resolution drops once, and a second failure falls
// back to the static reveal.
export const FRAME_BUDGET_MS = 34;

// Brush radius range, as a fraction of the stage's shorter side. Increases
// from BRUSH_MIN while the pointer is being smoothed; BRUSH_MAX caps it.
export const BRUSH_MIN = 0.045;
export const BRUSH_MAX = 0.15;
// Scroll sweep brush radius (fraction of shorter side).
export const BRUSH_SCROLL = 0.14;

// Pointer position smoothing, per second. Larger = tighter tracking.
export const POINTER_SMOOTHING = 6;

// Spawn spacing along a stroke: spacing = radius × SPAWN_SPACING.
export const SPAWN_SPACING = 0.55;

// Hard cap of particles seeded per frame (shared by pointer, scroll, hint).
export const MAX_SPAWN_PER_FRAME = 14;

// One-time hint stroke duration, ms (starts ~350 ms after image decode).
export const HINT_MS = 2200;

// Canvas resolution multiplier applied when the frame-time sampler fails
// once (second failure falls back to static). 1 = full (dpr-capped) size.
export const CANVAS_QUALITY_STEP = 0.66;

// devicePixelRatio cap for the reveal canvas (cheap + still crisp).
export const MAX_CANVAS_DPR = 1.5;

// Sweep trajectory across the runway, in stage fractions: a slow diagonal
// S-curve from lower-left to upper-right, plus a gentle sinusoidal lift.
export function sweepPoint(p: number): { x: number; y: number } {
  const x = 0.12 + 0.76 * p;
  const y = 0.72 - 0.44 * p + 0.1 * Math.sin(4 * Math.PI * p);
  return { x, y };
}

// Runway length past the first viewport, in svh, that the reveal plays
// across (the hero section height becomes calc(100svh + runway)).
export const HERO_RUNWAY_SVH = 90;
