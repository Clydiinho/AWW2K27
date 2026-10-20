# STORY PLAN — scroll story after the hero (scenes 2–6)

Source video: `public/scroll animation.webm` (VP9 1920×1080/60, video-only). Everything here is
a plan — **no code written yet**. Byte totals below are ESTIMATES from 10-frame test encodes
(sharp: AVIF q50, WebP q78; see `tools/analyze/scenes.mjs`, `.cache/tier/`).

## a. Scene → chapter mapping

Five scenes remain for four chapters. **Default:**

| Chapter | Video content | t-range (s) | Dur. | Scroll height | Poster |
|---|---|---|---|---|---|
| 02 Inside the Watch | movement dive + skeleton + balance ring | 4.0–17.3 | 13.3 | 450vh | frame @ 4.0 |
| 03 The Event | explosion: dome off, movement out, case opens, dissolve | 17.3–27.0 | 9.7 | 350vh | frame @ 17.6 |
| 04 The World | globe forming + rings + Africa + fast zoom/landing | 27.0–36.0 | 9.0 | 330vh | frame @ 29.6 |
| 05 The Experience | Cape dusk tableau | 36.0–40.0 | 4.0 | 240vh | frame @ 36.2 |

Total story video 36 s mapped to ~1,370 vh of scroll after the hero (plus 100vh sticky canvas).
Rates stay between 0.55–0.65 s of film per 50 vh so fast beats don't feel stalled on slow scrub.

**Alternative** (only if copy defines 03 as "the launch"): 02 = movement (4.0–17.3);
03 = explosion + fast zoom as the event's "reveal" (17.3–27.0 + 34.0–36.0, reordered digest —
requires the two clips to be visually compatible across a cut they don't currently share);
04 = globe (27.0–34.0); 05 = Cape (36.0–40.0). NOT recommended: re-ordering sparkles
fx crossfade needs editorial help; the timeline is otherwise strictly chronological.
Default below stands.

## b. The SEAM (hero → story)

Today: hero bottom shows ScrollBadge over black LiquidEther; story frame t=4.0 is a warm-gold
bezel macro. Options compared:

| Option | What the visitor sees | Needs |
|---|---|---|
| A. Fixed first frame behind hero end (RECOMMENDED) | Hero's last 100vh sits on the exact story frame t=4.0 rendered as a still; scrolling begins and the still simply starts playing under the copy | the hero's background must swap from LiquidEther to the still (a later task; one line + image asset ~30 KB at 1280W); no crossfade needed because the still IS the first story frame |
| B. Crossfade between LiquidEther black and t=4.0 | Soft 400 ms blend on sticky enter | extra opacity keyframe; feels like a transition, less seamless than A |
| C. Hero background becomes the first frame (LiquidEther removed at story start) | The fluid keeps morphing until the story section reaches viewport | conflicting motion states inside the same scroll container; more JS |

Recommendation: **A**, executed as a follow-up task (hero.setBackground PosterFrame) — it can
reuse the frame we already ship for the story's own poster of 02. Until then the site stays
as-is today (approved hero was LiquidEther only) — worth confirming with the client copy owner.

## c. Frame sequence pipeline (ESTIMATES)

Samples: 10 evenly spaced frames per tier, encoded with sharp. AVG BYTES/FRAME measured:

| Tier / format | avg B/frame | min | max |
|---|---|---|---|
| 720×405 AVIF | 14,171 | 10,586 | 21,218 |
| 720×405 WebP | 22,218 | 14,670 | 32,910 |
| 1280×720 AVIF | 27,458 | 20,024 | 39,736 |
| 1280×720 WebP | 42,053 | 27,058 | 60,992 |

ESTIMATED totals for scenes 2–6 (36 s — scenes 2–6 only, at uniform fps):

| fps | WebP 720 | WebP 1280 | AVIF 720 | AVIF 1280 |
|---|---|---|---|---|
| 6 | 4.58 MB | 8.66 MB | 2.92 MB | 5.66 MB |
| 8 | 6.10 MB | 11.55 MB | 3.89 MB | 7.54 MB |
| 10 | 7.63 MB | 14.44 MB | 4.87 MB | 9.43 MB |
| 12 | 9.15 MB | 17.33 MB | 5.84 MB | 11.31 MB |

**Recommendation: AVIF at 8 fps uniform** → mobile 3.89 MB / desktop 7.54 MB, inside the 4 MB /
9 MB budgets with margin (288 frames each tier; average decoding budget ~8 ms/frame).
Frames are 16:9 both tiers; the sticky canvas letterboxes them.

**If the budget must go lower** (e.g. faster networks target): drop to 6 fps on near-static
spans (scene 6's 4 s tail; scene 4's stillest 31–33 s window): −0.8 MB mobile / −1.5 MB desktop.
Do not go below 6 fps — scene 5's fast zoom reads steppy even at 8.

## d. Phone crop (portrait)

With the canvas fit by height on a ~390×844 phone, the visible width of the 16:9 frame is
**~26% of frame width** (desktop cover keeps ~90%). Per-scene measured centroid and subject
size with recommendation:

| Scene | Centroid | Phone-visible? at centre | Recommended focus | Min visible width |
|---|---|---|---|---|
| 02 | 0.48–0.57 | macro is frame-filling; any 26% slice reads fine | follow centroid (0.50) | 26% |
| 03 | 0.47–0.51 | whole watch reads ~34% wide → bracelet edges cut on phone | keep centre; accept edge crop | 34% |
| 04 | 0.47–0.51 | globe reads ~45% wide → cut on phone | centre on globe centre | 45% |
| 05 | 0.52–0.54 | Peninsula top reads ~60% wide → cut on phone | centre on mountain peak (~0.52) | 45% |

Recommendation for phones: **`object-fit: contain`** on the mobile tier with `#050505`
letterbox bands (colour-matches the frame corners for chapters 02–04; chapter 05's teal
corners will show a small band mismatch — acceptable, or use `#0d1518` for that chapter's
band class only).

## e. Glass panel placement + contrast

Panel base: translucent gradient over `rgba(12,10,9,0.74)`, light border, **no blur**;
desktop-only adds `backdrop-filter: blur(16px)` with background alpha 0.50.
Worst-case column using the p95 cell behind the panel (row/col buckets from the 3×3 grids):

| Scene | Recommend side/offset (from empty dark space) | Worst cell | Contrast, phone α0.74 | Contrast, desktop α0.50 | <4.5? |
|---|---|---|---|---|---|
| 02 | right, centred (bezel macro fills left) | 8 (bottom-right) | 11.23 | 6.68 | no |
| 03 | left, bottom-offset (watch floats right) | 5 (centre-right) | 11.86 | 7.51 | no |
| 04 | left, centred (globe right of centre) | 0 (top-left) | 11.55 | 7.09 | no |
| 05 | right, bottom-offset (mountain top-left) | 2 (top-right) | 11.51 | 7.03 | no |
| (S5 window folded into 04) | bottom, centred | 0 | 12.36 | 8.23 | no |

**No scene falls under 4.5:1 with either preset** — panels are safe as specified. Caveat: the
estimate blends a single per-cell mean luma; locally the brightest bokeh cell could dip ~10%
below the table; if we ever push alpha below 0.50, re-check chapter 02 (worst case 6.68).

## f. Video fixes needed

| # | Time | Issue | Remedy | Serious? |
|---|---|---|---|---|
| 1 | 18.0–20.5 | glass dome lifts instead of flat crystal (storyboard says flat glass) | regenerate clip, or keep and adjust chapter-03 copy to describe a "crystal dome reveals" | Yes (brand copy accuracy) |
| 2 | 21.5–26.9 | explosion reads as movement slide + locket-style case swing, not a full layer stack liftoff | regenerate, or accept and rewrite copy ("the heart slides free") | No if copy adapts |
| 3 | 34.0–36.0 | fast "curving fly-in" generated as a 2 s warp streak, not a circling descent | regenerate a true fly-in; else accept (it reads as intentional warp) | No |
| 4 | 36.0–40.0 | storyboard's three rooms of light / lights gathering into a ring / dial reform are **missing** | generate 1 extra clip for chapter 05's reveal, or finish chapter 05 with a CSS-drawn gold ring + reform (transform/opacity only, budget-safe) | Yes (story completeness) |
| 5 | 22.0–23.0 | slight bracelet-bead softness mid-slide | leave; reads as depth-of-field | No |

Detector back-up: no freezes, no black frames, no flicker measured at any join.

## g. Loading + low-end

- **Never blocks the preloader.** Frames live in `public/story/**` and load **after the hero is
  visible** (post-`Preloader.onComplete`), in chapter-sized groups, with the second chapter's
  group requested at `requestIdleCallback` after first paint of the story canvas.
- **First group = scene 2's opening ~2s of frames (16 AVIFs at 8fps ≈ 222 KB desktop-tier).**
  The sticky canvas shows chapter 02's poster (frame @ 4.0) until the group lands.
- **Five poster stills** (32 KB–80 KB AVIF each, 1280W / 720W): frame @4.0, @17.6, @29.6,
  @34.1, @36.2. Poster mode conditions (no CPU/RAM gating): `prefers-reduced-motion: reduce`;
  `navigator.connection.saveData`; `effectiveType` in {2g, 3g}; measured throughput < 1.5 Mbps
  (1 sample transfer of the first group leaves <350 KB/s); canvas/WebGL unavailable. Poster
  mode = copy cards on `#050505` over the scene posters, scroll just works, `#chapter-02`
  anchor keeps working.
- **Confirmed: the frame pipeline requests no three.js, no models, no WASM** — scene assets
  are images drawn onto a 2D canvas (or `<img>`-only in poster mode). Total initial JS stays
  at today's sizes; story JS is a lazy chunk (est. <8 KB gz).

## h. Modules/files + build order (each with verify gate)

| Step | Files | Verify gate |
|---|---|---|
| 1 | `tools/story/encode.mjs` (ffmpeg + sharp pipeline: re-encode 8fps AVIF two tiers + 5 posters, write `public/story/manifest.js`) | manifest lists md5s + byte sizes; spot-open 10 frames |
| 2 | `scripts/verify-chunks.mjs`-style audit `-` no, **`tools/story/audit-manifest.mjs`** (no src/ code yet): budget check ≤9/≤4 MB | `node tools/story/audit-manifest.mjs` prints PASS |
| 3 | `src/story/story-runner.ts` + `src/story/use-frames.ts` (loader: groups, IdleCallback, poster conditions) + `src/story/StoryScroll.tsx` + `src/story/StoryScroll.css` (sticky canvas, `object-fit` per tier) | `npm run typecheck` && `npm run build` — JS budget: only ~+8 KB gz lazy chunk |
| 4 | `src/story/chapter-copy.ts` merges into `src/content/site.ts` — **placeholder copy until client text arrives** (verbatim rule forbids inventing final copy) | copy flagged `PLACEHOLDER`; no strings in JSX |
| 5 | Mount below `<HeroSection />` in `App.tsx`, behind the existing `#chapter-02` anchor | build + preview smoke; `?pp` unaffected |
| 6 | Reduced-motion + poster mode + prefers-data-saver paths | toggle DevTools emulation; poster mode byte-total == posters only |
| 7 | Real-phone checks via devtools device toolbar + one cable debug | Lighthouse first-load < 150 KB; manual: seam reads smooth |

## i. Risks / open questions (≤8, with recommended answer)

1. **Chapter 05's ending is missing from the film** (rooms, ring, dial reform) → regenerate one
   clip, or CSS-finish. *Recommended: CSS-finish first (budget-safe), regenerate later.*
2. **Dome vs flat crystal** (f1): copy says "crystal dome" or regenerate? *Recommended: adjust copy, cheaper.*
3. **The hero is LiquidEther, not video scene 1**; story plan assumes seam option A needs a
   later hero-backdrop swap — does the client want scene 1 imagery in the hero (static or the
   0–4 s clip)? *Recommended: keep LiquidEther now; swapping to the frame is a small task once approved.*
4. **AVIF decode on older Androids** ( >5 years old) can jank at 8 fps → poster mode covers
   2g/3g but not slow-CPU. *Recommended: keep 8 fps; poster mode is a good-enough fallback.*
5. **Scrub judder** at slow scroll (8 fps across 450vh) — motion steppiness. *Recommended:
   map scroll→ nearest frame; do not interpolate; readability beats smoothness.*
6. **Chapter copy does not exist yet** (site.ts has only chapter 01) — placeholders need
   replacing verbatim before launch. *Recommended: build with `PLACEHOLDER` flagged copy.*
7. **Repo weight**: the committed video is 118 MB; every re-encode round-trip adds history.
   *Recommended: keep raw source in `assets-source/` (gitignored) and only commit outputs.*
8. **`?pp` review controls and headers** — story scroll must respect `prefers-reduced-motion`
   like the preloader does. *Recommended: gate the sticky-canvas playback behind the same
   media query, poster mode below it.*

## Names for the frames (for the manifest)

`public/story/{mobile,desktop}/{02,03,04,05}/{frame,poster}-{NNN}.avif` + `manifest.js`
listing per-chapter `{tier, fps, w, h, first, last, poster}`. Frame numbering continues
across chapters to keep the mapping simple (no reset at chapter boundaries).
