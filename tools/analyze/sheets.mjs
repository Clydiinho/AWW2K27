import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const CACHE = "D:/AWW/.cache";
const OUT = "D:/AWW/assets-source/contact-sheets";
const VID = "D:/AWW/public/scroll animation.webm";
const FF = "ffmpeg";
mkdirSync(OUT, { recursive: true });
mkdirSync(join(CACHE, "strip"), { recursive: true });

// timestamp SVG overlay (burned with sharp, not ffmpeg drawtext)
const tsSvg = (label, w, h) => Buffer.from(
  `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
     <rect x="0" y="${h - 22}" width="64" height="22" fill="rgba(0,0,0,0.65)"/>
     <text x="6" y="${h - 7}" font-family="sans-serif" font-size="15" font-weight="700" fill="#ffffff">${label}</text>
   </svg>`,
);

// 1) sheets: 1fps frames s0001..s0040, 20 per sheet (5 cols x 4 rows)
const CW = 384, CH = 216, COLS = 5;
for (let sheet = 0; sheet < 2; sheet++) {
  const cells = [];
  for (let k = 0; k < 20; k++) {
    const idx = sheet * 20 + k; // 0-based second -> frame s{idx}
    const png = `${CACHE}/s${String(idx).padStart(4, "0")}.png`;
    const label = `${idx}.0s`;
    const buf = await sharp(png).resize(CW, CH).composite([{ input: tsSvg(label, CW, CH), top: 0, left: 0 }]).jpeg({ quality: 85 }).toBuffer();
    cells.push(buf);
  }
  const comps = cells.map((buf, i) => ({ input: buf, left: (i % COLS) * CW, top: Math.floor(i / COLS) * CH }));
  await sharp({ create: { width: COLS * CW, height: 4 * CH, channels: 3, background: "#000" } })
    .composite(comps).jpeg({ quality: 85 }).toFile(join(OUT, `sheet-${sheet + 1}.jpg`));
}

// 2) boundary strips: for each boundary t: 8 frames t-1 .. t+1 (step 0.25), 4 cols x 2 rows
const boundaries = [3.0, 9.0, 17.0, 32.0];
for (let bi = 0; bi < boundaries.length; bi++) {
  const t0 = boundaries[bi] - 1;
  const cells = [];
  for (let k = 0; k < 8; k++) {
    const t = t0 + k * 0.25;
    const png = `${CACHE}/strip/b${bi}_k${k}.png`;
    try {
      execFileSync(FF, ["-y", "-v", "error", `-ss`, `${t.toFixed(2)}`, "-i", VID, "-frames:v", "1", "-vf", "scale=384:216", png]);
    } catch { /* frame past EOF */ }
    const label = `${t.toFixed(1)}s`;
    const buf = await sharp(png).resize(CW, CH).composite([{ input: tsSvg(label, CW, CH), top: 0, left: 0 }]).jpeg({ quality: 85 }).toBuffer();
    cells.push(buf);
  }
  const comps = cells.map((buf, i) => ({ input: buf, left: (i % 4) * CW, top: Math.floor(i / 4) * CH }));
  await sharp({ create: { width: 4 * CW, height: 2 * CH, channels: 3, background: "#000" } })
    .composite(comps).jpeg({ quality: 85 }).toFile(join(OUT, `boundary-${bi + 1}.jpg`));
}
console.log("sheets + strips written to", OUT);
