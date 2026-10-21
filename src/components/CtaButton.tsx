import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import "./CtaButton.css";

interface CtaButtonProps {
  label: string;
  href: string;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}

// Review-only control (remove before launch, like ?pp / ?story): ?buttons=hover
// forces every CtaButton into its hovered look without a real hover.
function readForceHover(): boolean {
  if (typeof window === "undefined" || typeof URLSearchParams === "undefined") return false;
  return new URLSearchParams(window.location.search).get("buttons") === "hover";
}

const forceHover = readForceHover();

// The arrow is drawn by the component (inline SVG, aria-hidden) so the
// accessible name is the label text alone; site.ts keeps the full copy
// INCLUDING the " →" — it is stripped for display only.
const ARROW_STEM = "M1 8h13";
const ARROW_HEAD = "M9 3l5 5-5 5";

function Arrow({ plus }: { plus?: boolean }) {
  return (
    <svg
      className={cn("cta-button-arrow", plus && "cta-button-arrow--in")}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ARROW_STEM} />
      <path d={ARROW_HEAD} />
    </svg>
  );
}

export function CtaButton({ label, href, variant = "primary", disabled = false }: CtaButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const text = label.replace(/\s*→\s*$/, "").trim();

  // Touch devices have no hover: play the diamond glint exactly once when the
  // button first scrolls into view (one shared pattern; one run per button).
  useEffect(() => {
    const el = ref.current;
    if (!el || forceHover || disabled) return;
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          el.classList.add("cta-button--glint-run");
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [disabled]);

  if (disabled) {
    return (
      <span className={cn("cta-button", "cta-button--disabled")} aria-disabled="true" tabIndex={-1}>
        {text}
      </span>
    );
  }

  return (
    <a
      ref={ref}
      href={href}
      className={cn(
        "cta-button",
        variant === "ghost" && "cta-button--ghost",
        forceHover && "cta-button--forced",
      )}
    >
      <span className="cta-button-fill" aria-hidden="true" />
      <span className="cta-button-inner">
        <span className="cta-button-label-clip">
          <span className="cta-button-label">{text}</span>
          <span className="cta-button-label cta-button-label--dark" aria-hidden="true">{text}</span>
        </span>
        <span className="cta-button-arrow-clip" aria-hidden="true">
          <Arrow />
          <Arrow plus />
        </span>
      </span>
      <span className="cta-button-glint" aria-hidden="true" />
    </a>
  );
}
