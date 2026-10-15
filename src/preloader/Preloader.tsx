import { useEffect, useRef, useState } from "react";
import Dial, { ARC_C } from "./Dial";
import {
  FADE_OUT_MS,
  HOLD_AFTER_100_MS,
  MAX_WAIT_MS,
  MIN_DURATION_MS,
  REVIEW_PARAM,
  SPARKLE_LEAD_DEG,
} from "./config";
import { getRealProgress, registerTask, resetProgress } from "./progress";
import "./preloader.css";

// Review-only controls (REMOVE BEFORE LAUNCH):
//   ?pp=0..1 freezes the preloader at that progress (e.g. ?pp=0.25) and
//   suppresses completion, for checking hand positions + sparkles.
//   The "Replay preloader" button in App.tsx is also review-only.
function getFrozenProgress(): number | null {
  try {
    const v = new URLSearchParams(window.location.search).get(REVIEW_PARAM);
    if (v === null || v === "") return null;
    const f = Number(v);
    if (!Number.isFinite(f) || f < 0 || f > 1) return null;
    return f;
  } catch {
    return null;
  }
}

function sparkedUpTo(progress: number): boolean[] {
  const deg = progress * 360;
  return Array.from({ length: 12 }, (_, i) => {
    if (i === 0) return progress >= 0;
    return deg >= i * 30 - SPARKLE_LEAD_DEG;
  });
}

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handRef = useRef<SVGGElement | null>(null);
  const arcRef = useRef<SVGCircleElement | null>(null);
  const pctRef = useRef<HTMLParagraphElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);
  const [sparked, setSparked] = useState<boolean[]>(() => {
    const f = getFrozenProgress();
    if (f !== null) return sparkedUpTo(f);
    return Array.from({ length: 12 }, (_, i) => i === 0);
  });
  const [finale, setFinale] = useState(false);
  const [shimmer, setShimmer] = useState(false);
  const [fading, setFading] = useState(false);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    document.documentElement.classList.add("pp-lock");
    const frozen = getFrozenProgress();

    const paint = (p: number) => {
      const clamped = Math.min(1, Math.max(0, p));
      const deg = clamped * 360;
      if (handRef.current) handRef.current.setAttribute("transform", `rotate(${deg} 200 200)`);
      if (arcRef.current) arcRef.current.setAttribute("stroke-dashoffset", `${ARC_C * (1 - clamped)}`);
      const pct = Math.round(clamped * 100);
      if (pctRef.current && pctRef.current.dataset.v !== String(pct)) {
        pctRef.current.dataset.v = String(pct);
        pctRef.current.textContent = `${pct}%`;
      }
      if (barRef.current) {
        const step = Math.round(pct / 10) * 10;
        if (barRef.current.dataset.a !== String(step)) {
          barRef.current.dataset.a = String(step);
          barRef.current.setAttribute("aria-valuenow", String(step));
        }
      }
    };

    if (frozen !== null) {
      // Frozen review mode: paint once, spark up to that point, never complete.
      paint(frozen);
      return () => {
        document.documentElement.classList.remove("pp-lock");
      };
    }

    resetProgress();
    const windowTask = registerTask("window-load", 1);
    const fontsTask = registerTask("fonts-ready", 1);
    if (document.readyState === "complete") {
      windowTask.done();
    } else {
      const onLoad = () => windowTask.done();
      window.addEventListener("load", onLoad, { once: true });
      // Cleanup for this listener is registered below via cancel flag.
      (window as unknown as { __ppLoad?: () => void }).__ppLoad = onLoad;
    }
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(() => fontsTask.done()).catch(() => fontsTask.done());
    } else {
      fontsTask.done();
    }

    const minDuration = reducedMotion ? 1500 : MIN_DURATION_MS;
    const start = performance.now();
    let raf = 0;
    let displayed = 0;
    let finished = false;
    const sparkedFlags = Array.from({ length: 12 }, (_, i) => i === 0);

    const finish = () => {
      if (finished) return;
      finished = true;
      paint(1);
      setSparked(Array.from({ length: 12 }, () => true));
      if (!reducedMotion) {
        setFinale(true);
        setShimmer(true);
      }
      window.setTimeout(() => {
        setFading(true);
        window.setTimeout(() => {
          if (!doneRef.current) {
            doneRef.current = true;
            onComplete();
          }
        }, reducedMotion ? 200 : FADE_OUT_MS);
      }, reducedMotion ? 150 : HOLD_AFTER_100_MS);
    };

    const tick = (now: number) => {
      if (finished) return;
      const elapsed = now - start;
      let real = getRealProgress();
      if (elapsed >= MAX_WAIT_MS) real = 1; // Failsafe: never trap a visitor.
      const timeP = Math.min(1, elapsed / minDuration);
      const realCapped = real >= 1 ? 1 : Math.min(real, 0.99);
      const target = Math.min(realCapped, timeP);
      if (target > displayed) {
        const next = displayed + (target - displayed) * 0.12;
        displayed = target === 1 && 1 - next < 0.008 ? 1 : Math.min(target, next);
        // Guarantee visible motion even when lerp stalls early.
        if (target > 0 && displayed < 0.001 && elapsed > 100) displayed = Math.min(target, 0.005);
      }
      paint(displayed);

      let changed = false;
      for (let i = 1; i < 12; i++) {
        if (!sparkedFlags[i] && displayed * 360 >= i * 30 - SPARKLE_LEAD_DEG) {
          sparkedFlags[i] = true;
          changed = true;
        }
      }
      if (changed) setSparked([...sparkedFlags]);

      if (displayed >= 1) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    // Paint the 12 o'clock start state immediately (hand at 12, 0%).
    paint(0);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      finished = true;
      const onLoad = (window as unknown as { __ppLoad?: () => void }).__ppLoad;
      if (onLoad) window.removeEventListener("load", onLoad);
      document.documentElement.classList.remove("pp-lock");
    };
  }, [onComplete, reducedMotion]);

  return (
    <div
      ref={overlayRef}
      className={fading ? "pp-overlay pp-fade-out" : "pp-overlay"}
    >
      <div
        ref={barRef}
        role="progressbar"
        aria-label="Loading Africa Watch Week"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        className="pp-stage"
      >
        <span className="visually-hidden">Loading Africa Watch Week</span>
        <Dial
          handRef={handRef}
          arcRef={arcRef}
          sparked={sparked}
          finale={finale}
          shimmer={shimmer}
          reducedMotion={reducedMotion}
        />
      </div>
      <p ref={pctRef} data-v="0" className="pp-pct" aria-hidden="true">
        0%
      </p>
    </div>
  );
}
