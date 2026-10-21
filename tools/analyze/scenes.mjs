import { readFileSync } from "node:fs";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const VID = "D:/AWW/public/scroll animation.webm";
const CACHE = "D:/AWW/.cache";
mkdirSync(`${CACHE}/tier`, { recursive: true });

// ------- per-scene aggregates from analysis.csv -------
const csv = readFileSync(`${CACHE}/analysis.csv`, "utf8").trim().split("\n").map(l => l.split(",").map(Number));
csv.shift();
const scenes = {
  "S2 movement 4.0-17.3": [16, 69], // row indexes inclusive over t=4.0..17.25
  "S3 explosion 17.3-27.0": [70, 108],
  "S4 globe 27.0-34.0": [108, 136],
  "S5 fast zoom 34.0-36.0": [136, 144],
  "S6 cape 36.0-40.0": [144, 160],
};
const lin = v => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const relLum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const IVORY = relLum(0xf1 / 255, 0xeb / 255, 0xe0 / 255); // #f1ebe0

console.log("scene | centroid min-avg-max | bright left/right % | left3rd p95 | right3rd p95 | bottom3rd p95 | cornerRGB avg | contrast74 | contrast50b");
for (const [name, [a, b]] of Object.entries(scenes)) {
  const rows = csv.slice(a, b === 160 ? 159 : b);
  const c = rows.map(r => r[3]).filter(v => v >= 0);
  const left = rows.map(r => r[4]).filter(v => v >= 0);
  const right = rows.map(r => r[5]).filter(v => v >= 0);
  const p95 = arr => { const s = [...arr].sort((x, y) => x - y); return s[Math.floor(s.length * 0.95)]; };
  const leftP95 = p95(rows.map(r => Math.max(r[8], r[11], r[14])));
  const rightP95 = p95(rows.map(r => Math.max(r[10], r[13], r[16])));
  const bottomP95 = p95(rows.map(r => Math.max(r[14], r[15], r[16])));
  const corner = [0, 1, 2].map(k => rows.reduce((s, r) => s + r[15 + k], 0) / rows.length);
  // worst-case cell for panel: brightest of the 6 side-column cells (exclude centre col)
  // panel glass: 0.74 alpha over base sRGB 0.04-ish; blur alpha 0.50
  const cellSrgb = k => rows.map(r => r[8 + k]);
  const worst = (alpha) => {
    let worstC = 1e9, worstCell = -1;
    for (const k of [0, 1, 2, 4, 5, 6, 7, 8]) { // all cells
      const vals = cellSrgb(k);
      const p = p95(vals); // worst-ish background
      const blend = alpha * 0.042 + (1 - alpha) * p; // base rgba(12,10,9) ~ 0.042-0.047 sRGB
      const L = 0.2126 * lin(blend) + 0.7874 * lin(blend); // approx grey
      const ratio = (IVORY + 0.05) / (L + 0.05);
      if (ratio < worstC) { worstC = ratio; worstCell = k; }
    }
    return [worstC, worstCell];
  };
  const [c74, cell74] = worst(0.74);
  const [c50, cell50] = worst(0.5);
  const stat = a2 => a2.length ? `${Math.min(...a2).toFixed(2)}-${(a2.reduce((s, v) => s + v, 0) / a2.length).toFixed(2)}-${Math.max(...a2).toFixed(2)}` : "n/a";
  console.log(name, "|", stat(c), "|", stat(left), stat(right), "|", leftP95.toFixed(3), "|", rightP95.toFixed(3), "|", bottomP95.toFixed(3), "|", corner.map(v => Math.round(v * 255)).join("/"), "|", `${c74.toFixed(2)} (cell ${cell74})`, "|", `${c50.toFixed(2)} (cell ${cell50})`);
}
console.log("IVORY contrast reference: pure-black bg ratio =", ((IVORY + 0.05) / 0.05).toFixed(2));

// ------- encode tests -------
const times = [4.0, 8.0, 12.0, 16.0, 20.0, 24.0, 28.0, 32.0, 36.0, 39.9];
const tiers = { "720x405": [720, 405], "1280x720": [1280, 720] };
const results = {};
for (const [tier, [w, h]] of Object.entries(tiers)) {
  results[tier] = {};
  for (const fmt of ["avif", "webp"]) {
    let total = 0, sizes = [];
    for (let i = 0; i < times.length; i++) {
      const png = `${CACHE}/tier/t_${tier}_${i}.png`;
      execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", `${times[i]}`, "-i", VID, "-frames:v", "1", "-vf", `scale=${w}:${h}`, png]);
      const out = `${CACHE}/tier/t_${tier}_${i}.${fmt}`;
      if (fmt === "avif") await sharp(png).avif({ quality: 50, effort: 4 }).toFile(out);
      else await sharp(png).webp({ quality: 78 }).toFile(out);
      const sz = (await import("node:fs")).statSync(out).size;
      sizes.push(sz); total += sz;
    }
    const avg = total / times.length;
    results[tier][fmt] = { avg, sizes };
  }
}
console.log("\n== encode averages (bytes/frame) ==");
for (const [tier, fmts] of Object.entries(results)) {
  for (const [fmt, { avg, sizes }] of Object.entries(fmts)) {
    console.log(`${tier} ${fmt}: avg ${Math.round(avg)} B  min ${Math.min(...sizes)}  max ${Math.max(...sizes)}`);
  }
}
// extrapolation: scenes 2-6 = 36.0 s -> frames = 36 * fps
const DUR = 36.0;
console.log("\n== ESTIMATED totals for scenes 2-6 (36 s) ==");
console.log("fps | webp-720 | webp-1280 | avif-720 | avif-1280");
for (const fps of [6, 8, 10, 12]) {
  const n = Math.round(DUR * fps);
  const row = [`6→12: ${fps}`];
  for (const tier of ["720x405", "1280x720"]) for (const fmt of ["webp", "avif"]) {
    const mb = (n * results[tier][fmt].avg / 1048576).toFixed(2);
    row.push(`${fmt}-${tier.startsWith("720") ? "720" : "1280"}: ${mb}MB`);
  }
  console.log(row.join(" | "));
}
