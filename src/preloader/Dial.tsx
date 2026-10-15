import type { RefObject } from "react";
import { BRAND_TEXT, BRAND_Y, SPARKLE_TINT_CYAN, SPARKLE_TINT_ROSE } from "./config";

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

function HourDiamond({ angle, large, lit }: { angle: number; large: boolean; lit: boolean }) {
  const w = large ? 11 : 9;
  const h = large ? 20 : 16;
  const hw = w / 2;
  const hh = h / 2;
  return (
    <g transform={`rotate(${angle} ${CX} ${CY}) translate(${CX} ${CY - 126})`}>
      <polygon
        points={`0,${-hh} ${hw},0 0,${hh} ${-hw},0`}
        fill="url(#diamondGrad)"
        stroke="#b08a5b"
        strokeWidth={large ? 1 : 0.8}
        opacity={lit ? 1 : 0.92}
        className={lit ? "pp-hour-lit" : "pp-hour-dim"}
      />
      <polygon
        points={`0,${-hh} ${hw * 0.45},0 0,${hh} ${-hw * 0.45},0`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={0.6}
        opacity={lit ? 0.95 : 0.55}
      />
      <line x1={-hw} y1={0} x2={hw} y2={0} stroke="#8fa3bd" strokeWidth={0.5} opacity={lit ? 0.9 : 0.5} />
      <line
        x1={0}
        y1={-hh}
        x2={0}
        y2={hh}
        stroke="#ffffff"
        strokeWidth={0.7}
        opacity={lit ? 1 : 0.6}
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
      <circle r={13} fill="url(#sparkleGlow)" opacity={0.55} />
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
        d="M0 -13 C1.6 -3.2 3.2 -1.6 13 0 C3.2 1.6 1.6 3.2 0 13 C-1.6 3.2 -3.2 1.6 -13 0 C-3.2 -1.6 -1.6 -3.2 0 -13 Z"
        fill="#ffffff"
        opacity={0.98}
      />
      <path
        d="M0 -13 C1.6 -3.2 3.2 -1.6 13 0 C3.2 1.6 1.6 3.2 0 13 C-1.6 3.2 -3.2 1.6 -13 0 C-3.2 -1.6 -1.6 -3.2 0 -13 Z"
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
  const sunburst = Array.from({ length: 90 }, (_, i) => {
    const a = i * 4;
    const p1 = polar(24, a);
    const p2 = polar(158, a);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, i };
  });
  const hours = Array.from({ length: 12 }, (_, i) => {
    const p = polar(126, i * 30);
    return { ...p, angle: i * 30, i };
  });

  return (
    <svg
      viewBox="0 0 400 400"
      className="pp-dial"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <defs>
        <linearGradient id="bezelGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a6a42" />
          <stop offset="0.28" stopColor="#d8b97a" />
          <stop offset="0.5" stopColor="#f4e2b8" />
          <stop offset="0.72" stopColor="#b08a5b" />
          <stop offset="1" stopColor="#7d5f3a" />
        </linearGradient>
        <radialGradient id="faceGrad" cx="0.5" cy="0.46" r="0.62">
          <stop offset="0" stopColor="#211b14" />
          <stop offset="0.55" stopColor="#12100c" />
          <stop offset="1" stopColor="#080706" />
        </radialGradient>
        <linearGradient id="handGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4e2b8" />
          <stop offset="0.45" stopColor="#d8b97a" />
          <stop offset="1" stopColor="#8a6a42" />
        </linearGradient>
        <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b08a5b" />
          <stop offset="0.5" stopColor="#ecd9ac" />
          <stop offset="1" stopColor="#b08a5b" />
        </linearGradient>
        <linearGradient id="brandShine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b08a5b" />
          <stop offset="1" stopColor="#ecd9ac" />
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
        <radialGradient id="pinGrad" cx="0.38" cy="0.34" r="0.8">
          <stop offset="0" stopColor="#f4e2b8" />
          <stop offset="0.6" stopColor="#b08a5b" />
          <stop offset="1" stopColor="#5f4a2e" />
        </radialGradient>
      </defs>

      {/* background glow */}
      <circle cx={CX} cy={CY} r={198} fill="url(#faceGrad)" opacity={0.35} />
      <circle cx={CX} cy={CY} r={198} fill="none" stroke="#16120d" strokeWidth={2} opacity={0.8} />

      {/* bezel */}
      <circle cx={CX} cy={CY} r={190} fill="url(#bezelGrad)" />
      <circle cx={CX} cy={CY} r={190} fill="none" stroke="#f4e2b8" strokeWidth={1} opacity={0.5} />
      <circle cx={CX} cy={CY} r={164} fill="none" stroke="#f4e2b8" strokeWidth={1.2} opacity={0.65} />

      {/* bezel diamonds: idle twinkle */}
      <g>
        {bezelStones.map((s) => (
          <g key={s.i} transform={`translate(${s.x} ${s.y})`}>
            <circle
              r={2.2}
              fill="#eaf3ff"
              opacity={0.85}
              className={reducedMotion ? undefined : "pp-bezel-stone"}
              style={reducedMotion ? undefined : { animationDelay: `${(s.i % 12) * 0.55 + (s.i % 3) * 0.22}s` }}
            />
            <circle cx={-0.6} cy={-0.6} r={0.7} fill="#ffffff" opacity={0.9} />
          </g>
        ))}
      </g>

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
            opacity={0.07}
          />
        ))}
      </g>

      {/* minute track */}
      <g>
        {ticks.map((t) => (
          <line
            key={t.i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="#b08a5b"
            strokeWidth={t.major ? 1.2 : 0.7}
            opacity={t.major ? 0.55 : 0.32}
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

      {/* brand text under hand */}
      <g>
        <text
          x={CX}
          y={BRAND_Y}
          textAnchor="middle"
          className="pp-brand"
          fill="url(#brandGrad)"
        >
          {BRAND_TEXT}
        </text>
        {shimmer && (
          <text
            x={CX}
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
          d={`M${CX} ${CY - 138} L${CX + 3.5} ${CY - 80} L${CX + 5} ${CY - 15} L${CX + 3} ${CY} L${CX + 3} ${CY + 28} L${CX - 3} ${CY + 28} L${CX - 3} ${CY} L${CX - 5} ${CY - 15} L${CX - 3.5} ${CY - 80} Z`}
          fill="url(#handGrad)"
          stroke="#f4e2b8"
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
        <line
          x1={CX - 1.2}
          y1={CY - 128}
          x2={CX - 1.2}
          y2={CY - 12}
          stroke="#fff7e6"
          strokeWidth={0.9}
          opacity={0.75}
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
