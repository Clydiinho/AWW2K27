import { useEffect, useRef, useState, type MouseEvent } from "react";
import { slowScrollTo } from "../story/next-scroll";
import "./NextLink.css";

// Review-only control (remove before launch, like ?pp / ?buttons): forces the
// hovered look so it can be checked on a touch device without hovering.
function readForceHover(): boolean {
  if (typeof window === "undefined" || typeof URLSearchParams === "undefined") return false;
  return new URLSearchParams(window.location.search).get("links") === "hover";
}

interface NextLinkProps {
  label: string;
  href: string;
  disabled?: boolean;
}

// Small chapter-to-chapter text link. The line under the label draws itself
// once when the link first enters the viewport (IntersectionObserver, one
// time); hover/focus extends it past the label with a diamond riding the end.
export function NextLink({ label, href, disabled = false }: NextLinkProps) {
  const [drawn, setDrawn] = useState(false);
  const [forceHover] = useState(readForceHover);
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    // reduced motion: the line is already drawn
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [disabled]);

  const onClick = (ev: MouseEvent<HTMLAnchorElement>) => {
    if (disabled || ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    // helper handled it (or can't): only preventDefault when we scroll ourselves,
    // so the plain anchor jump remains the fallback
    if (slowScrollTo(href)) ev.preventDefault();
  };

  return (
    <a
      ref={ref}
      href={disabled ? undefined : href}
      onClick={onClick}
      className={`next-link${drawn ? " next-link--drawn" : ""}${forceHover ? " next-link--forced" : ""}${disabled ? " next-link--disabled" : ""}`}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
    >
      <span className="next-link-label">{label}</span>
      <svg className="next-link-arrow" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
        <path d="M1 7h11M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span className="next-link-diamond" aria-hidden="true" />
    </a>
  );
}
