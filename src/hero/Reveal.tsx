import { useEffect, useRef, useState, type RefObject } from "react";
import {
  LIFE_MS,
  MAX_PARTICLES,
  MAX_PARTICLES_PHONE,
  FRAME_BUDGET_MS,
  BRUSH_MIN,
  BRUSH_MAX,
  BRUSH_SCROLL,
  POINTER_SMOOTHING,
  SPAWN_SPACING,
  MAX_SPAWN_PER_FRAME,
  HINT_MS,
  CANVAS_QUALITY_STEP,
  MAX_CANVAS_DPR,
  sweepPoint,
} from "./config";

export interface RevealProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  imgRef: RefObject<HTMLImageElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  sectionRef: RefObject<HTMLElement | null>;
}

interface Stats {
  state: "idle" | "active" | "paused" | "failed";
  live: number;
  medianMs: number;
  worstMs: number;
  fallback: string;
  p: number;
  image: "loading" | "decoded" | "failed" | "none";
}

const FAIL_STATS: Stats = {
  state: "failed",
  live: 0,
  medianMs: 0,
  worstMs: 0,
  fallback: "no-canvas",
  p: 0,
  image: "none",
};

// Reveals the hero image through the black foreground canvas: it is filled
// solid rgb(5,5,5), and particles ERASE soft open cores out of it with
// destination-out radial gradients (read-free: no getImageData, no
// putImageData). One rAF loop that stops completely when idle; pauses
// offscreen and when hidden. Trails are blocked over the glass card.
export default function Reveal({ canvasRef, imgRef, stageRef, sectionRef }: RevealProps) {
  const statsRef = useRef<Stats>({ ...FAIL_STATS });
  const [debugOn] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("revealdebug") === "1",
  );

  useEffect(() => {
    const img = imgRef.current;
    const stq = stageRef.current;
    const scq = sectionRef.current;
    const cvq = canvasRef.current;
    if (!cvq || !stq || !scq) return;
    const cv: HTMLCanvasElement = cvq;
    const st: HTMLElement = stq;
    const sc: HTMLElement = scq;
    const cxq = cv.getContext("2d", { alpha: true });
    if (!cxq || typeof IntersectionObserver === "undefined") {
      st.dataset.reveal = "static";
      return;
    }
    const cx: CanvasRenderingContext2D = cxq;
    const stats: Stats = {
      state: "idle",
      live: 0,
      medianMs: 0,
      worstMs: 0,
      fallback: "",
      p: 0,
      image: img ? "loading" : "none",
    };
    statsRef.current = stats;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phone = window.matchMedia("(max-width: 860px)").matches;
    let pool = phone ? MAX_PARTICLES_PHONE : MAX_PARTICLES;

    // canvas resolution quality ladder: 1 → step → static fallback
    let quality = 1;
    let halved = false;

    let W = 1; // canvas device-pixel dims
    let H = 1;
    let cssW = 1;
    let cssH = 1;

    // fixed particle pool — zero per-frame allocation; positions in CSS px
    const px = new Float32Array(pool);
    const py = new Float32Array(pool);
    const page = new Float32Array(pool);
    const plife = new Float32Array(pool);
    const pr = new Float32Array(pool);
    const palive = new Uint8Array(pool);
    let liveCount = 0;

    // cached geometry; refreshed at most once per frame, when flagged
    let rectLeft = 0;
    let rectTop = 0;
    let rectW = 1;
    let rectH = 1;
    let shorter = 1;
    let heroTop = 0;
    let runH = 0;
    // card exclusion: trails deliberately never cross the glass card
    let cardLeft = 0;
    let cardTop = 0;
    let cardW = 0;
    let cardH = 0;
    let geometryDirty = true;
    let scrollDirty = false;

    // pointer state
    let ptrPending = false;
    let ptrInside = false;
    let rawX = 0;
    let rawY = 0;
    let sx = 0;
    let sy = 0;
    let psx = 0;
    let psy = 0;
    let ptrInit = false;
    let touched = false; // any real input seen (kills the hint)

    // scroll sweep brush (stage fractions)
    let vpX = -1;
    let vpY = -1;

    // one-time hint stroke
    let hintDone = false;
    let hintActive = false;
    let hintStart = 0;
    let hx0 = -1;
    let hy0 = -1;

    let visible = false;
    let hidden = document.visibilityState === "hidden";
    let running = false;
    let raf = 0;
    let last = 0;

    // one light self-stopping perf sampler over the first 3s of painting
    const frameTimes: number[] = [];
    let samplerState = 0; // 0 idle, 1 sampling, 2 done
    let samplerT0 = 0;

    function measure() {
      cssW = st.clientWidth;
      cssH = st.clientHeight;
      if (cssW < 1 || cssH < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR) * quality;
      W = Math.max(1, Math.round(cssW * dpr));
      H = Math.max(1, Math.round(cssH * dpr));
      cv.width = W;
      cv.height = H;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = st.getBoundingClientRect();
      rectLeft = r.left;
      rectTop = r.top;
      rectW = r.width || 1;
      rectH = r.height || 1;
      shorter = Math.min(rectW, rectH);
      const card = st.querySelector<HTMLElement>(".hero-card");
      if (card) {
        const c2 = card.getBoundingClientRect();
        cardLeft = c2.left;
        cardTop = c2.top;
        cardW = c2.width;
        cardH = c2.height;
      } else {
        cardW = 0;
        cardH = 0;
      }
      const sr = sc.getBoundingClientRect();
      heroTop = sr.top + window.scrollY;
      runH = Math.max(0, sc.offsetHeight - window.innerHeight);
      paintSolid();
    }

    function computeP(): number {
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (runH <= 0) return clamp01(y / vh);
      return clamp01((y - heroTop) / runH);
    }

    function freeSlot(): number {
      for (let i = 0; i < pool; i++) if (!palive[i]) return i;
      return -1;
    }

    // seeds one particle at stage fractions, radius as a stage-shorter fraction
    function seed(i: number, x: number, y: number, radiusFrac: number) {
      px[i] = x * rectW;
      py[i] = y * rectH;
      page[i] = 0;
      plife[i] = LIFE_MS * (0.85 + Math.random() * 0.3);
      pr[i] = radiusFrac * (0.85 + Math.random() * 0.3) * shorter;
      if (!palive[i]) {
        palive[i] = 1;
        liveCount++;
      }
    }

    let spawnCapUsed = 0;

    // spawns along a segment between stage fractions, SPAWN_SPACING × radius
    // apart in CSS px, capped by the shared per-frame budget; points inside
    // the card footprint are skipped so trails never cut the glass card
    function spawnAlong(x0: number, y0: number, x1: number, y1: number, radiusFrac: number) {
      if (spawnCapUsed >= MAX_SPAWN_PER_FRAME) return;
      const spacing = Math.max(1, radiusFrac * shorter * SPAWN_SPACING);
      const dist = Math.hypot((x1 - x0) * rectW, (y1 - y0) * rectH);
      const inside = (x: number, y: number) =>
        cardW > 0 && x * rectW >= cardLeft - rectLeft && x * rectW <= cardLeft + cardW - rectLeft &&
        y * rectH >= cardTop - rectTop && y * rectH <= cardTop + cardH - rectTop;
      if (dist < spacing) {
        if (!inside(x1, y1)) {
          const i = freeSlot();
          if (i >= 0) {
            seed(i, x1, y1, radiusFrac);
            spawnCapUsed++;
          }
        }
        return;
      }
      const steps = Math.min(MAX_SPAWN_PER_FRAME - spawnCapUsed, Math.floor(dist / spacing));
      for (let s = 1; s <= steps; s++) {
        const u = s / steps;
        const xf = x0 + (x1 - x0) * u;
        const yf = y0 + (y1 - y0) * u;
        if (inside(xf, yf)) continue;
        const i = freeSlot();
        if (i < 0) return;
        seed(i, xf, yf, radiusFrac);
        spawnCapUsed++;
      }
    }

    // grows to ~2x base radius over the first 30% (easeInOutSine), then
    // shrinks to 0 across the remaining 70% (easeInQuart)
    function particleRadius(t: number, baseR: number): number {
      if (t < 0.3) return baseR * (1 + easeInOutSine(t / 0.3));
      const u = (t - 0.3) / 0.7;
      return baseR * 2 * (1 - easeInQuart(u));
    }

    // one frame of the foreground: solid black base, then destination-out
    // soft-core blobs. Alpha profile emulates the smoothstep threshold: a
    // fully erased core out to ~45% of the radius, then a smooth falloff.
    function drawMask(): number {
      cx.globalCompositeOperation = "source-over";
      cx.fillStyle = "rgb(5,5,5)";
      cx.fillRect(0, 0, cssW, cssH);
      cx.globalCompositeOperation = "destination-out";
      let alive = 0;
      for (let i = 0; i < pool; i++) {
        if (!palive[i]) continue;
        const t = page[i] / plife[i];
        const r = particleRadius(t, pr[i]);
        if (t >= 1 || r <= 0.5) {
          palive[i] = 0;
          liveCount--;
          continue;
        }
        const x = px[i]; // stage-rect-relative CSS px (canvas is pinned there)
        const y = py[i];
        // skip particles outside the canvas (cheap cull)
        if (x < -r || x > cssW + r || y < -r || y > cssH + r) {
          palive[i] = 0;
          liveCount--;
          continue;
        }
        const grad = cx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, "rgba(0,0,0,1)");
        grad.addColorStop(0.45, "rgba(0,0,0,0.96)");
        grad.addColorStop(0.75, "rgba(0,0,0,0.42)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        cx.fillStyle = grad;
        cx.fillRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2);
        alive++;
      }
      cx.globalCompositeOperation = "source-over";
      stats.live = alive;
      return alive;
    }

    function paintSolid() {
      cx.globalCompositeOperation = "source-over";
      cx.fillStyle = "rgb(5,5,5)";
      cx.fillRect(0, 0, cssW, cssH);
    }

    function canRun(): boolean {
      return visible && !hidden;
    }

    function ensureLoop() {
      if (raf || running || !canRun()) return;
      running = true;
      stats.state = "active";
      raf = requestAnimationFrame(tick);
    }

    function workLeft(): boolean {
      return liveCount > 0 || ptrPending || scrollDirty || hintActive;
    }

    function tick(t: number) {
      raf = 0;
      const dt = last ? Math.min(1 / 30, (t - last) / 1000) : 1 / 30;
      last = t;

      if (geometryDirty) {
        measure();
        geometryDirty = false;
      }

      spawnCapUsed = 0;

      if (decodeReady && ptrPending && visible && ptrInside) {
        ptrPending = false;
        const overCard =
          cardW > 0 &&
          rawX >= cardLeft &&
          rawX <= cardLeft + cardW &&
          rawY >= cardTop &&
          rawY <= cardTop + cardH;
        const tx = (rawX - rectLeft) / rectW;
        const ty = (rawY - rectTop) / rectH;
        if (!ptrInit) {
          sx = tx;
          sy = ty;
          psx = sx;
          psy = sy;
          ptrInit = true;
        }
        if (!overCard) {
          // brush radius grows with the gap between raw and smoothed
          const gap = Math.min(shorter, Math.hypot((tx - sx) * rectW, (ty - sy) * rectH));
          const rFrac = BRUSH_MIN + (gap / shorter) * (BRUSH_MAX - BRUSH_MIN);
          psx = sx;
          psy = sy;
          const k = 1 - Math.exp(-Math.max(dt, 0.001) * POINTER_SMOOTHING);
          sx += (tx - sx) * k;
          sy += (ty - sy) * k;
          spawnAlong(psx, psy, sx, sy, rFrac);
        }
      } else {
        ptrPending = false;
      }

      if (decodeReady && scrollDirty && visible) {
        scrollDirty = false;
        const vp = sweepPoint(computeP());
        if (vpX >= 0) spawnAlong(vpX, vpY, vp.x, vp.y, BRUSH_SCROLL);
        vpX = vp.x;
        vpY = vp.y;
      } else {
        scrollDirty = false;
      }

      if (hintActive) {
        const u = clamp01((t - hintStart) / HINT_MS);
        if (u < 1) {
          const hnx = bez(0.16, 0.5, 0.84, u);
          const hny = bez(0.66, 0.3, 0.64, u);
          if (hx0 >= 0) spawnAlong(hx0, hy0, hnx, hny, BRUSH_SCROLL * 0.85);
          hx0 = hnx;
          hy0 = hny;
        } else {
          hintActive = false;
        }
      }

      for (let i = 0; i < pool; i++) if (palive[i]) page[i] += dt * 1000;

      drawMask();

      stats.p = computeP();

      // one light self-stopping sampler over the first 3s of active painting
      // (first 0.5s ignored; a second failure switches to the static fallback)
      if (samplerState < 2) {
        if (samplerState === 0) {
          samplerState = 1;
          samplerT0 = t;
        } else if (t - samplerT0 > 500) {
          frameTimes.push(dt * 1000);
        }
        if (t - samplerT0 > 3000 || frameTimes.length >= 120) {
          const median = medianOf(frameTimes);
          stats.medianMs = round1(median);
          stats.worstMs = round1(frameTimes.length ? Math.max(...frameTimes) : 0);
          if (median > FRAME_BUDGET_MS) {
            if (halved) {
              failStatic("slow-after-quality-drop");
              return;
            }
            halved = true;
            quality = CANVAS_QUALITY_STEP;
            stats.fallback = "quality-dropped";
            geometryDirty = true;
            measure();
            frameTimes.length = 0;
            samplerT0 = t;
          } else {
            samplerState = 2;
          }
        }
      }

      if (workLeft()) {
        raf = requestAnimationFrame(tick);
        return;
      }
      paintSolid(); // idle: one final solid-black frame, then stop (zero CPU)
      running = false;
      last = 0;
      stats.state = "idle";
    }

    let decodeReady = false;

    function failStatic(reason: string) {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      stats.fallback = reason;
      stats.state = "failed";
      st.dataset.reveal = "static";
      paintSolid();
      try {
        window.sessionStorage.setItem("aww-hero-static", "1");
      } catch {
        /* storage unavailable (private mode) */
      }
      console.warn("[hero] reveal engine failed perf budget:", reason);
    }

    function stopLoop() {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      last = 0;
      stats.state = "paused";
    }

    const onMove = (ev: PointerEvent) => {
      rawX = ev.clientX;
      rawY = ev.clientY;
      ptrInside =
        rawX >= rectLeft && rawX <= rectLeft + rectW && rawY >= rectTop && rawY <= rectTop + rectH;
      if (ptrInside) {
        touched = true;
        hintActive = false;
        ptrPending = true;
        ensureLoop();
      }
    };
    const onDown = (ev: PointerEvent) => {
      touched = true;
      hintActive = false;
      if (!decodeReady || !visible) return;
      const x = (ev.clientX - rectLeft) / rectW;
      const y = (ev.clientY - rectTop) / rectH;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      const i = freeSlot();
      if (i >= 0) {
        seed(i, x, y, BRUSH_MAX); // a tap spawns one larger blob
        ensureLoop();
      }
    };
    const onPointerGone = () => {
      ptrInside = false;
    };
    const onScroll = () => {
      touched = true;
      hintActive = false;
      scrollDirty = true;
      ensureLoop();
    };
    const onResize = () => {
      geometryDirty = true;
      ensureLoop();
    };
    const onVisibility = () => {
      hidden = document.visibilityState === "hidden";
      if (hidden) stopLoop();
      else ensureLoop();
    };
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e2) => e2.isIntersecting);
        if (!visible) stopLoop();
        else ensureLoop();
      },
      { threshold: 0 },
    );

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onPointerGone, { passive: true });
    window.addEventListener("pointercancel", onPointerGone, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    io.observe(st);

    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
    ro?.observe(st);

    measure();
    // the CSS #050505 background covered the lazy-chunk gap; from here on the
    // canvas paints itself solid on mount, so swap before the first paint
    cv.style.background = "transparent";
    visible =
      st.getBoundingClientRect().bottom > 0 &&
      window.scrollY < sc.offsetHeight;
    paintSolid(); // the canvas is the black foreground from the first frame

    // decode gate: hint only once img.decode() resolves
    function armAfterDecode() {
      decodeReady = true;
      stats.image = "decoded";
      if (hintDone || touched || window.scrollY > 4 || reduced) return;
      hintDone = true;
      hintActive = true;
      hintStart = performance.now() + 350;
      hx0 = -1;
      hy0 = -1;
      ensureLoop();
    }
    if (img) {
      if (img.complete && img.naturalWidth > 0) armAfterDecode();
      else if (img.complete) {
        decodeReady = true;
        stats.image = "failed";
        console.warn("[hero] hero image failed to load; keeping the black hero");
      } else {
        img
          .decode()
          .then(() => armAfterDecode())
          .catch(() => {
            decodeReady = true;
            stats.image = "failed";
            console.warn("[hero] hero image failed to load; keeping the black hero");
          });
      }
      img.addEventListener("error", () => {
        if (stats.image !== "failed") {
          stats.image = "failed";
          console.warn("[hero] hero image failed to load; keeping the black hero");
        }
      });
    } else {
      stats.image = "none";
      decodeReady = true;
    }

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onPointerGone);
      window.removeEventListener("pointercancel", onPointerGone);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      running = false;
      stats.state = "idle";
    };
    // the refs are stable across renders; the engine wires itself up once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!debugOn) return null;
  return (
    <div className="hero-debug" aria-hidden="true">
      <Readout statsRef={statsRef} />
    </div>
  );
}

function Readout({ statsRef }: { statsRef: { current: Stats | null } }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = statsRef.current;
      if (!s) return;
      setText(
        [
          `state ${s.state}`,
          `live ${s.live}`,
          `med ${s.medianMs} worst ${s.worstMs}ms`,
          s.fallback ? `fallback ${s.fallback}` : "fallback -",
          `runway p=${s.p.toFixed(2)}`,
          `image ${s.image}`,
        ].join("  |  "),
      );
    }, 200);
    return () => window.clearInterval(id);
  }, [statsRef]);
  return <code>{text}</code>;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function easeInOutSine(k: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * k);
}
function easeInQuart(u: number): number {
  return u * u * u * u;
}
function bez(a: number, b: number, c: number, u: number): number {
  const v = 1 - u;
  return v * v * a + 2 * v * u * b + u * u * c;
}
function medianOf(list: number[]): number {
  if (!list.length) return 0;
  const s = [...list].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

