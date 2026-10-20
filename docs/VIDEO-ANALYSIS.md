# VIDEO ANALYSIS — `public/scroll animation.webm`

Analysis basis: ffmpeg/ffprobe 8.1.1 + sharp 0.34 dev-tooling; raw data in `.cache/analysis.csv`
(160 frames @ 4 fps, 160×90, threshold for "bright" = luma ≥ 0.45); contact sheets in
`assets-source/contact-sheets/`. The original (with its Opus stereo track) is preserved at
`assets-source/scroll-animation-source-with-audio.webm` (gitignored); the committed copy is
video-only (audio strip requested).

## 1. Technical probe

| Fact | Value |
|---|---|
| File / size | `public/scroll animation.webm` — 118.2 MB after audio strip (was 118.9 MB) |
| Codec / container | VP9 in WebM, encoder tag "Mediabunny v1.61.1" |
| Pixel format | yuv420p — **no alpha channel** |
| Resolution / frame rate | 1920×1080 @ 60 fps (constant) |
| Duration / frames | exactly 40.000 s, 2,400 frames |
| Bitrate | ~24.9 Mbps (format-level) |
| Keyframes | every 2.000 s (20 keyframes) — frame-accurate seeking OK |
| Audio | none (Opus stereo track removed as instructed; original kept in `assets-source/`) |

## 2. Measured (`.cache/analysis.csv`)

blackdetect: no hits. freezedetect (≥0.5 s): no hits. No black frames at any point.

**Colour/mean spikes + motion-energy regime shifts (candidate clip joins):**

| Time | Evidence | Reading | Confidence |
|---|---|---|---|
| ~9.3–9.7 s | soft dissolve (crystal reflections wipe through 0.12 corner-RGB jump @9.5) | in-shot dive transition hero→inside movement | medium |
| ~17.2–17.5 s | corner-RGB jump 0.25 @17.25, 0.13–0.19 through 17.75; motion 0.47→0.45 | fast zoom-out launch (no hard cut mask) | high |
| ~27.0 s | big golden-splash dissolve frame | globe-forming transition | high |
| ~33.4–34.5 s | blue halo enters behind Africa (brightens corners) then gold burst | fast-zoom launch | high |
| ~35.5–35.75 s | warp streak (motion blur) frame | disguised cut to the Cape aerial | high |

**Per-scene measured aggregates** (bright extents span 0–100% of width because gem-set
jewels/bokeh reach frame edges; centroid bounds are the useful signal):

| Scene | t-range | centroid (min–avg–max) | left-3rd p95 | right-3rd p95 | bottom-3rd p95 | corner RGB avg |
|---|---|---|---|---|---|---|
| S2 movement | 4.0–17.3 | 0.48–0.50–0.57 | 0.583 | 0.594 | 0.594 | warm gold 103/104/83 |
| S3 explosion | 17.3–27.0 | 0.47–0.48–0.51 | 0.565 | 0.536 | 0.531 | warm gold 99/98/85 |
| S4 globe | 27.0–34.0 | 0.47–0.49–0.51 | 0.626 | 0.438 | 0.426 | 85/84/74 |
| S5 fast zoom | 34.0–36.0 | 0.43–0.47–0.55 | 0.490 | 0.458 | 0.377 | 55/56/59 |
| S6 cape | 36.0–40.0 | 0.52–0.53–0.54 | 0.434 | 0.568 | 0.469 | teal 111/23/45 |

**Corner colours over the whole film:** R 3–141 avg 90, G 5–154 avg 83, B 4–132 avg 73.
The dark watch chapters sit near `#050505`; the Cape chapter corners are teal
(`#6f172d`-family split into warm city lights + turquoise sea). The page background must
stay `#050505` for chapters 02–04 and panels must carry their own base through 05.

## 3. Seen (from `assets-source/contact-sheets/sheet-1..2.jpg`, boundary strips 1–4)

Scene-by-scene vs the intended storyboard (MEASURED times align with what is listed above):

1. **The Dial (hero)** — 0–4.0 s. Slow push-in from full-watch floating (camera left of centre,
   watch right), gold dust sweep grows to a full sparkle orbit, ending close on the diamond-
   set bezel. Matches the storyboard's hero beat — will not be part of the scroll story.
   **MATCH.**
2. **The Movement** — 4.0–17.3 s. Macro on bezel/crown with gold bokeh (4–9 s), a soft dive
   through the crystal reflections (9.3–9.7), then a slow drift across the skeleton movement
   (10–17.3) settling on the diamond-set balance/tourbillon cage as a large bright ring
   filling the centre (mean luma hits 0.50). **MATCH.** No visible warping; gear forms clean.
3. **The Explosion** — 17.3–27.0 s. Fast zoom-out reveals the whole watch (17.3–17.9). Then
   a **glass dome** lifts off (18.0–20.5) — the storyboard specifies flat glass; **PARTLY**.
   The movement plate slides out (21.5–25.3) with bracelet links rising and staying idle,
   then the case ring opens locket-style (25.3–26.9) before dissolving into golden dust
   (26.9–27.0). Layers partially lift rather than full stack liftoff; **PARTLY.**
4. **The Globe** — 27.0–34.0 s. Golden dust implodes into a polished gold globe with slim
   rose-gold orbiting rings; Africa rotates into close-up (29–33.4) with star highlights,
   then a blue halo builds behind it (33.4–34.0). Africa is recognisable and well-shaped.
   **MATCH.**
5. **The Fast Zoom** — 34.0–36.0 s. Gold burst + blue glow, then a warp-blur streak
   (35.5) that lands on the Peninsula. The storyboard asks for a curving fly-in; what was
   generated is a fast warp transition (2 s) rather than a continuous curving descent.
   **PARTLY.**
6. **Cape Town gathering** — 36.0–40.0 s. A dusk aerial of the Cape Peninsula: flat-topped
   Table Mountain, turquoise sea, golden city lights glittering with bokeh, gentle god-rays.
   **MISMATCH for the storyboard's beat:** there are **no three passing rooms of light
   (Discover/Exchange/Connect), no lights-gather-into-ring, no dial reform** — the film ends
   statically on the Peninsula tableau (last 4 s are near-static, low energy).

Cosmetic flaws seen: none of text/letters, no melting, no flicker, no wrong shapes other
than the dome-vs-flat-crystal, and a very brief bracelet-link softness at ~22–23 s (still legible).

## 4. Site inspection (read-only)

- `App.tsx:13` — `<Preloader onComplete>` first; then `<SiteHeader />` + `<HeroSection />`.
  **Nothing exists below the hero today.**
- Hero = `min-height: 100svh`; behind its card is **LiquidEther** (React-Bits TS fluid sim,
  gold palette `#000000/#eab308/#000000`, dropped under `prefers-reduced-motion`), not the
  video's scene 1. So the hero is *symbolically* "the Dial" but is **not** yet backed by frame
  0–4.0 s imagery.
- `ScrollBadge` (`src/components/ScrollBadge.tsx`) — circular rotating "KEEP SCROLLING" badge,
  anchor href `#chapter-02` (target doesn't exist yet; a TODO comment marks it).
- `src/content/site.ts` — verbatim copy for Chapter 01 only + header + `scrollBadge`.
  Chapters 02–05 copy does **not** exist yet.
- `tokens.css` — `--color-bg #050505`, `--color-ivory #f1ebe0`, bronze/gold accents,
  Griffiths display + Outfit sans.
- Preloader contract (`src/preloader/progress.ts`): `registerTask(id, weight)` →
  `{ update(f), done() }`; `getRealProgress()` is a weighted mean; the preloader holds 99% and
  reveals only when real tasks finish. Any future story-frame preloading could register as a
  real task — but must **not** block the hero reveal (frames are behind the fold).
- **The SEAM, today:** the visitor's eye leaves the hero at the ScrollBadge over black LiquidEther.
  The story's first frame (t = 4.0 s) is a warm-gold diamond-bezel macro with bokeh — a close
  colour-family match to the hero's gold-on-black but a different texture. A direct hard cut
  would read as an abrupt jump; the recommended remedies are in STORY-PLAN.md §b.
- AGENTS.md rules that apply: ≤100 KB JS gz initial; ≤150 KB first-load; no external requests;
  transform/opacity-only animation; copy verbatim from `src/content/`; preloader tasks honest;
  reduced-motion must work; nothing 3D before a visitor chooses it (the frame-video plan keeps
  that trivially true — media only).
