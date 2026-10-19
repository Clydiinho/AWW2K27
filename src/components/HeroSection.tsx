import { site } from "../content/site";
import "./HeroSection.css";

// Landing hero: invitation copy over the charcoal surface. Editorial
// content beyond this ships in a later step.
export default function HeroSection() {
  const copy = site.invitation;
  // Approved three-line lockup: WELCOME / TO AFRICA / WATCH WEEK,
  // with "WELCOME TO" in sans and the rest in Griffiths. The verbatim
  // string in site.ts is never altered; only grouping and per-word
  // styling live here.
  const headlineWords = copy.headline.split(" ");
  const headlineLines: number[][] = [[0], [1, 2], [3, 4]];
  const isSansWord = (i: number) => i < 2;

  return (
    <section className="hero" aria-labelledby="hero-headline">
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
      <div className="hero-actions">
        <a className="hero-btn hero-btn-primary" href="#invitation">
          {copy.primaryAction}
        </a>
        <a className="hero-btn hero-btn-secondary" href="#colophon">
          {copy.secondaryAction}
        </a>
      </div>
    </section>
  );
}
