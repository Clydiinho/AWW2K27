import { useEffect, useRef, useState, type CSSProperties } from "react";
import { site, STATS_CONFIRMED } from "../content/site";
import "./KeyNumbers.css";

// Review-only controls (remove before launch, like ?review / ?story):
//   ?review=1  shows the "DRAFT FIGURES" tag while STATS_CONFIRMED is false
//   ?stats=in  shows the section in its final state, no animation
function readFlag(name: string, value: string): boolean {
  if (typeof window === "undefined" || typeof URLSearchParams === "undefined") return false;
  return new URLSearchParams(window.location.search).get(name) === value;
}

// Split a display string into the countable number part (leading digits and
// commas) and a static suffix ("40,000" -> "40,000"/""; "6 Days" -> "6"/" Days";
// "200+" -> "200"/"+").
function splitDisplay(display: string) {
  const m = /^([\d,]+)([\s\S]*)$/.exec(display);
  if (!m) return { value: 0, suffix: display, grouped: false };
  const value = parseInt(m[1].replace(/,/g, ""), 10) || 0;
  return { value, suffix: m[2], grouped: m[1].includes(",") };
}

const COUNT_MS = 1400;
const STAGGER_MS = 90;
const FAILSAFE_MS = 3000;

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

export default function KeyNumbers() {
  const rootRef = useRef<HTMLElement>(null);
  const [review] = useState(() => readFlag("review", "1"));
  const [forceIn] = useState(() => readFlag("stats", "in"));
  const [saveData] = useState(
    () =>
      typeof navigator !== "undefined" &&
      Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData),
  );
  // data-saver phones skip the photo entirely (decorative anyway)
  const [narrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 899px)").matches,
  );
  const showPhoto = !(saveData && narrow);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const nums = Array.from(root.querySelectorAll<HTMLElement>(".stat-num-anim"));
    const anims = Array.from(root.querySelectorAll<HTMLElement>("[data-anim]"));

    const finishAll = () => {
      for (const n of nums) {
        n.textContent = n.dataset.final ?? n.textContent;
      }
    };

    // reduced motion, data-saver or the review-only ?stats=in flag: final
    // state immediately, no count-up, no rise, no hairline draw
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || saveData || forceIn) {
      root.classList.add("key-static");
      finishAll();
      return;
    }

    // ONE shared count-up loop for the whole section; starts only when the
    // first number element is actually in view, never on load.
    let started = false;
    let start: number | null = null;
    let raf = 0;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / COUNT_MS);
      const e = easeOutCubic(p);
      let busy = false;
      for (const n of nums) {
        const value = Number(n.dataset.value ?? "0");
        const suffix = n.dataset.suffix ?? "";
        const grouped = n.dataset.grouped === "1";
        const target = n.dataset.num ?? "";
        const v = Math.round(value * e);
        const text =
          p >= 1
            ? n.dataset.final ?? target + suffix
            : (grouped ? v.toLocaleString("en-US") : String(v)) + suffix;
        if (n.textContent !== text) n.textContent = text;
        if (p < 1) busy = true;
      }
      if (busy) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const startCounter = () => {
      if (started) return;
      started = true;
      raf = requestAnimationFrame(tick);
    };

    // one shared observer: fades each element in once (with a small stagger
    // inside each entry batch) and starts the counter on the first number
    const io = new IntersectionObserver(
      (entries) => {
        let batch = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          const el = entry.target as HTMLElement;
          if (batch === 0) startCounter();
          el.style.transitionDelay = `${batch * STAGGER_MS}ms`;
          batch += 1;
          el.classList.add("stat-in");
        }
      },
      { threshold: 0.3 },
    );
    for (const el of [...anims, ...nums]) io.observe(el);

    // failsafe: if the observer never fires, make sure the section is visible
    // with final values after 3s; the observer stays alive so the count-up
    // can still play whenever the visitor reaches the section
    const failsafe = setTimeout(() => {
      if (!started) {
        finishAll();
        for (const el of anims) el.classList.add("stat-in");
      }
    }, FAILSAFE_MS);

    return () => {
      io.disconnect();
      clearTimeout(failsafe);
      cancelAnimationFrame(raf);
    };
  }, [saveData, forceIn]);

  const data = site.keyNumbers;
  const hero = data.stats[0];
  const rest = data.stats.slice(1, 4);
  const heroParsed = splitDisplay(hero.display);

  return (
    <section id="key-numbers" ref={rootRef} className="key-numbers" aria-labelledby="key-numbers-title">
      <div className="key-inner">
        <h2 id="key-numbers-title" className="key-eyebrow" data-anim>
          {data.eyebrow}
        </h2>
        {!STATS_CONFIRMED && review && <p className="key-draft" data-anim>DRAFT FIGURES</p>}
        <div className="key-hero">
          <div className="key-hero-stat">
            <StatNum
              className="stat-num--hero"
              display={hero.display}
              parsed={heroParsed}
            />
            <span className="stat-label" data-anim>
              {hero.label}
            </span>
          </div>
          {showPhoto && (
            <figure className="stat-photo" data-anim>
              <picture>
                <source
                  type="image/avif"
                  srcSet="/assets/stats-v1/photo-480.avif 480w, /assets/stats-v1/photo-800.avif 800w, /assets/stats-v1/photo-1200.avif 1200w"
                  sizes="(min-width: 900px) 384px, 100vw"
                />
                <source
                  type="image/webp"
                  srcSet="/assets/stats-v1/photo-480.webp 480w, /assets/stats-v1/photo-800.webp 800w, /assets/stats-v1/photo-1200.webp 1200w"
                  sizes="(min-width: 900px) 384px, 100vw"
                />
                <img
                  src="/assets/stats-v1/photo-800.webp"
                  width={800}
                  height={533}
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
              </picture>
            </figure>
          )}
          <span className="key-hero-rule" data-anim aria-hidden="true" />
        </div>
        <div className="key-row">
          {rest.map((s) => (
            <div className="key-cell" key={s.display}>
              <StatNum className="stat-num--cell" display={s.display} parsed={splitDisplay(s.display)} />
              <span className="stat-label" data-anim>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// The number element renders the FINAL display string three ways: a hidden
// in-flow copy reserves the final width (no layout shift while counting), an
// aria-hidden overlay carries the animated count, and a visually-hidden copy
// keeps the real value in the accessibility tree.
function StatNum({
  className,
  display,
  parsed,
}: {
  className: string;
  display: string;
  parsed: ReturnType<typeof splitDisplay>;
}) {
  const style = { "--stat-w": `${display.length}ch` } as CSSProperties;
  return (
    <span className={`stat-num ${className}`} style={style} data-anim>
      <span className="stat-num-final" aria-hidden="true">
        {display}
      </span>
      <span
        className="stat-num-anim"
        aria-hidden="true"
        data-value={parsed.value}
        data-num={parsed.suffix ? display.slice(0, display.length - parsed.suffix.length) : display}
        data-suffix={parsed.suffix}
        data-grouped={parsed.grouped ? "1" : "0"}
        data-final={display}
      >
        {display}
      </span>
      <span className="visually-hidden">{display}</span>
    </span>
  );
}
