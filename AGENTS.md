# AGENTS.md — Africa Watch Week

## 1. Project

Vite + React + TypeScript. `npm run dev`, `npm run build`, `npm run typecheck` (`tsc --noEmit`).

## 2. Scope rule (Task 01)

Preloader (unchanged) followed by Chapter 01 landing: `SiteHeader`
plus `InvitationSection` (hero, invitation body, colophon), with all
editorial copy in the typed module `src/content/site.ts` (verbatim
client copy — no edits without sign-off). No other pages, no header
variants, no routing, no images beyond the preloader backdrop, no 3D.

## 3. Budgets

- Initial JavaScript under 100 KB gzipped.
- First-load transfer under 150 KB.
- No animation libraries, no three.js, no webfonts, no analytics,
  no external requests.
- One user-supplied photographic backdrop is allowed on the preloader
  only: `public/The-Zeitz-Museum-of-Contemporary-Art-Africa.jpg`
  (optimised to ~67 KB, 960px, q55) at 17% opacity over the black base.
  It counts toward the 150 KB transfer budget.
- Animate only transform and opacity (plus stroke-dashoffset on the
  single progress arc). No SVG filters or blur on moving elements.

## 4. Tokens

All colours and fonts come from `src/styles/tokens.css`
(`--color-bg`, `--color-bg-glow`, `--color-bronze`, `--color-gold`,
`--color-ivory`, `--color-diamond`, `--font-display` for the
self-hosted Griffiths brand face,   `--font-sans` for micro text, now the self-hosted Outfit cut
  (`public/outfit/Outfit-Regular.woff2`, subset to the ~40 glyphs
  the site uses; the supplied full family was pruned to this one file
  so it stays out of the transfer budget).
Sparkle tints live in `src/preloader/config.ts`.

## 5. Preloader contract

- `src/preloader/Preloader.tsx` exports `<Preloader onComplete={() => void} />`.
  After the fade-out it unmounts and calls `onComplete`.
- `src/preloader/progress.ts` exports
  `registerTask(id, weight): { update(f), done() }` and
  `getRealProgress(): number` (weighted 0 to 1).
- Later prompts register more real tasks (real images, etc.) through
  this same API. Displayed progress never exceeds real progress and
  holds at 99% until real tasks finish (failsafe `MAX_WAIT_MS`).
- The preloader never loads 3D assets: no 3D library, model, texture,
  or WASM. Prefetching or loading any of these from the preloader
  is forbidden.

## 6. Review-only controls (REMOVE BEFORE LAUNCH)

- `?pp=0..1` freezes the preloader at that progress (e.g. `?pp=0.25`)
  and suppresses completion, for checking hand position and reveal stage.
- The "Replay preloader" button was removed with the Task 01 placeholder;
  `?pp` is the remaining review control.
- `?story=poster` forces the poster fallback for the scroll story.
- `?review=1` shows the "DRAFT COPY" tag on the draft card (card 05
  only); nothing renders without the flag.
- `?buttons=hover` forces every CtaButton into its hovered look so the
  design can be checked on a touch device without hovering.

## 7. Accessibility

Dial wrapper is `role="progressbar"` with `aria-label`,
`aria-valuemin/max/now` (now in steps of 10). Decorative SVG is
`aria-hidden`. `prefers-reduced-motion` gets a fast plain variant
that still always finishes.

## 8. Final report format

Per section 8 of the task brief: real bundle sizes, list of files
created, and a "YOUR TURN" checklist. Then STOP (no home page).

## 9. Suggestions

Ideas beyond the brief go under "Suggestions" in the final report,
never into the code.

## 10. Decisions so far

- Preloader contract: `<Preloader onComplete>` in
  `src/preloader/Preloader.tsx`; `registerTask`/`getRealProgress` API
  in `src/preloader/progress.ts` (tasks: `window-load`, `fonts-ready`).
- Review-only controls to remove before launch: "Replay preloader"
  button in `App.tsx` and the `?pp=0..1` freeze param.
- Rule: the preloader never loads 3D assets (no library, model,
  texture, or WASM).
- Brand text on the dial: `AWW2K27` (`BRAND_TEXT`, baseline `BRAND_Y`
  in `src/preloader/config.ts`) in solid ivory, tighter tracking, bold,
  plus microline `AFRICA WATCH WEEK` (`BRAND_SUB_TEXT`, bold, set in
  the bottom half at `BRAND_SUB_Y`).
  Bezel is a dark diamond-set band with champagne hairlines (no gold disc).
  (Superseded by the line-art refinement above — dial carries no text
  or diamonds now; kept as history.)
- Dial realism pass: baguette hour markers in gold chatons with
  step-cut facets, 180-line brushed dial, gold baton minute track on a
  chapter step,   two-tone dauphine hand, ruled microline signature with
  diamond dots, bezel top-light sheen. Generated reference image was
  used as a visual target only (never saved into the repo).
  (Superseded by the line-art refinement above; kept as history.)
- Passed diamonds keep a lingering champagne halo (gradient, opacity
  only) that breathes softly; static under reduced motion.
- Line-art dial refinement (replaces the jeweled dial): three thin
  champagne outlines, 12 line markers, needle long hand + static short
  hand + pivot dot. No diamonds, text, or gradients. The hand angle
  drives illumination directly via refs (lit ring arcs, per-marker
  opacity, 20° beam edge); passed lines stay lit. Reduced motion shows
  the finished dial statically. `BEAM_DEG` in `config.ts`.
- Backdrop: user-supplied `public/pexels-scottwebb-136721.jpg`,
  optimised in place from 1.5 MB to ~68 KB (1024px, q55), rendered at
  17% opacity over black via `.pp-photo` (decorative, aria-hidden).
  (Replaced by the Zeitz backdrop below; kept as history.)
- Backdrop: user-supplied `public/The-Zeitz-Museum-of-Contemporary-Art-Africa.jpg`
  (optimised to ~67 KB, 960px, q55) at 17% opacity over the black base
  via `.pp-photo` (decorative, aria-hidden). The pexels file was removed.
- Reference render `public/assets/generated/watch-dial-reference.png`
  (83 KB) is design-only and never loaded by the app or its CSS.
- Env: node v25.6.0, npm 11.8.0. Build: JS 228.29 kB raw
  (69.28 kB gz), CSS 8.09 kB (2.17 kB gz), HTML 1.47 kB (0.72 kB gz).
- Type: self-hosted `public/Griffiths.woff2` (8.3 kB, subset to
  brand + numerals + Chapter 01 headline/tagline glyphs) and
  `public/outfit/Outfit-Regular.woff2` (9.4 kB, subset to the glyphs
  the site uses; `·`/`—` fall back per-glyph to system sans) via
  `@font-face` with `font-display: swap` plus same-origin preloads.
  `--font-display` (Griffiths) is used for the dial brand,
  percentage numerals and the "AFRICA WATCH WEEK" run of the Chapter 01
  headline; `--font-sans` (Outfit) is used for the "WELCOME TO" lead
  (600), tagline (400 italic), header, body, buttons, credit
  and microline. Non-400 Outfit weights render synthesised until a
  Bold cut is supplied. No webfonts or external requests.
- Task 01 (Chapter 01 landing): `src/content/site.ts` holds all
  verbatim copy for the coming hero content; post-preloader currently
  renders only the empty `HeroSection` (`src/components/HeroSection.tsx`)
  carrying the GhostCursor backdrop. (The earlier header/invitation/
  colophon pass was removed per direction; its files were deleted.)
- Hero effect: `LiquidEther` (`src/components/LiquidEther.tsx` + CSS,
  React-Bits fluid sim taken from the official TS registry as-is — only
  `"use client"` dropped; no new deps) with the specified gold palette
  (`#000000`/`#eab308`/`#000000`, auto-demo on), rendered only when
  reduced motion is off; pauses offscreen, token fallback if WebGL2 is
  missing. Verified live via CDP (auto-demo flow renders in brand gold).
  Photo recompressed to 896px (~57 KB); total first-load ~146.4 kB gz,
  JS ~78.7 kB gz.
- Story scroll animation rebuilt on the user-supplied JPG sequence
  (`public/scroll animation/`, ezgif 273 × 1920×1080 frames of the full
  0–40 s timeline; re-encoded to desktop 960×540 / mobile 576×324 JPGs,
  245 frames, 6.59 MB + 3.33 MB). Chapters 02 29–118, 03 119–184,
  04 185–245, 05 246–273 (calibrated to the 4.0/17.3/27.0/36.0 s cuts);
  frames 1–28 (watch beauty shot) reserved, not encoded. Frames are the
  unconditional default: no auto poster fallback (reduced-motion still
  scrubs — scroll-driven, nearest frame, no interpolation); posters only
  via the review-only `?story=poster` and while a chapter decodes.
  `public/scroll animation.webm` and the assets-source video backup were
  deleted per user instruction, and "Africa Watch Week Site Remix/"
  removed.
- Card sizing is content-driven (no fixed heights, no vh heights, no
  clipping/scrollbars): one base font on `.story-panel`
  (`clamp(0.9375rem, 0.86rem + 0.35vw, 1.0625rem)`), everything inside
  in em/ch (`padding 1.5em`, gaps 1em, radius 1.75em, headline
  `clamp(1.9em, 1.5em + 0.8vw, 2.6em)`, eyebrow 0.75em), width follows
  text (`inline-size: fit-content`, clamp to `min(100% - 2rem,
  var(--panel-max))` with 36rem default, 30rem for card 05, 58ch
  paragraph measure). Long-copy cards 02/03/04 sit in normal flow
  (`.story-panel--flow`) so the visitor scrolls through the text over
  the pinned canvas; only short card 05 stays sticky pinned.
  Cards get a pointer-driven 3D hover tilt (rotateX/rotateY ≤ 4° + scale
  1.045 through CSS vars on an inner `.story-panel-tilt` layer,
  transform-only, reduced-motion/ coarse-pointer off).
- CtaButton contract (`src/components/CtaButton.tsx` + `.css`): props
  `label / href / variant ("primary"|"ghost") / disabled`; renders an
  `<a>` (anchor scroll); the label shows WITHOUT the trailing " →" (the
  arrow is an aria-hidden inline SVG pair; site.ts keeps the full
  string). Hover/focus animations are transform/opacity only, inside
  `@media (hover: hover) and (pointer: fine)` plus `:focus-visible`
  (2px bronze outline offset 3px): scaleX fill sweep 450ms, two-copy
  text roll 450ms +40ms stagger, arrow shot-through 450ms, one-skew
  diamond glint 700ms, `:active` scale 0.98 (120ms), `will-change` only
  while hovering. Reduced motion: instant filled state, no roll/glint.
  Touch devices: press scale on `:active` and the glint plays once via
  a per-button IntersectionObserver on first scroll-into-view.
  `?buttons=hover` forces the hovered look (review-only).
- Card 05 is DRAFT copy (built only from the client's own phrases,
  `draft: true` in `src/content/site.ts`): rooms "01 / DISCOVER",
  "02 / EXCHANGE", "03 / CONNECT", no button. DRAFT tag renders only
  with `?review=1`. Open questions live in `docs/BRIEF.md` (real
  Chapter 05 copy; final call to action; may the closing line appear
  twice — it is currently on both card 03 and card 05).
- Frame loading is contiguous-front-first: 5 independent worker lanes
  each take the LOWEST frame index that is neither loaded nor in
  flight, so a hung/stalled request caps the loaded-set gap at
  lane-count frames (the 199→249 jump was unbounded lane skew); per
  frame 3 retries with 15s AbortController timeout; nearest-loaded
  frame fallback still bridges. Verified by request-order log (strict
  front-first waves) and deep-zone screenshots playing.
