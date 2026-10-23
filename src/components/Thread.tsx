import { useEffect, useRef, type RefObject } from "react";
import "./Thread.css";

// One node per chapter, in scrub order. Numbers shown next to each node are
// derived from the chapter ids (decorative, aria-hidden — the whole layer is).
const THREAD_CHAPTERS = ["02", "03", "04", "05"];

interface ThreadProps {
  parentRef: RefObject<HTMLElement | null>;
}

// Decorative story thread: a fixed thin gold line that draws itself through
// the chapter scroll, with a diamond at each chapter's start. Geometry is
// measured ONCE here (ResizeObserver + fonts.ready) — never in the scroll or
// animation path. The drawn length is driven by --story-p, written by the
// EXISTING story scrub loop; node states come from the section's data-active
// attribute, which changes only when the active chapter changes.
export default function Thread({ parentRef }: ThreadProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const section = parentRef.current;
    if (!root || !section) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>(".thread-node"));
    const nums = Array.from(root.querySelectorAll<HTMLElement>(".thread-num"));
    const idBox = (id: string) => {
      const el = section.querySelector<HTMLElement>(`[data-chapter="${id}"]`);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { top: rect.top + window.scrollY, height: el.offsetHeight };
    };

    // cache: section pin + chapter-02 start + chapter-05 end -> node positions
    // as a percentage of the total story scroll
    const measure = () => {
      const s02 = idBox("02");
      const s05 = idBox("05");
      if (!s02 || !s05) return;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const pin = section.getBoundingClientRect().top + y;
      const storyStart = Math.max(s02.top - vh, pin);
      const storyEnd = Math.max(storyStart + 1, s05.top + s05.height - vh);
      THREAD_CHAPTERS.forEach((id, i) => {
        const node = nodes[i];
        const ch = idBox(id);
        if (!node || !ch) return;
        const anchor = Math.max(ch.top - vh, pin);
        const p = Math.max(0, Math.min(1, (anchor - storyStart) / (storyEnd - storyStart)));
        node.style.setProperty("--node-top", `${(p * 100).toFixed(4)}%`);
        nums[i]?.style.setProperty("--node-top", `${(p * 100).toFixed(4)}%`);
      });
    };

    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(document.body);
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(measure, () => undefined);
    }

    // pause the current node's pulse while the tab is hidden
    const visibility = () => root.classList.toggle("thread--paused", document.hidden);
    visibility();

    document.addEventListener("visibilitychange", visibility);

    return () => {
      ro?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [parentRef]);

  return (
    <div className="thread" aria-hidden="true" ref={rootRef}>
      <span className="thread-rail" />
      <span className="thread-drawer" />
      {THREAD_CHAPTERS.map((id, i) => (
        <span key={id} className="thread-node" data-i={i}>
          <span className="thread-node-gem" />
          <span className="thread-node-ring" />
        </span>
      ))}
      {THREAD_CHAPTERS.map((id, i) => (
        <span key={id} className="thread-num" data-i={i}>
          {id}
        </span>
      ))}
    </div>
  );
}
