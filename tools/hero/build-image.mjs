// Build the hero reveal image set (run: node tools/hero/build-image.mjs).
// Source: assets-source/hero-original.webp (owner-supplied copy of the
// stats-photo original; never committed). Outputs 16:10 cover crops to
// public/assets/hero-v1/hero-{720,1280,1920}.{avif,webp} within budgets.
import { createRequire } from "module";
const require = createRequire(new URL("../../package.json", import.meta.url));
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

import { HERO_FOCUS_X, HERO_FOCUS_Y, HERO_WIDTHS, HERO_BUDGETS } from "./config.mjs";

const OUT_DIR = "public/assets/hero-v1";
fs.mkdirSync(OUT_DIR, { recursive: true });

main();

async function main() {
  const src = path.resolve("assets-source/hero-original.webp");
  const meta = await sharp(src).metadata();
  console.log("source:", meta.width + "x" + meta.height, meta.format);

  for (const w of HERO_WIDTHS) {
    const h = Math.round(w / 1.6);
    // Cover-crop the source to the frame's aspect, centred on the focus point.
    const crop = aspectCrop(meta.width, meta.height, w / h);
    const left = Math.min(meta.width - crop.w, Math.round((meta.width - crop.w) * HERO_FOCUS_X));
    const top = Math.min(meta.height - crop.h, Math.round((meta.height - crop.h) * HERO_FOCUS_Y));
    const base = sharp(src).extract({ left, top, width: crop.w, height: crop.h }).resize(w, h, { kernel: "lanczos3" });

    let avifQ = 48;
    let avifBuf;
    for (;;) {
      avifBuf = await base.clone().avif({ quality: avifQ, effort: 6, chromaSubsampling: "4:2:0" }).toBuffer();
      if (avifBuf.length <= HERO_BUDGETS[w] || avifQ <= 20) break;
      avifQ -= 6;
    }
    let webpQ = 78;
    let webpBuf;
    for (;;) {
      webpBuf = await base.clone().webp({ quality: webpQ, effort: 5 }).toBuffer();
      if (webpBuf.length <= avifBuf.length * 1.5 || webpQ <= 40) break;
      webpQ -= 6;
    }
    fs.writeFileSync(path.join(OUT_DIR, `hero-${w}.avif`), avifBuf);
    fs.writeFileSync(path.join(OUT_DIR, `hero-${w}.webp`), webpBuf);
    console.log(`hero-${w}: avif ${avifBuf.length} B (q${avifQ}) webp ${webpBuf.length} B (q${webpQ})`);
  }

  // Luminance of the exported 720 frame's pixels (what the site shows).
  const raw = await sharp(path.join(OUT_DIR, "hero-720.webp")).greyscale().raw().toBuffer();
  const hist = new Uint32Array(256);
  let sum = 0;
  for (const v of raw) { hist[v]++; sum += v; }
  const mean = sum / raw.length;
  let acc = 0;
  let p95 = 255;
  const pLimit = raw.length * 0.95;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= pLimit) { p95 = v; break; }
  }
  console.log("luminance mean:", mean.toFixed(1), "p95:", p95);
}

// Largest crop of size w×h that fits in the source at the frame aspect.
function aspectCrop(sw, sh, ar) {
  let w = sw, h = Math.round(sw / ar);
  if (h > sh) { h = sh; w = Math.round(sh * ar); }
  return { w, h };
}
