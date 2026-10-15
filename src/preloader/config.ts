// Preloader tuning constants (single source of truth for timing/geometry).
export const MIN_DURATION_MS = 4200; // Minimum visible sweep, honest floor.
export const MAX_WAIT_MS = 12000; // Failsafe: never trap a visitor past this.
export const HOLD_AFTER_100_MS = 600; // Hold at 100% before fading out.
export const FADE_OUT_MS = 700; // Fade-out duration for the whole overlay.
export const SPARKLE_MS = 750; // One diamond glint duration.
export const SPARKLE_LEAD_DEG = 4; // Sparkle fires this many degrees early.
export const BRAND_TEXT = "AWW2K27"; // Dial brand mark.
export const BRAND_Y = 158; // Brand baseline; move to clear pin/hand.
export const BRAND_SUB_TEXT = "AFRICA WATCH WEEK"; // Microline, set in the bottom half.
export const BRAND_SUB_Y = 242; // Microline baseline, below the centre pin.
export const SHOW_ONLY_ONCE_PER_SESSION = false; // Switched on later for return visits.
// Sparkle "fire" tints, kept out of tokens.css by spec.
export const SPARKLE_TINT_ROSE = "#ffd9e2"; // Pale rose offset glint.
export const SPARKLE_TINT_CYAN = "#d6f2ff"; // Pale cyan offset glint.
export const REVIEW_PARAM = "pp"; // Review-only freeze control (?pp=0..1), remove before launch.
