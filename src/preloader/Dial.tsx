import type { RefObject } from "react";
import { BRAND_SUB_TEXT, BRAND_SUB_Y, BRAND_TEXT, BRAND_Y, SPARKLE_TINT_CYAN, SPARKLE_TINT_ROSE } from "./config";

export const CX = 200;
export const CY = 200;
const ARC_R = 156;
export const ARC_C = 2 * Math.PI * ARC_R;

function polar(r: number, degFrom12: number): { x: number; y: number } {
  const a = (degFrom12 * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

type DialProps = {
  handRef: RefObject<SVGGElement | null>;
  arcRef: RefObject<SVGCircleElement | null>;
  sparked: boolean[];
  finale: boolean;
  shimmer: boolean;
  reducedMotion: boolean;
};

function HourDiamond({ angle, large, lit, index, reducedMotion }: { angle: number; large: boolean; lit: boolean; index: number; reducedMotion: boolean }) {
  // Baguette marker in a polished gold chaton, after haute-horlogerie dials.
  const w = large ? 12 : 10;
  const h = large ? 24 : 20;
  const hw = w / 2;
  const hh = h / 2;
  const iw = w - 3;
  const ih = h - 3;
  return (
    <g transform={`rotate(${angle} ${CX} ${CY}) translate(${CX} ${CY - 126})`}>
      {/* lingering halo once the hand has passed (opacity only) */}
      <circle
        r={large ? 20 : 17}
        fill="url(#haloGlow)"
        className={lit ? "pp-halo-lit" : "pp-halo"}
      />
      <rect
        x={-hw - 1.4}
        y={-hh - 1.4}
        width={w + 2.8}
        height={h + 2.8}
        rx={1.2}
        fill="url(#chatonGrad)"
        stroke="#f4e2b8"
        strokeWidth={0.5}
        opacity={0.95}
      />
      <rect
        x={-iw / 2}
        y={-ih / 2}
        width={iw}
        height={ih}
        fill="url(#diamondGrad)"
        opacity={lit ? 1 : 0.92}
        className={lit ? "pp-hour-lit" : reducedMotion ? "pp-hour-dim" : "pp-hour-dim pp-hour-idle"}
        style={lit || reducedMotion ? undefined : { animationDelay: `${(index % 12) * 0.35}s` }}
      />
      {/* step-cut facets */}
      <line x1={-iw / 2} y1={-ih / 4} x2={iw / 2} y2={-ih / 4} stroke="#ffffff" strokeWidth={0.5} opacity={lit ? 0.9 : 0.55} />
      <line x1={-iw / 2} y1={0} x2={iw / 2} y2={0} stroke="#8fa3bd" strokeWidth={0.5} opacity={lit ? 0.9 : 0.5} />
      <line x1={-iw / 2} y1={ih / 4} x2={iw / 2} y2={ih / 4} stroke="#ffffff" strokeWidth={0.5} opacity={lit ? 0.9 : 0.55} />
      {/* table light down the left edge */}
      <rect x={-iw / 2 + 0.7} y={-ih / 2 + 0.7} width={1.5} height={ih - 1.4} fill="#ffffff" opacity={lit ? 0.9 : 0.6} />
      <line
        x1={0}
        y1={-ih / 2}
        x2={0}
        y2={ih / 2}
        stroke="#ffffff"
        strokeWidth={0.6}
        opacity={lit ? 0.9 : 0.5}
      />
    </g>
  );
}

function SparkleStar({ x, y, delayMs, animate }: { x: number; y: number; delayMs: number; animate: boolean }) {
  if (!animate) {
    // Reduced motion: simple bright dot, no star animation.
    return <circle cx={x} cy={y} r={5} fill="#eaf3ff" opacity={0.9} />;
  }
  return (
    <g
      transform={`translate(${x} ${y})`}
      className="pp-sparkle"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <circle r={16} fill="url(#sparkleGlow)" opacity={0.55} />
      <path
        d="M1.5 0 A13 13 0 0 0 -1.5 0 A13 13 0 0 0 1.5 0"
        fill={SPARKLE_TINT_ROSE}
        opacity={0.35}
        transform="translate(1.5 0)"
      />
      <path
        d="M1.5 0 A13 13 0 0 0 -1.5 0 A13 13 0 0 0 1.5 0"
        fill={SPARKLE_TINT_CYAN}
        opacity={0.35}
        transform="translate(-1.5 0)"
      />
      <path
        d="M0 -16 C2 -4 4 -2 16 0 C4 2 2 4 0 16 C-2 4 -4 2 -16 0 C-4 -2 -2 -4 0 -16 Z"
        fill="#ffffff"
        opacity={0.98}
      />
      <path
        d="M0 -16 C2 -4 4 -2 16 0 C4 2 2 4 0 16 C-2 4 -4 2 -16 0 C-4 -2 -2 -4 0 -16 Z"
        fill="#ffffff"
        opacity={0.75}
        transform="rotate(45) scale(0.45)"
      />
      <path
        d="M0 -16 C2 -4 4 -2 16 0 C4 2 2 4 0 16 C-2 4 -4 2 -16 0 C-4 -2 -2 -4 0 -16 Z"
        fill="none"
        stroke="#eaf3ff"
        strokeWidth={0.6}
        opacity={0.8}
      />
    </g>
  );
}

export default function Dial({ handRef, arcRef, sparked, finale, shimmer, reducedMotion }: DialProps) {
  const bezelStones = Array.from({ length: 36 }, (_, i) => {
    const p = polar(177, i * 10);
    return { ...p, i };
  });
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = i * 6;
    const major = i % 5 === 0;
    const r1 = major ? 143.5 : 146;
    const r2 = 152;
    const p1 = polar(r1, a);
    const p2 = polar(r2, a);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, major, i };
  });
  const sunburst = Array.from({ length: 180 }, (_, i) => {
    const a = i * 2;
    const p1 = polar(24, a);
    const p2 = polar(158, a);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, i, o: i % 2 === 0 ? 0.09 : 0.05 };
  });
  const hours = Array.from({ length: 12 }, (_, i) => {
    const p = polar(126, i * 30);
    return { ...p, angle: i * 30, i };
  });
  const sheenP1 = polar(177, -70);
  const sheenP2 = polar(177, 70);

  return (
    <svg
      viewBox="0 0 400 400"
      className="pp-dial"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <defs>
        <radialGradient id="faceGrad" cx="0.5" cy="0.46" r="0.62">
          <stop offset="0" stopColor="#211b14" />
          <stop offset="0.55" stopColor="#12100c" />
          <stop offset="1" stopColor="#080706" />
        </radialGradient>
        <linearGradient id="brandShine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b08a5b" />
          <stop offset="1" stopColor="#ecd9ac" />
        </linearGradient>
        <linearGradient id="chatonGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4e2b8" />
          <stop offset="0.5" stopColor="#d8b97a" />
          <stop offset="1" stopColor="#8a6a42" />
        </linearGradient>
        <linearGradient id="diamondGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#d7e6f7" />
          <stop offset="1" stopColor="#8fa3bd" />
        </linearGradient>
        <radialGradient id="sparkleGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="haloGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7e6" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#f4e2b8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f4e2b8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pinGrad" cx="0.38" cy="0.34" r="0.8">
          <stop offset="0" stopColor="#f4e2b8" />
          <stop offset="0.6" stopColor="#b08a5b" />
          <stop offset="1" stopColor="#5f4a2e" />
        </radialGradient>
      </defs>

      {/* background glow */}
      <circle cx={CX} cy={CY} r={198} fill="url(#faceGrad)" opacity={0.35} />
      <circle cx={CX} cy={CY} r={198} fill="none" stroke="#16120d" strokeWidth={2} opacity={0.8} />

      {/* bezel: dark diamond-set band with fine champagne hairlines */}
      <circle cx={CX} cy={CY} r={190} fill="#0d0b09" />
      <circle cx={CX} cy={CY} r={189.5} fill="none" stroke="#d8b97a" strokeWidth={1.2} opacity={0.6} />
      <circle cx={CX} cy={CY} r={164} fill="none" stroke="#d8b97a" strokeWidth={1} opacity={0.5} />

      {/* bezel diamonds: idle twinkle */}
      <g>
        {bezelStones.map((s) => (
          <g key={s.i} transform={`translate(${s.x} ${s.y})`}>
            <circle
              r={2.1 + (s.i % 3) * 0.35}
              fill="#eaf3ff"
              opacity={0.85}
              className={reducedMotion ? undefined : "pp-bezel-stone"}
              style={reducedMotion ? undefined : { animationDelay: `${(s.i % 12) * 0.55 + (s.i % 3) * 0.22}s` }}
            />
            <circle cx={-0.6} cy={-0.6} r={0.7} fill="#ffffff" opacity={0.9} />
          </g>
        ))}
      </g>
      {/* top-light sheen across the band (static) */}
      <path
        d={`M${sheenP1.x} ${sheenP1.y} A177 177 0 0 1 ${sheenP2.x} ${sheenP2.y}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={13}
        opacity={0.05}
      />

      {/* dial face */}
      <circle cx={CX} cy={CY} r={162} fill="url(#faceGrad)" />
      <circle cx={CX} cy={CY} r={162} fill="none" stroke="#2a231a" strokeWidth={1} opacity={0.9} />

      {/* sunburst hairlines */}
      <g opacity={1}>
        {sunburst.map((l) => (
          <line
            key={l.i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#b08a5b"
            strokeWidth={0.4}
            opacity={l.o}
          />
        ))}
      </g>

      {/* minute track: applied-gold batons on a chapter step */}
      <circle cx={CX} cy={CY} r={158.5} fill="none" stroke="#d8b97a" strokeWidth={0.5} opacity={0.3} />
      <g>
        {ticks.map((t) => (
          <line
            key={t.i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="#d8b97a"
            strokeWidth={t.major ? 1.3 : 0.7}
            opacity={t.major ? 0.65 : 0.38}
          />
        ))}
      </g>
      <circle cx={CX} cy={CY} r={ARC_R} fill="none" stroke="#b08a5b" strokeWidth={0.6} opacity={0.35} />

      {/* progress arc */}
      <circle
        ref={arcRef}
        cx={CX}
        cy={CY}
        r={ARC_R}
        fill="none"
        stroke="url(#arcGrad)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={`${ARC_C}`}
        strokeDashoffset={`${ARC_C}`}
        transform={`rotate(-90 ${CX} ${CY})`}
        opacity={0.95}
      />

      {/* brand signature under hand: ink shadow, ivory monogram, ruled microline */}
      <g>
        <text
          x={204}
          y={BRAND_Y + 0.7}
          textAnchor="middle"
          className="pp-brand"
          fill="#000000"
          opacity={0.55}
        >
          {BRAND_TEXT}
        </text>
        <text
          x={204}
          y={BRAND_Y}
          textAnchor="middle"
          className="pp-brand"
          style={{ fill: "var(--color-ivory)" }}
        >
          {BRAND_TEXT}
        </text>
        <line x1={98} y1={BRAND_SUB_Y - 3.5} x2={124} y2={BRAND_SUB_Y - 3.5} stroke="#d8b97a" strokeWidth={0.8} opacity={0.6} />
        <rect x={90.4} y={BRAND_SUB_Y - 5.1} width={3.2} height={3.2} transform={`rotate(45 92 ${BRAND_SUB_Y - 3.5})`} fill="#d8b97a" opacity={0.7} />
        <line x1={276} y1={BRAND_SUB_Y - 3.5} x2={302} y2={BRAND_SUB_Y - 3.5} stroke="#d8b97a" strokeWidth={0.8} opacity={0.6} />
        <rect x={306.4} y={BRAND_SUB_Y - 5.1} width={3.2} height={3.2} transform={`rotate(45 308 ${BRAND_SUB_Y - 3.5})`} fill="#d8b97a" opacity={0.7} />
        <text
          x={202}
          y={BRAND_SUB_Y}
          textAnchor="middle"
          className="pp-brand-sub"
          style={{ fill: "var(--color-gold)" }}
          opacity={0.8}
        >
          {BRAND_SUB_TEXT}
        </text>
        {shimmer && (
          <text
            x={204}
            y={BRAND_Y}
            textAnchor="middle"
            className="pp-brand-shine"
            fill="url(#brandShine)"
          >
            {BRAND_TEXT}
          </text>
        )}
      </g>

      {/* hour diamonds */}
      <g>
        {hours.map((h) => (
          <HourDiamond
            key={h.i}
            angle={h.angle}
            large={h.i % 3 === 0}
            lit={!!sparked[h.i]}
            index={h.i}
            reducedMotion={reducedMotion}
          />
        ))}
      </g>

      {/* hand shadow + hand */}
      <g ref={handRef} transform={`rotate(0 ${CX} ${CY})`}>
        <g transform="translate(2.5 3)" opacity={0.32}>
          <path
            d={`M${CX} ${CY - 138} L${CX + 3.5} ${CY - 80} L${CX + 5} ${CY - 15} L${CX + 3} ${CY} L${CX + 3} ${CY + 28} L${CX - 3} ${CY + 28} L${CX - 3} ${CY} L${CX - 5} ${CY - 15} L${CX - 3.5} ${CY - 80} Z`}
            fill="#000000"
          />
        </g>
        <path
          d={`M${CX} ${CY - 138} L${CX - 3.5} ${CY - 80} L${CX - 5} ${CY - 15} L${CX - 3} ${CY} L${CX - 3} ${CY + 28} L${CX} ${CY + 28} Z`}
          fill="#f4e2b8"
          opacity={0.95}
        />
        <path
          d={`M${CX} ${CY - 138} L${CX + 3.5} ${CY - 80} L${CX + 5} ${CY - 15} L${CX + 3} ${CY} L${CX + 3} ${CY + 28} L${CX} ${CY + 28} Z`}
          fill="#8a6a42"
          opacity={0.95}
        />
        <path
          d={`M${CX} ${CY - 138} L${CX + 3.5} ${CY - 80} L${CX + 5} ${CY - 15} L${CX + 3} ${CY} L${CX + 3} ${CY + 28} L${CX - 3} ${CY + 28} L${CX - 3} ${CY} L${CX - 5} ${CY - 15} L${CX - 3.5} ${CY - 80} Z`}
          fill="none"
          stroke="#f4e2b8"
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
        <line
          x1={CX}
          y1={CY - 130}
          x2={CX}
          y2={CY + 22}
          stroke="#fff7e6"
          strokeWidth={0.9}
          opacity={0.8}
        />
      </g>

      {/* centre pin */}
      <circle cx={CX} cy={CY} r={8.5} fill="url(#pinGrad)" stroke="#f4e2b8" strokeWidth={0.8} />
      <circle cx={CX} cy={CY} r={2.6} fill="#eaf3ff" />
      <circle cx={CX - 0.8} cy={CY - 0.8} r={0.9} fill="#ffffff" />

      {/* sparkle layer */}
      <g>
        {hours.map((h) =>
          sparked[h.i] ? (
            <SparkleStar
              key={h.i}
              x={h.x}
              y={h.y}
              delayMs={finale ? h.i * 58 : 0}
              animate={!reducedMotion}
            />
          ) : null
        )}
      </g>
    </svg>
  );
}
