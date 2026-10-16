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
  verbatim copy; `SiteHeader` (fixed, hairline rule) and
  `InvitationSection` (100svh hero, invitation body, colophon) in
  `src/components/`. Primary CTA scrolls to `#invitation`, secondary
  to `#colophon` (no 3D exists yet; honest scroll targets only).
- Hero backdrop: dependency-free raw-WebGL `LiquidMetalShader`
  (`src/components/LiquidMetalShader.tsx` + module CSS, adapted from a
  pasted shadcn-style snippet: no Tailwind, no `cn`/`@` alias, no
  lucide, no demo file)   tuned to bronze (`#141210`/`#9c7c4c`/`#d8b97a`, slow drift, starts
  mid-flow so the first and reduced-motion frames already show texture)
  under a legibility scrim; pauses offscreen, static under reduced
  motion, token fallback if WebGL is missing. Photo recompressed to
  896px (~57 KB); total first-load ~142.7 kB gz, JS ~74.8 kB gz.
