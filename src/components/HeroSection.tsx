import { useRef } from "react";
import { site } from "../content/site";
import ScrollBadge from "./ScrollBadge";
import "./HeroSection.css";

// Landing hero: solid black background with the invitation copy inside the
// glass card. Editorial copy stays verbatim in site.ts; only grouping and
// per-word styling live here.
export default function HeroSection() {
  const copy = site.invitation;
  const sectionRef = useRef<HTMLElement>(null);

  // Approved three-line lockup: WELCOME / TO AFRICA / WATCH WEEK,
  // with "WELCOME TO" in sans and the rest in Griffiths. The verbatim
  // string in site.ts is never altered; only grouping and per-word
  // styling live here.
  const headlineWords = copy.headline.split(" ");
  const headlineLines: number[][] = [[0], [1, 2], [3, 4]];
  const isSansWord = (i: number) => i < 2;

  return (
    <section
      id="chapter-01"
      ref={sectionRef}
      className="hero"
      aria-labelledby="hero-headline"
    >
      <div className="hero-stage">
        <div className="hero-card">
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
        </div>
        <ScrollBadge />
      </div>
    </section>
  );
}
