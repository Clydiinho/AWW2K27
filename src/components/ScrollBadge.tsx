import { useEffect, useRef, type CSSProperties } from "react";
import { site } from "../content/site";
import "./ScrollBadge.css";

// Tunables, per the task prompt.
const ROTATE_SECONDS = 14; // one full ring revolution
const PULSE_SECONDS = 1.6; // one arrow pulse cycle
const PULSE_SCALE = 1.3; // arrow pulse peak scale
const RING_RADIUS = 40; // SVG user units, matches the arc in the defs
const FONT_SIZE = 8.5; // SVG user units
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // 251.327

const NBSP = "\u00A0"; // keeps the trailing gap un-collapsed by SVG whitespace rules
const DOTS = "\u2022\u2022";

export interface ScrollBadgeProps {
  href?: string; // anchor target lives in StoryScroll (<section id="chapter-02">)
}

export default function ScrollBadge({ href = "#chapter-02" }: ScrollBadgeProps) {
  const badge = site.scrollBadge;
  const rootRef = useRef<HTMLAnchorElement>(null);
  const textRef = useRef<SVGTextElement>(null);

  // label + NBSP + dots + NBSP, twice, ending with the separator it starts
  // after so the ring reads seamlessly as it rotates.
  const ring = `${badge.label}${NBSP}${DOTS}${NBSP}${badge.label}${NBSP}${DOTS}${NBSP}`;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // ONE observer + visibility listener driving a shared pause class.
    let ioVisible = true;
    const updatePause = () => {
      const paused = !ioVisible || document.visibilityState === "hidden";
      root.classList.toggle("is-paused", paused);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        ioVisible = entries.some((entry) => entry.isIntersecting);
        updatePause();
      },
      { threshold: 0.01 },
    );
    observer.observe(root);
    const onVisibility = () => updatePause();
    document.addEventListener("visibilitychange", onVisibility, { passive: true });

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    // Fit the ring string to the circumference. Measured once on mount and
    // once more after fonts finish loading; never inside animation/scroll.
    const text = textRef.current;
    if (!text) return;
    let cancelled = false;
    const fit = () => {
      if (cancelled || !text.isConnected) return;
      text.style.letterSpacing = "0";
      let length = text.getComputedTextLength();
      if (length > 0.98 * CIRCUMFERENCE && length > 0) {
        text.style.fontSize = `${FONT_SIZE * ((0.98 * CIRCUMFERENCE) / length)}px`;
        length = text.getComputedTextLength();
      }
      if (length > 0) {
        text.style.letterSpacing = `${(CIRCUMFERENCE - length) / text.textContent!.length}px`;
        text.classList.add("is-measured");
      }
    };
    document.fonts?.ready.then(fit);
    fit();
    return () => {
      cancelled = true;
    };
  }, []);

  const style = {
    "--rotate-seconds": `${ROTATE_SECONDS}s`,
    "--pulse-seconds": `${PULSE_SECONDS}s`,
    "--pulse-scale": PULSE_SCALE,
  } as CSSProperties;

  return (
    <a
      ref={rootRef}
      href={href}
      className="scroll-badge"
      aria-label={badge.ariaLabel}
      style={style}
    >
      <div className="scroll-badge-ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <path
              id="scroll-badge-arc"
              fill="none"
              d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
            />
          </defs>
          <circle
            className="scroll-badge-hairline"
            cx="50"
            cy="50"
            r="47"
            fill="none"
            strokeWidth="0.4"
          />
          <text ref={textRef} className="scroll-badge-ring-text">
            <textPath href="#scroll-badge-arc" startOffset="0">
              {ring}
            </textPath>
          </text>
        </svg>
      </div>
      <div className="scroll-badge-arrow-wrap">
        <svg viewBox="0 0 24 24">
          <path d="M12 4 L12 19 M6.5 13.5 L12 19 L17.5 13.5" />
        </svg>
      </div>
    </a>
  );
}
