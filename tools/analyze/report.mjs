import { readFileSync } from "node:fs";
const csv = readFileSync("D:/AWW/.cache/analysis.csv", "utf8").trim().split("\n").map(l => l.split(",").map(Number));
csv.shift();
const F = (i, k) => csv[i][k];

// 1. detect spikes: frame-delta of mean colour (distance between consecutive mean RGB) + motion energy change
const spikeRows = [];
for (let i = 1; i < csv.length; i++) {
  const dCol = Math.hypot(F(i, 15) - F(i - 1, 15), F(i, 16) - F(i - 1, 16), F(i, 17) - F(i - 1, 17));
  const dMean = Math.abs(F(i, 1) - F(i - 1, 1));
  if (dCol > 0.02 || dMean > 0.055) spikeRows.push([F(i, 0).toFixed(2), dCol.toFixed(4), dMean.toFixed(4), F(i, 12).toFixed(3)]);
}
console.log("== colour/mean spikes (t, dCornerRGB, dMean, motion) ==");
console.log(spikeRows.map(r => r.join("\t")).join("\n") || "none");

// 2. motion energy: top 25
const top = [...csv].sort((a, b) => b[18] - a[18]).slice(0, 25).sort((a, b) => a[0] - b[0]);
console.log("== top motion frames (t, motion, mean, centroid) ==");
console.log(top.map(r => [r[0].toFixed(2), r[18].toFixed(4), r[1].toFixed(3), r[3].toFixed(3)].join("\t")).join("\n"));

// 3. overall corner colour
const cr = csv.map(r => r[15]), cg = csv.map(r => r[16]), cb = csv.map(r => r[17]);
const agg = a => [Math.min(...a), Math.max(...a), a.reduce((s, v) => s + v, 0) / a.length];
for (const [n, a] of [["cornerR", cr], ["cornerG", cg], ["cornerB", cb]]) {
  const [mn, mx, av] = agg(a);
  console.log(`${n}: min ${(mn * 255) | 0} max ${(mx * 255) | 0} avg ${((av * 255) | 0)}`);
}

// 4. p95 by thirds
const thirdP95 = (x0, x1, y0, y1) => {
  const vals = [];
  for (const r of csv) {
    if (x0 < 3) { const gs = [r[8], r[11], r[14]]; vals.push(...gs); } // left col
    else if (x1 > 1) { const gs = [r[10], r[13], r[16 - 3]]; vals.push(...gs); } // right col
  }
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length * 0.95)];
};
// simpler explicit thirds from grid columns: left = g00,g10,g20 ; right = g02,g12,g22 ; bottom = g20,g21,g22 over ALL frames pooled per scene later
console.log("== overall thirds (across all 160 frames) ==");
const pool = k => csv.map(r => r[k]).sort((a, b) => a - b);
const p95of = arr => arr[Math.floor(arr.length * 0.95)];
console.log("left third p95", p95of(pool(8)).toFixed(3), "right third p95", p95of(pool(10)).toFixed(3), "bottom third p95", p95of(pool(14) === undefined ? [] : csv.flatMap(r => [r[14]])).toFixed(3));
