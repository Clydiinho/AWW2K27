import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { site, COPY_VERSION, type StoryChapter, type StoryChapterCopy } from "../content/site";
import { ShineBorder } from "../components/ui/shine-border";
import { NextLink } from "../components/NextLink";
import { CtaButton } from "../components/CtaButton";
import Thread from "../components/Thread";
import { useStoryEngine, type EngineState } from "./use-frames";
import { createRunner } from "./story-runner";
import "./StoryScroll.css";

// Review-only controls (remove before launch, like ?pp / ?story):
//   ?review=1       shows the "DRAFT COPY" tag on draft cards (card 05)
//   ?buttons=hover  forces CtaButtons (full-copy cards) into their hovered look
//   ?links=hover    forces NextLinks (short-copy cards) into their hovered look
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
    const onStory = (p: number) => {
      section.style.setProperty("--story-p", p.toFixed(4));
    };
    if (state.mode === "poster") {
      setClass(null);
      return;
    }
    if (!state.manifest) return;
    if (!canvasRef.current) return;
    // the hide-on-hero CSS states match data-active="" — seed the attribute
    // before the runner's first pass (null is the runner's initial value, so
    // computeActive alone would never emit the change)
    setClass(null);
    const runner = createRunner({
      section,
      canvas: canvasRef.current,
      state: () => stateRef.current,
      onActive: setClass,
      onStory: onStory,
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
      <Thread parentRef={sectionRef as RefObject<HTMLElement | null>} />
      <div className="story-track">
        {chapters.map((ch) => {
          // verbatim copy per chapter, versioned (full = approved client copy,
          // short = interim copy awaiting client approval); see site.ts
          const data = copy.chapters.find(x => x.id === ch.id);
          const c = data?.copy[COPY_VERSION] as StoryChapterCopy | undefined;
          const paras: string[] = Array.isArray(c?.body) ? c.body : c?.body ? [c.body] : [];
          const cta = c && "cta" in c ? c.cta : undefined;
          const next = c && "next" in c ? c.next : undefined;
          const bandNow = ch.id === "05" ? "var(--story-band-05)" : band;
          return (
            <section
              key={ch.id}
              id={`chapter-${ch.id}`}
              className="story-chapter"
              data-chapter={ch.id}
              data-active={activeId === ch.id ? "1" : "0"}
              aria-labelledby={`chapter-${ch.id}-title`}
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
                className={panelClassName(ch.id, chapters, data)}
                borderRadius={28}
                borderWidth={1}
                duration={14}
                color={["#d8b97a", "#f1ebe0", "#b08a5b"]}
              >
                <div className="story-panel-tilt">
                  <header className="story-panel-head">
                    <p className="story-panel-eyebrow">{data?.eyebrow}</p>
                    <h2 id={`chapter-${ch.id}-title`} className="story-panel-headline">{data?.headline}</h2>
                  </header>
                  <div className="story-panel-glass">
                    {c?.subline && <p className="story-panel-subline">{c.subline}</p>}
                    {c?.lead && <p className="story-panel-lead">{c.lead}</p>}
                    {paras.map((para, i) => (
                      <p key={i} className="story-panel-body">{para}</p>
                    ))}
                    {c?.triplet && <p className="story-panel-triplet">{c.triplet}</p>}
                    {c?.rooms?.map(room => (
                      <div key={room.label} className="story-panel-room">
                        <span className="story-panel-room-label">{room.label}</span>
                        <p className="story-panel-room-text">{room.text}</p>
                      </div>
                    ))}
                    {c?.closing && <p className="story-panel-closing">{c.closing}</p>}
                    {data?.draft && review && <p className="story-panel-draft">DRAFT COPY</p>}
                  </div>
                  {cta ? (
                    <CtaButton label={cta.label} href={cta.href} />
                  ) : next ? (
                    <NextLink label={next.label} href={next.href} />
                  ) : null}
                </div>
              </ShineBorder>
            </section>
          );
        })}
      </div>
    </section>
  );
}

// Tall copy cards (02, 03, 04) sit in normal flow so their text scrolls
// through over the pinned canvas; only the short draft card 05 stays pinned.
const FLOW_CHAPTERS = new Set(["02", "03", "04"]);

function panelClassName(chId: string, chapters: { id: string }[], data?: StoryChapter): string {
  const classes = ["story-panel"];
  if (chId === chapters[0]?.id) classes.push("story-panel--enter");
  classes.push(`story-panel--${panelSide(chId)}`);
  if (FLOW_CHAPTERS.has(chId)) classes.push("story-panel--flow");
  else classes.push("story-panel--pin");
  if (data?.draft) classes.push("story-panel--draft");
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
