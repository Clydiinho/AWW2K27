// Hero image tool tunables (image pipeline only — the runtime engine
// tunables live in src/hero/config.ts).
// Cover-crop focus point, in image fractions (0.5 = centred crop).
export const HERO_FOCUS_X = 0.5;
export const HERO_FOCUS_Y = 0.5;

// Output frame is 16:10 (width:height 1.6) at these widths.
export const HERO_WIDTHS = [720, 1280, 1920];
// AVIF byte budgets per width; webp must stay under 1.5x the avif.
export const HERO_BUDGETS = { 720: 70_000, 1280: 140_000, 1920: 260_000 };
