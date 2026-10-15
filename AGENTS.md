# AGENTS.md — Africa Watch Week

## 1. Project

Vite + React + TypeScript. `npm run dev`, `npm run build`, `npm run typecheck` (`tsc --noEmit`).

## 2. Scope rule (this prompt)

Preloader only. No home page: no header, nav, chapters, site copy,
`src/content/site.ts`, routing, images, or 3D. After the preloader,
`App.tsx` renders only a plain dark placeholder.

## 3. Budgets

- Initial JavaScript under 100 KB gzipped.
- First-load transfer under 150 KB.
- No animation libraries, no three.js, no webfonts, no analytics,
  no external requests.
- One user-supplied photographic backdrop is allowed on the preloader
  only: `public/pexels-scottwebb-136721.jpg` (optimised to ~68 KB,
  1024px, q55) at 17% opacity over the black base. It counts toward
  the 150 KB transfer budget.
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
  and suppresses completion, for checking hand positions and sparkles.
- The "Replay preloader" button in `App.tsx` (marked TEMPORARY) remounts
  the preloader. No `?replay=1` needed.

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
- Dial realism pass: baguette hour markers in gold chatons with
  step-cut facets, 180-line brushed dial, gold baton minute track on a
  chapter step,   two-tone dauphine hand, ruled microline signature with
  diamond dots, bezel top-light sheen. Generated reference image was
  used as a visual target only (never saved into the repo).
- Passed diamonds keep a lingering champagne halo (gradient, opacity
  only) that breathes softly; static under reduced motion.
- Backdrop: user-supplied `public/pexels-scottwebb-136721.jpg`,
  optimised in place from 1.5 MB to ~68 KB (1024px, q55), rendered at
  17% opacity over black via `.pp-photo` (decorative, aria-hidden).
- Env: node v25.6.0, npm 11.8.0. Build: JS 230.51 kB raw
  (71.90 kB gz), CSS 4.02 kB (1.43 kB gz), HTML 1.16 kB (0.63 kB gz).
- Type: self-hosted `public/Griffiths.woff2` (3.3 kB, subset to
  `AWW2K7` + digits + `%`, converted from the supplied OTF whose full
  copy is kept outside the repo) via `@font-face`
  with `font-display: swap` plus a same-origin preload. `--font-display`
  (Griffiths) is used for the dial brand and the percentage numerals;
  `--font-sans` (system stack) is used for the microline. No webfonts
  or external requests.
