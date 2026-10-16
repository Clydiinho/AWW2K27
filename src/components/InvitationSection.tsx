import { useEffect, useRef } from "react";
import { site } from "../content/site";
import { LiquidMetalShader } from "./LiquidMetalShader";
import "./InvitationSection.css";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      el.classList.add("is-visible");
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function InvitationSection() {
  const copy = site.invitation;
  const heroRef = useReveal<HTMLElement>();
  const bodyRef = useReveal<HTMLElement>();
  const creditRef = useReveal<HTMLElement>();
  // Style split only: "WELCOME TO" in sans, "AFRICA WATCH WEEK" in Griffiths,
  // set in the approved three-line lockup. The verbatim string in site.ts
  // is never altered; only grouping and per-word styling live here.
  const headlineWords = copy.headline.split(" ");
  const headlineLines: number[][] = [[0], [1, 2], [3, 4]];
  const isSansWord = (i: number) => i < 2;

  return (
    <>
      <section ref={heroRef} className="chapter-hero reveal" aria-labelledby="chapter-headline">
        <div className="chapter-hero-shader" aria-hidden="true">
          <LiquidMetalShader
            className="chapter-hero-canvas"
            baseColor="#141210"
            metalColor="#9c7c4c"
            highlightColor="#d8b97a"
            distortion={0.55}
            scale={1.1}
            speed={0.45}
            pixelRatio={1.25}
            interactive
          />
        </div>
        <div className="chapter-hero-scrim" aria-hidden="true" />
        <p className="chapter-eyebrow">{copy.eyebrow}</p>
        <h1 id="chapter-headline" className="chapter-headline">
          {headlineLines.map((line, li) => (
            <span key={li} className="chapter-line">
              {line.map((wi, k) => (
                <span
                  key={k}
                  className={isSansWord(wi) ? undefined : "chapter-headline-serif"}
                >
                  {headlineWords[wi]}
                  {k < line.length - 1 ? " " : ""}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p className="chapter-tagline">{copy.tagline}</p>
        <div className="chapter-actions">
          <a className="chapter-btn chapter-btn-primary" href="#invitation">
            {copy.primaryAction}
          </a>
          <a className="chapter-btn chapter-btn-secondary" href="#colophon">
            {copy.secondaryAction}
          </a>
        </div>
      </section>

      <section ref={bodyRef} id="invitation" className="chapter-invitation reveal" aria-label="The invitation">
        <span className="chapter-rule" aria-hidden="true" />
        <p className="chapter-body">{copy.body}</p>
      </section>

      <footer ref={creditRef} id="colophon" className="chapter-colophon reveal">
        <span className="chapter-rule" aria-hidden="true" />
        <p className="chapter-credit">{copy.credit}</p>
      </footer>
    </>
  );
}
