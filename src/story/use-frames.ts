import { useEffect, useRef, useState } from "react";

export interface ManifestTier {
  w: number;
  h: number;
  fps: number;
  ext: string;
  fit: "cover" | "contain";
}

export interface ManifestChapter {
  id: string;
  title: string;
  scrollVh: number;
  tStart: number;
  tEnd: number;
  firstFrame: number;
  lastFrame: number;
  frameCount: number;
  poster: string;
  posterMobile: string;
  posterWarp?: string;
}

export interface StoryManifest {
  tiers: Record<"desktop" | "mobile", ManifestTier>;
  bands: Record<"chapters02to04" | "chapter05", string>;
  chapters: ManifestChapter[];
}

export type EngineMode = "frames" | "poster";

export interface ChapterRuntime {
  id: string;
  firstFrame: number;
  frameCount: number;
  scrollVh: number;
  posterUrl: string;
  posterBitmap?: ImageBitmap;
  bitmaps: Map<number, ImageBitmap>;
  ready: boolean;
  failed: boolean;
  loading: boolean;
}

export type EngineState = {
  mode: EngineMode;
  manifest: StoryManifest | null;
  chapters: Record<string, ChapterRuntime>;
};

// Review-only control (remove before launch, like ?pp): ?story=poster forces
// the poster fallback on. Frames mode is the unconditional default — the engine
// no longer auto-downgrades; the poster is also used per-chapter while its
// frames are still decoding (drawn by the runner).
export function readStoryReviewOverride(): "frames" | "poster" | null {
  if (typeof window === "undefined" || typeof URLSearchParams === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("story");
  return v === "poster" ? "poster" : null;
}

export function createStoryEngine(onState: (s: EngineState) => void) {
  let cancelled = false;
  const chapters: Record<string, ChapterRuntime> = {};
  let mode: EngineMode = "frames";
  let manifest: StoryManifest | null = null;
  const emit = () => onState({ mode, manifest, chapters: { ...chapters } });

  type Tier = "desktop" | "mobile";
  const tier: Tier = window.matchMedia("(max-width: 860px)").matches ? "mobile" : "desktop";

  const loadBitmap = async (url: string): Promise<ImageBitmap | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await createImageBitmap(await res.blob());
    } catch {
      return null;
    }
  };

  const fail = () => {
    mode = "poster";
    emit();
  };

  const loadPoster = async (ch: ManifestChapter) => {
    const name = ["04"].includes(ch.id) && ch.posterWarp && tier === "mobile" ? ch.posterMobile : tier === "mobile" ? ch.posterMobile : ch.poster;
    const b = await loadBitmap(`/story/${tier}/${ch.id}/${name}`);
    if (!cancelled && b) chapters[ch.id].posterBitmap = b;
  };

  // tolerant frame fetch: retry a few times and return null on failure so a
  // single dropped request can never abort (and freeze) a whole chapter —
  // missing frames are bridged by the runner's nearest-frame fallback
  const RETRY_LIMIT = 3;
  // hung fetches get aborted and retried instead of blocking the queue
  const FRAME_TIMEOUT_MS = 15000;

  async function fetchFrameBitmap(url: string): Promise<ImageBitmap | null> {
    for (let attempt = 0; attempt < RETRY_LIMIT; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FRAME_TIMEOUT_MS);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`frame http ${res.status}`);
        const blob = await res.blob();
        clearTimeout(timer);
        return await createImageBitmap(blob);
      } catch {
        if (attempt < RETRY_LIMIT - 1) await new Promise(r => setTimeout(r, 250 * (attempt + 1)));
      } finally {
        clearTimeout(timer);
      }
    }
    return null;
  }

  async function loadGroup(ch: ManifestChapter, m: StoryManifest): Promise<boolean> {
    const run = chapters[ch.id];
    const t = m.tiers[tier];
    // poster runs in parallel — it covers the first paint but must not
    // delay the first frames from decoding
    const poster = loadPoster(ch).catch(() => {});
    // independent worker lanes, but assignment is contiguous-front-first: each
    // worker takes the LOWEST frame that is neither loaded nor in flight, so
    // the loaded set stays near-contiguous. A hung request stalls only its own
    // index (others skip it), bounding any gap to lane-count frames instead of
    // growing unbounded (the 199→249 jump) as with plain cursors/batches.
    let missing = 0;
    const taken = new Set<number>();
    const takeNext = (): number | null => {
      for (let i = 0; i < ch.frameCount; i++) {
        const n = ch.firstFrame + i;
        if (run.bitmaps.has(n) || taken.has(n)) continue;
        taken.add(n);
        return n;
      }
      return null;
    };
    const LANE_COUNT = 5;
    const worker = async () => {
      for (;;) {
        const n = takeNext();
        if (n === null) return;
        const bmp = await fetchFrameBitmap(`/story/${tier}/${ch.id}/frame-${String(n).padStart(4, "0")}.${t.ext}`);
        taken.delete(n);
        if (cancelled) return;
        if (bmp) run.bitmaps.set(n, bmp);
        else missing++;
      }
    };
    await Promise.all(Array.from({ length: LANE_COUNT }, () => worker()));
    await poster;
    if (cancelled) return false;
    if (missing >= ch.frameCount) throw new Error(`chapter ${ch.id}: all frames failed`);
    return true;
  }

  // on-demand chapter loading: the runner asks for the active chapter; the
  // engine prefetches at most the next one; distant chapters release theirs
  const inflight = new Set<string>();
  let lastActive = "";

  function unloadChapter(id: string) {
    const run = chapters[id];
    if (!run || run.loading || inflight.has(id)) return;
    for (const b of run.bitmaps.values()) b.close?.();
    run.bitmaps.clear();
    run.ready = false;
    emit();
  }

  async function ensure(id: string, prefetch = true): Promise<void> {
    const m = manifest;
    const run = chapters[id];
    if (!m || !run) return;
    if (run.ready || run.loading || inflight.has(id)) {
      // already handled: still make sure the next chapter is on its way
      if (prefetch) chainNext(id);
      return;
    }
    // only user-driven activations move the eviction anchor — chained
    // prefetch calls (prefetch=false) leave it alone
    if (prefetch) lastActive = id;
    inflight.add(id);
    run.loading = true;
    emit();
    // one-ahead prefetch starts when this chapter STARTS loading (not when
    // it finishes) so deep passes never wait on the previous load
    if (prefetch) chainNext(id);
    try {
      const ch = m.chapters.find(c => c.id === id);
      if (!ch) throw new Error(`chapter ${id} missing`);
      const ok = await loadGroup(ch, m);
      if (!ok) return;
      run.ready = true;
      emit();
      // release bitmaps of chapters far from the active one
      const act = m.chapters.findIndex(c => c.id === lastActive);
      for (const c of m.chapters) {
        const d = Math.abs(m.chapters.findIndex(k => k.id === c.id) - act);
        if (d > 1) unloadChapter(c.id);
      }
    } catch {
      run.failed = true;
      emit();
    } finally {
      inflight.delete(id);
      if (chapters[id]) chapters[id].loading = false;
      emit();
    }
  }

  function chainNext(id: string) {
    const m = manifest;
    if (!m) return;
    const idx = m.chapters.findIndex(c => c.id === id);
    const next = m.chapters[idx + 1];
    if (next && !chapters[next.id]?.ready && !chapters[next.id]?.loading && !inflight.has(next.id)) {
      void ensure(next.id, false);
    }
  }

  async function start() {
    try {
      const res = await fetch("/story/manifest.json");
      if (!res.ok) throw new Error(`manifest http ${res.status}`);
      manifest = (await res.json()) as StoryManifest;
      for (const ch of manifest.chapters) {
        chapters[ch.id] = {
          id: ch.id,
          firstFrame: ch.firstFrame,
          frameCount: ch.frameCount,
          scrollVh: ch.scrollVh,
          posterUrl: `/story/${tier}/${ch.id}/${tier === "mobile" ? ch.posterMobile : ch.poster}`,
          bitmaps: new Map(),
          ready: false,
          failed: false,
          loading: false,
        };
      }
      emit();
      // first chapter loads after first paint; others arrive via ensure() on scroll
      await new Promise<void>(r => {
        const ric = (window as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
        ric ? ric(() => r()) : window.setTimeout(r, 40);
      });
      const first = manifest.chapters[0];
      if (first) void ensure(first.id, true);
      if (mode === "frames") emit();
    } catch {
      if (!cancelled) fail();
    }
  }

  function getBitmap(chId: string, frame: number): ImageBitmap | null {
    return chapters[chId]?.bitmaps.get(frame) ?? null;
  }

  function destroy() {
    cancelled = true;
    for (const c of Object.values(chapters)) for (const b of c.bitmaps.values()) b.close?.();
  }

  return {
    tier, start, emit, getBitmap, destroy,
    ensure,
    isPosterMode: () => mode === "poster",
    state: () => ({ mode, manifest, chapters }),
  };
}

export function useStoryEngine() {
  const [state, setState] = useState<EngineState>({ mode: "frames", manifest: null, chapters: {} });
  const engineRef = useRef<ReturnType<typeof createStoryEngine> | null>(null);
  useEffect(() => {
    if (readStoryReviewOverride() === "poster") {
      // review-only poster fallback: still fetch the manifest so it has chapter data
      fetch("/story/manifest.json")
        .then(r => r.json())
        .then((manifest: StoryManifest) => setState({ mode: "poster", manifest, chapters: {} }))
        .catch(() => setState(s => ({ ...s, mode: "poster" })));
      return;
    }
    const engine = createStoryEngine(s => setState({ ...s }));
    engineRef.current = engine;
    void engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);
  return { state, engineRef };
}
