// Slow "NEXT" scroll for NextLink: scrolls to a chapter with a rAF ease so the
// pinned frame sequence plays through instead of jumping. It is completely
// separate from the story scrub loop (which only reacts to window scroll
// events). Any wheel / touch / key / press cancels the animation immediately
// and hands control back to the visitor. Cancel listeners are attached only
// while the scroll is running.

const EASE = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const CANCEL_EVENTS: (keyof WindowEventMap)[] = ["wheel", "touchstart", "touchmove", "keydown", "mousedown"];

let cancelActive: (() => void) | null = null;

function durationFor(distancePx: number): number {
  // ~1px per 1/1.2ms, clamped to 700-2000ms
  return Math.max(700, Math.min(2000, Math.abs(distancePx) / 1.2));
}

function focusTarget(target: HTMLElement) {
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

// Returns false when the helper cannot run (reduced motion, bad target) so the
// caller keeps the default instant anchor jump.
export function slowScrollTo(href: string): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (!href.startsWith("#") || href.length <= 1) return false;
  const target = document.getElementById(href.slice(1));
  if (!target) return false;
  const targetEl: HTMLElement = target;
  if (cancelActive) cancelActive();

  const startY = window.scrollY;
  // section top aligned to the viewport top, matching the plain anchor landing
  const endY = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, Math.round(startY + target.getBoundingClientRect().top)));
  const distance = endY - startY;

  if (Math.abs(distance) < 2) {
    window.history.replaceState(null, "", href);
    focusTarget(target);
    return true;
  }

  let cancelled = false;
  let raf = 0;
  const startedAt = performance.now();
  const duration = durationFor(distance);
  const listenerOpts: AddEventListenerOptions = { passive: true, capture: true };

  const cancel = () => finish(true);
  function stopListeners() {
    for (const ev of CANCEL_EVENTS) window.removeEventListener(ev, cancel, listenerOpts);
  }
  function finish(wasCancelled: boolean) {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(raf);
    stopListeners();
    cancelActive = null;
    if (!wasCancelled) {
      window.history.replaceState(null, "", href);
      focusTarget(targetEl);
    }
  }

  const step = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - startedAt) / duration);
    window.scrollTo(0, Math.round(startY + distance * EASE(t)));
    if (t < 1) raf = requestAnimationFrame(step);
    else finish(false);
  };

  for (const ev of CANCEL_EVENTS) window.addEventListener(ev, cancel, listenerOpts);
  cancelActive = () => finish(true);
  raf = requestAnimationFrame(step);
  return true;
}
