import type { ChapterRuntime, StoryManifest } from "./use-frames";

export interface RunnerOptions {
  section: HTMLElement;
  canvas: HTMLCanvasElement;
  state: () => { mode: string; manifest: StoryManifest | null; chapters: Record<string, ChapterRuntime> };
  onActive: (chId: string | null) => void;
  onStory?: (progress: number) => void;
  ensure?: (chId: string) => void;
}

// Scroll-driven frame player. Maps scroll position to the NEAREST frame of the
// active chapter (no interpolation). Canvas draws only; CSS handles everything else.
export function createRunner({ section, canvas, state, onActive, onStory, ensure }: RunnerOptions) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return { start: () => {}, stop: () => {} };
  const g2d = ctx; // narrowed context for TS

  let raf = 0;
  let scrollRaf = 0;
  let dirty = true;
  let running = false;
  let activeId: string | null = null;

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    dirty = true;
  };

  const chapterEl = (id: string) => section.querySelector<HTMLElement>(`[data-chapter="${id}"]`);

  function draw() {
    const s = state();
    const m = s.manifest;
    if (!m || !activeId) return;
    const ch = s.chapters[activeId];
    if (!ch) return;
    const vh = window.innerHeight;
    const el = chapterEl(ch.id);
    if (!el) return;
    // chapter bounds in DOCUMENT space (el.offsetTop is only valid relative
    // to its positioned ancestor, not the window)
    const y = window.scrollY;
    const top = el.getBoundingClientRect().top + y;
    const height = el.offsetHeight;
    // continuous chained mapping: each chapter scrubs from (pin or top-vh)
    // up to top + height - vh, so chapter N's last frame flows straight into
    // chapter N+1's first frame with no static gap
    const pin = section.getBoundingClientRect().top + y;
    const anchor = Math.max(top - vh, pin);
    const span = Math.max(1, top + height - vh - anchor);
    const p = Math.max(0, Math.min(1, (y - anchor) / span));
    const frame = ch.firstFrame + Math.round(p * (ch.frameCount - 1));
    const band = ch.id === "05" ? m.bands.chapter05 : m.bands.chapters02to04;
    let src: CanvasImageSource | null = null;
    if (ch.ready || ch.bitmaps.size) {
      // nearest loaded frame: while a chapter streams in, play from the
      // partial set instead of freezing on the poster
      let n: number | undefined;
      for (let k = frame; k >= ch.firstFrame && n === undefined; k--) n = ch.bitmaps.get(k) ? k : undefined;
      if (n === undefined) {
        let best: number | null = null;
        for (const k of ch.bitmaps.keys()) if (best === null || Math.abs(k - frame) < Math.abs(best - frame)) best = k;
        n = best === null ? undefined : best;
      }
      const b = n === undefined ? null : ch.bitmaps.get(n);
      if (b) src = b;
    }
    if (!src && ch.posterBitmap) src = ch.posterBitmap;
    // frames still decoding: retry on the next tick so the canvas self-heals
    // once bitmaps arrive (nobody else re-marks dirty after a scrolltakt)
    if (!src) {
      dirty = true;
      return;
    }
    const mobile = window.matchMedia("(max-width: 860px)").matches ? "mobile" : "desktop";
    if (m.tiers[mobile].fit === "contain") {
      g2d.fillStyle = band;
      g2d.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / src.width, canvas.height / src.height);
      const w = src.width * scale, h = src.height * scale;
      g2d.drawImage(src, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    } else {
      const scale = Math.max(canvas.width / src.width, canvas.height / src.height);
      const w = src.width * scale, h = src.height * scale;
      g2d.drawImage(src, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }
  }

  function computeActive() {
    const s = state();
    const vh = window.innerHeight;
    const y = window.scrollY;
    const pin = section.getBoundingClientRect().top + y;
    let found: ChapterRuntime | null = null;
    for (const ch of Object.values(s.chapters)) {
      const el = chapterEl(ch.id);
      if (!el) continue;
      // document-space bounds; windows are the same [anchor, top + height - vh)
      // spans the draw mapping uses, so activation switches exactly when
      // playback hands over to the next chapter
      const top = el.getBoundingClientRect().top + y;
      const anchor = Math.max(top - vh, pin);
      if (y >= anchor && y < top + el.offsetHeight - vh) { found = ch; break; }
    }
    if ((found?.id ?? null) !== activeId) {
      activeId = found?.id ?? null;
      if (found) dirty = true;
      onActive(activeId);
      if (activeId) ensure?.(activeId);
    }
    // thread: story-level progress (start of chapter 02 -> end of chapter 05)
    // written straight to the CSS var the decorative Thread layer reads
    const s02 = chapterEl(Object.keys(s.chapters)[0]);
    const s05 = chapterEl(Object.keys(s.chapters).slice(-1)[0]);
    if (s02 && s05) {
      const start0 = Math.max(s02.getBoundingClientRect().top + y - vh, pin);
      const end0 = s05.getBoundingClientRect().top + y + s05.offsetHeight - vh;
      onStory?.(Math.max(0, Math.min(1, (y - start0) / Math.max(1, end0 - start0))));
    }
  }

  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      computeActive();
      dirty = true;
    });
  };
  const onResize = () => { resize(); computeActive(); };

  const loop = () => {
    if (!running) return;
    if (dirty) { dirty = false; draw(); }
    raf = requestAnimationFrame(loop);
  };

  const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
    resize();
  });

  return {
    start() {
      if (running) return;
      running = true;
      resize();
      computeActive();
      dirty = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      ro?.observe(canvas);
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    },
  };
}
