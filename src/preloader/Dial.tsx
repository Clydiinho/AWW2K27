import type { RefObject } from "react";

export const CX = 200;
export const CY = 200;
// Ring radii: outer outline, first inner ring, second inner ring.
export const R_OUTER = 188;
export const R_MID = 162;
export const R_INNER = 138;
export const MARK_R_IN = 119;
export const MARK_R_OUT = 131;
// Full circumferences for the lit-arc overlays (dasharray hides them at p=0).
export const C_OUTER = 2 * Math.PI * R_OUTER;
export const C_MID = 2 * Math.PI * R_MID;
export const C_INNER = 2 * Math.PI * R_INNER;

function polar(r: number, degFrom12: number): { x: number; y: number } {
  const a = (degFrom12 * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

export interface DialRingRefs {
  outer: RefObject<SVGCircleElement | null>;
  mid: RefObject<SVGCircleElement | null>;
  inner: RefObject<SVGCircleElement | null>;
}

type DialProps = {
  handRef: RefObject<SVGGElement | null>;
  rings: DialRingRefs;
  beamRef: RefObject<SVGCircleElement | null>;
  dressRef: RefObject<SVGGElement | null>;
  setMarker: (i: number) => (el: SVGLineElement | null) => void;
};

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const large = i % 3 === 0;
  const r1 = large ? MARK_R_IN - 3 : MARK_R_IN;
  const r2 = large ? MARK_R_OUT + 3 : MARK_R_OUT;
  const p1 = polar(r1, i * 30);
  const p2 = polar(r2, i * 30);
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, i };
});

export default function Dial({ handRef, rings, beamRef, dressRef, setMarker }: DialProps) {
  return (
    <svg
      viewBox="0 0 400 400"
      className="pp-dial"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      {/* dial interior left open: the dimmed backdrop shows through */}

      {/* base outlines: thin and dim until light reaches them */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="#b08a5b" strokeWidth={1} opacity={0.14} />
      <circle cx={CX} cy={CY} r={R_MID} fill="none" stroke="#b08a5b" strokeWidth={1} opacity={0.14} />
      <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="#b08a5b" strokeWidth={1} opacity={0.14} />

      {/* revealed arcs: brightness grows clockwise with the long hand */}
      <circle
        ref={rings.outer}
        cx={CX}
        cy={CY}
        r={R_OUTER}
        fill="none"
        stroke="#d8b97a"
        strokeWidth={1}
        strokeLinecap="round"
        strokeDasharray={`${C_OUTER}`}
        strokeDashoffset={`${C_OUTER}`}
        opacity={0.9}
        transform={`rotate(-90 ${CX} ${CY})`}
      />
      <circle
        ref={rings.mid}
        cx={CX}
        cy={CY}
        r={R_MID}
        fill="none"
        stroke="#d8b97a"
        strokeWidth={1}
        strokeLinecap="round"
        strokeDasharray={`${C_MID}`}
        strokeDashoffset={`${C_MID}`}
        opacity={0.9}
        transform={`rotate(-90 ${CX} ${CY})`}
      />
      <circle
        ref={rings.inner}
        cx={CX}
        cy={CY}
        r={R_INNER}
        fill="none"
        stroke="#d8b97a"
        strokeWidth={1}
        strokeLinecap="round"
        strokeDasharray={`${C_INNER}`}
        strokeDashoffset={`${C_INNER}`}
        opacity={0.9}
        transform={`rotate(-90 ${CX} ${CY})`}
      />
      {/* beam edge: a short bright window ending exactly at the hand tip */}
      <circle
        ref={beamRef}
        cx={CX}
        cy={CY}
        r={R_OUTER}
        fill="none"
        stroke="#d8b97a"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0}
        transform={`rotate(-90 ${CX} ${CY})`}
      />

      {/* twelve understated hour markers: short radial lines */}
      <g>
        {HOURS.map((m) => (
          <line
            key={m.i}
            ref={setMarker(m.i)}
            x1={m.x1}
            y1={m.y1}
            x2={m.x2}
            y2={m.y2}
            stroke="#d8b97a"
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.12}
          />
        ))}
      </g>

      {/* long hand: the visual driver, a slender needle with a short tail */}
      <g ref={handRef} transform={`rotate(0 ${CX} ${CY})`} opacity={0.3}>
        <polygon points={`${CX},62 ${CX + 1.6},${CY} ${CX},224 ${CX - 1.6},${CY}`} fill="#d8b97a" />
      </g>

      {/* short hand and pivot: static, understated */}
      <g ref={dressRef} opacity={0.2}>
        <g transform={`rotate(-60 ${CX} ${CY})`}>
          <line x1={CX} y1={CY} x2={CX} y2={132} stroke="#b08a5b" strokeWidth={1.5} strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={4.5} fill="#0a0908" stroke="#d8b97a" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={1.3} fill="#d8b97a" />
      </g>
    </svg>
  );
}
