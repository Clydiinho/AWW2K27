import sharp from "sharp";
import { writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "D:/AWW/.cache";
const THRESH = 0.45; // bright-pixel threshold (luma 0..1); reported in the analysis doc
const W = 160, H = 90;

const files = readdirSync(DIR).filter(f => /^f\d{4}\.png$/.test(f)).sort();
let prev = null;
const rows = [];

for (const f of files) {
  const { data, info } = await sharp(join(DIR, f)).greyscale().raw().toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  const hist = new Uint32Array(256);
  let sum = 0;
  for (let i = 0; i < px; i++) { hist[data[i]]++; sum += data[i]; }
  const mean = sum / px / 255;
  // p95 via histogram
  let acc = 0, p95 = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= px * 0.95) { p95 = v / 255; break; } }
  // bright content above THRESH
  const th = Math.round(THRESH * 255);
  let bx = 0, bn = 0, minX = -1, maxX = -1;
  const colCount = new Uint32Array(info.width);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const v = data[y * info.width + x];
      if (v >= th) { bx += x; bn++; colCount[x]++; }
    }
  }
  let centroid = -1, left = -1, right = -1;
  if (bn > 0) {
    centroid = bx / bn / info.width;
    for (let x = 0; x < info.width; x++) if (colCount[x] > 0) { if (minX < 0) minX = x; maxX = x; }
    left = minX / info.width; right = (maxX + 1) / info.width;
  }
  const brightPct = bn / px;
  // 3x3 grid means
  const grid = [];
  for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
    let s = 0, n = 0;
    const x0 = Math.floor(gx * info.width / 3), x1 = Math.floor((gx + 1) * info.width / 3);
    const y0 = Math.floor(gy * info.height / 3), y1 = Math.floor((gy + 1) * info.height / 3);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) s += data[y * info.width + x], n++;
    grid.push(s / n / 255);
  }
  // corner colours (9x9 blocks) from the ORIGINAL colour png
  const { data: rgb, info: inf } = await sharp(join(DIR, f)).raw().toBuffer({ resolveWithObject: true });
  const block = 9;
  const corner = (x0, y0) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = y0; y < y0 + block; y++) for (let x = x0; x < x0 + block; x++) {
      const o = (y * inf.width + x) * inf.channels;
      r += rgb[o]; g += rgb[o + 1]; b += rgb[o + 2]; n++;
    }
    return [r / n, g / n, b / n];
  };
  const c0 = corner(0, 0), c1 = corner(inf.width - block, 0), c2 = corner(0, inf.height - block), c3 = corner(inf.width - block, inf.height - block);
  const cr = (c0[0] + c1[0] + c2[0] + c3[0]) / 4, cg = (c0[1] + c1[1] + c2[1] + c3[1]) / 4, cb = (c0[2] + c1[2] + c2[2] + c3[2]) / 4;
  // motion energy: mean abs diff vs previous (greyscale)
  let motion = 0;
  if (prev) {
    let d = 0;
    for (let i = 0; i < px; i++) d += Math.abs(data[i] - prev[i]);
    motion = d / px / 255;
  }
  prev = new Uint8Array(data);
  const t = parseInt(f.slice(1, 5)) / 4;
  rows.push([t, mean, p95, centroid, left, right, brightPct, ...grid, cr / 255, cg / 255, cb / 255, motion].map(v => (typeof v === "number" ? +v.toFixed(5) : v)).join(","));
}

const header = "t,mean,p95,centroid,left,right,brightPct,g00,g01,g02,g10,g11,g12,g20,g21,g22,cr,cg,cb,motion";
writeFileSync(join(DIR, "analysis.csv"), [header, ...rows].join("\n") + "\n");
console.log(`wrote ${rows.length} rows -> ${DIR}/analysis.csv (threshold ${THRESH})`);
