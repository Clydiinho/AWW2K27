import { useMemo } from "react";
import { site } from "../content/site";
import LiquidEther from "./LiquidEther";
import "./HeroSection.css";

// Landing hero: invitation copy over the LiquidEther gold fluid backdrop.
// Editorial content beyond this ships in a later step.
export default function HeroSection() {
  const copy = site.invitation;
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  // Approved three-line lockup: WELCOME / TO AFRICA / WATCH WEEK,
  // with "WELCOME TO" in sans and the rest in Griffiths. The verbatim
  // string in site.ts is never altered; only grouping and per-word
  // styling live here.
  const headlineWords = copy.headline.split(" ");
  const headlineLines: number[][] = [[0], [1, 2], [3, 4]];
  const isSansWord = (i: number) => i < 2;

  return (
    <section className="hero" aria-labelledby="hero-headline">
      {!reducedMotion && (
        <div className="hero-ether" aria-hidden="true">
          <LiquidEther
            colors={["#000000", "#eab308", "#000000"]}
            mouseForce={11}
            cursorSize={75}
            persistence={0.75}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            intensity={0.85}
          />
        </div>
      )}
      <p className="hero-eyebrow">{copy.eyebrow}</p>
      <h1 id="hero-headline" className="hero-headline">
        {headlineLines.map((line, li) => (
          <span key={li} className="hero-line">
            {line.map((wi, k) => (
              <span
                key={k}
                className={isSansWord(wi) ? undefined : "hero-headline-serif"}
              >
                {headlineWords[wi]}
                {k < line.length - 1 ? " " : ""}
              </span>
            ))}
          </span>
        ))}
      </h1>
      <p className="hero-tagline">{copy.tagline}</p>
      <div className="hero-scroll" aria-hidden="true">
        <svg className="hero-scroll-ring" viewBox="0 0 100 100">
          <defs>
            <path
              id="scroll-ring-path"
              fill="none"
              d="M 50 50 m -38 0 a 38 38 0 1 1 76 0 a 38 38 0 1 1 -76 0"
            />
          </defs>
          <text>
            <textPath
              href="#scroll-ring-path"
              textLength="237"
              lengthAdjust="spacingAndGlyphs"
            >
              {copy.scrollCta}
            </textPath>
          </text>
        </svg>
        <svg className="hero-scroll-arrow" viewBox="0 0 24 24">
          <path d="M12 5.5 v13 M6.5 13 l5.5 5.5 L17.5 13" />
        </svg>
      </div>
    </section>
  );
}
