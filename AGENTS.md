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
- No animation libraries, no three.js, no webfonts, no images,
  no analytics, no external requests.
- Animate only transform and opacity (plus stroke-dashoffset on the
  single progress arc). No SVG filters or blur on moving elements.

## 4. Tokens

All colours and fonts come from `src/styles/tokens.css`
(`--color-bg`, `--color-bg-glow`, `--color-bronze`, `--color-gold`,
`--color-ivory`, `--color-diamond`, `--font-display`).
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
  in `src/preloader/config.ts`).
- Env: node v25.6.0, npm 11.8.0. Build: JS 230.51 kB raw
  (71.90 kB gz), CSS 4.02 kB (1.43 kB gz), HTML 1.16 kB (0.63 kB gz).
