import { useEffect, useRef, useState } from "react";
import Dial, { C_INNER, C_MID, C_OUTER } from "./Dial";
import {
  BEAM_DEG,
  FADE_OUT_MS,
  HOLD_AFTER_100_MS,
  MAX_WAIT_MS,
  MIN_DURATION_MS,
  REVIEW_PARAM,
} from "./config";
import { getRealProgress, registerTask, resetProgress } from "./progress";
import "./preloader.css";

// Beam window and marker lead, in degrees of hand travel.
const MARK_LEAD_DEG = 4;

// Review-only controls (REMOVE BEFORE LAUNCH):
//   ?pp=0..1 freezes the preloader at that progress (e.g. ?pp=0.25)
//   and suppresses completion, for checking hand position and reveal stage.
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

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const handRef = useRef<SVGGElement | null>(null);
  const ringOuterRef = useRef<SVGCircleElement | null>(null);
  const ringMidRef = useRef<SVGCircleElement | null>(null);
  const ringInnerRef = useRef<SVGCircleElement | null>(null);
  const beamRef = useRef<SVGCircleElement | null>(null);
  const dressRef = useRef<SVGGElement | null>(null);
  const markerEls = useRef<(SVGLineElement | null)[]>([]);
  const pctRef = useRef<HTMLParagraphElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);
  const setMarker = (i: number) => (el: SVGLineElement | null) => {
    markerEls.current[i] = el;
  };
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
      // Line-art reveal: the long hand's angle drives illumination. Rings
      // brighten clockwise behind it, each marker lights as the hand
      // reaches it and stays lit, and a narrow bright edge rides at the
      // hand tip. Reduced motion shows the finished dial statically.
      const rv = reducedMotion ? 1 : clamped;
      const ss = (x: number, a: number, b: number) => {
        const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };
      if (handRef.current) {
        handRef.current.setAttribute("transform", `rotate(${deg} 200 200)`);
        handRef.current.setAttribute("opacity", `${0.3 + 0.7 * ss(rv, 0, 0.45)}`);
      }
      const handDeg = rv * 360;
      const ringPairs: [{ current: SVGCircleElement | null }, number][] = [
        [ringOuterRef, C_OUTER],
        [ringMidRef, C_MID],
        [ringInnerRef, C_INNER],
      ];
      for (const [ref, c] of ringPairs) {
        if (ref.current) ref.current.setAttribute("stroke-dashoffset", `${c * (1 - rv)}`);
      }
      if (beamRef.current) {
        const win = C_OUTER * (BEAM_DEG / 360);
        beamRef.current.setAttribute("stroke-dasharray", `${win} ${C_OUTER - win}`);
        beamRef.current.setAttribute("stroke-dashoffset", `${C_OUTER * (1 - rv)}`);
        beamRef.current.setAttribute("opacity", rv <= 0 || rv >= 1 ? "0" : "0.7");
      }
      for (let i = 0; i < 12; i++) {
        const el = markerEls.current[i];
        if (el) el.setAttribute("opacity", handDeg >= i * 30 - MARK_LEAD_DEG ? "0.85" : "0.12");
      }
      if (dressRef.current) dressRef.current.setAttribute("opacity", `${0.2 + 0.8 * ss(rv, 0, 0.4)}`);
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
      // Frozen review mode: paint once at that progress, never complete.
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

    const finish = () => {
      if (finished) return;
      finished = true;
      paint(1);
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
      <img
        className="pp-photo"
        src="/The-Zeitz-Museum-of-Contemporary-Art-Africa.jpg"
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
      />
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
          rings={{ outer: ringOuterRef, mid: ringMidRef, inner: ringInnerRef }}
          beamRef={beamRef}
          dressRef={dressRef}
          setMarker={setMarker}
        />
      </div>
      <p ref={pctRef} data-v="0" className="pp-pct" aria-hidden="true">
        0%
      </p>
    </div>
  );
}
