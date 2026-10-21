import { useEffect, useRef, useState, type CSSProperties } from "react";
import { site, type StoryChapterCopy } from "../content/site";
import { ShineBorder } from "../components/ui/shine-border";
import { CtaButton } from "../components/CtaButton";
import { useStoryEngine, type EngineState } from "./use-frames";
import { createRunner } from "./story-runner";
import "./StoryScroll.css";

// Review-only controls (remove before launch, like ?pp / ?story):
//   ?review=1      shows the "DRAFT COPY" tag on draft cards (card 05)
//   ?buttons=hover forces CtaButtons into their hovered look
function readReviewFlag(): boolean {
  if (typeof window === "undefined" || typeof URLSearchParams === "undefined") return false;
  return new URLSearchParams(window.location.search).get("review") === "1";
}

export default function StoryScroll() {
  const { state, engineRef } = useStoryEngine();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<EngineState>(state);
  stateRef.current = state;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [review] = useState(() => readReviewFlag());

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const setClass = (id: string | null) => {
      section.dataset.active = id ?? "";
      setActiveId(id);
    };
    const onFinale = (q: number) => {
      section.style.setProperty("--finale-p", `${q}`);
    };
    if (state.mode === "poster") {
      setClass(null);
      return;
    }
    if (!state.manifest) return;
    if (!canvasRef.current) return;
    const runner = createRunner({
      section,
      canvas: canvasRef.current,
      state: () => stateRef.current,
      onActive: setClass,
      onFinale,
      ensure: id => engineRef.current?.ensure(id),
    });
    runner.start();
    return () => runner.stop();
    // re-create when engine mode changes or the manifest first arrives; latest
    // state flows via ref
  }, [state.mode, state.manifest]);

  // 3D hover tilt on the cards: pointer position drives rotateX/rotateY via
  // CSS custom properties — transform only, and skipped for reduced motion
  // and coarse pointers.
  useEffect(() => {
    if (state.manifest === null) return;
    const track = sectionRef.current?.querySelector<HTMLElement>(".story-track");
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const MAX_TILT = 4; // degrees
    const onMove = (ev: PointerEvent) => {
      const card = (ev.target as HTMLElement)?.closest?.(".story-panel") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      const cx = (ev.clientX - r.left) / r.width - 0.5;
      const cy = (ev.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--tilt-y", `${(cx * MAX_TILT * 2).toFixed(2)}deg`);
      card.style.setProperty("--tilt-x", `${(-cy * MAX_TILT * 2).toFixed(2)}deg`);
      card.style.setProperty("--tilt-s", "1.045");
    };
    const onLeave = (ev: PointerEvent) => {
      const card = (ev.target as HTMLElement)?.closest?.(".story-panel") as HTMLElement | null;
      if (!card) return;
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-s", "1");
    };
    track.addEventListener("pointermove", onMove, { passive: true });
    track.addEventListener("pointerout", onLeave, { passive: true });
    return () => {
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerout", onLeave);
    };
  }, [state.manifest]);

  const copy = site.story;
  const chapters = state.manifest?.chapters ?? [];
  const posterMode = state.mode === "poster";
  const band = `var(--story-band)`;

  if (!state.manifest) {
    return <section className="story story--pending" ref={sectionRef} aria-label="The story" />;
  }

  return (
    <section
      className={posterMode ? "story story--poster" : "story"}
      ref={sectionRef}
      aria-label="AFRICA WATCH WEEK story"
    >
      {!posterMode && (
        <div className="story-stage" aria-hidden="true">
          <canvas ref={canvasRef} className="story-canvas" />
        </div>
      )}
      <div className="story-track">
        {chapters.map((ch) => {
          const c = copy.chapters.find(x => x.id === ch.id);
          const bandNow = ch.id === "05" ? "var(--story-band-05)" : band;
          return (
            <section
              key={ch.id}
              id={`chapter-${ch.id}`}
              className="story-chapter"
              data-chapter={ch.id}
              data-active={activeId === ch.id ? "1" : "0"}
              style={{ height: `${ch.scrollVh}vh` } as CSSProperties}
            >
              {posterMode && (
                <figure className="story-poster-fig" style={{ background: bandNow }}>
                  <img
                    src={`/story/${tierName()}/${ch.id}/${tierName() === "mobile" ? ch.posterMobile : ch.poster}`}
                    alt=""
                    loading="lazy"
                  />
                </figure>
              )}
              <ShineBorder
                className={panelClassName(ch.id, chapters, c)}
                borderRadius={28}
                borderWidth={1}
                duration={14}
                color={["#d8b97a", "#f1ebe0", "#b08a5b"]}
              >
                <div className="story-panel-tilt">
                  <p className="story-panel-eyebrow">{c?.eyebrow}</p>
                  <h2 className="story-panel-headline">{c?.headline}</h2>
                  {c?.subline && <p className="story-panel-subline">{c.subline}</p>}
                  {c?.lead && <p className="story-panel-lead">{c.lead}</p>}
                  {c?.body?.map((para, i) => (
                    <p key={i} className="story-panel-body">{para}</p>
                  ))}
                  {c?.triplet && <p className="story-panel-triplet">{c.triplet}</p>}
                  {c?.rooms?.map(room => (
                    <div key={room.label} className="story-panel-room">
                      <span className="story-panel-room-label">{room.label}</span>
                      <p className="story-panel-room-text">{room.text}</p>
                    </div>
                  ))}
                  <p className="story-panel-closing">{c?.closing}</p>
                  {c?.cta && <CtaButton label={c.cta.label} href={c.cta.href} />}
                  {c?.draft && review && <p className="story-panel-draft">DRAFT COPY</p>}
                </div>
              </ShineBorder>
            </section>
          );
        })}
      </div>
      {chapters.some(c => c.id === "05") && (
        <div className="story-finale" data-finale="ch05" data-static={posterMode ? "1" : "0"}>
          <div className="story-finale-stage" aria-hidden="true">
            <svg className="finale-ring" viewBox="0 0 200 200">
              <circle className="finale-ring-circle" cx="100" cy="100" r="88" pathLength="100" />
            </svg>
            <div className="finale-dial">
              {FINALE_TICKS.map(i => (
                <span key={i} className={`finale-tick finale-tick--${i}`} />
              ))}
              <span className="finale-dial-hand" />
              <span className="finale-dial-pivot" />
            </div>
            <div className="story-finale-cta">
              <a href="#register" className="finale-cta-button" aria-label={site.story.finale.ctaAria}>
                {site.story.finale.cta}
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Tall copy cards (02, 03, 04) sit in normal flow so their text scrolls
// through over the pinned canvas; only the short draft card 05 stays pinned.
const FLOW_CHAPTERS = new Set(["02", "03", "04"]);

function panelClassName(chId: string, chapters: { id: string }[], c?: StoryChapterCopy): string {
  const classes = ["story-panel"];
  if (chId === chapters[0]?.id) classes.push("story-panel--enter");
  classes.push(`story-panel--${panelSide(chId)}`);
  if (FLOW_CHAPTERS.has(chId)) classes.push("story-panel--flow");
  else classes.push("story-panel--pin");
  if (c?.draft) classes.push("story-panel--draft");
  return classes.join(" ");
}

function panelSide(chId: string): string {
  if (chId === "02") return "right";
  if (chId === "03") return "left";
  if (chId === "04") return "left";
  return "right";
}

function tierName(): "desktop" | "mobile" {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 860px)").matches ? "mobile" : "desktop";
}

const FINALE_TICKS = Array.from({ length: 12 }, (_, i) => i);
