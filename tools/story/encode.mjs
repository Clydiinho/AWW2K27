// Story frame encoder v3 — encodes the USER-SUPPLIED JPG sequence
// (public/scroll animation/ezgif-frame-001..273.jpg, 1920x1080, covering the
// full 0-40s timeline) into two JPG tiers plus posters, and writes
// public/story/manifest.json (+ manifest.js ESM re-export).
// Frame k (1-based) sits at t = (k-1) * 40/272 seconds. Desktop keeps the
// native 1920x1080 resolution (user-requested quality); mobile drops to 960x540.
// The story starts at frame 1 (watch beauty shot) per user instruction.
import sharp from "sharp";
import { readdirSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const SRC = "D:/AWW/public/scroll animation";
const OUT = "D:/AWW/public/story";

const T_END = 40.0;
const CHAPTERS = [
  { id: "02", title: "Inside the Watch", tStart: 0.0, tEnd: 17.3, scrollVh: 450, posterK: 30 },
  { id: "03", title: "The Event", tStart: 17.3, tEnd: 27.0, scrollVh: 350, posterK: 121 },
  { id: "04", title: "The World", tStart: 27.0, tEnd: 36.0, scrollVh: 330, posterK: 202, posterWarpK: 233 },
  { id: "05", title: "The Experience", tStart: 36.0, tEnd: 40.0, scrollVh: 240, posterK: 247 },
];
const TIERS = {
  desktop: { w: 1920, h: 1080, q: 82 },
  mobile: { w: 960, h: 540, q: 64 },
};
const JPG_RE = /^ezgif-frame-(\d{3})\.jpg$/;

const frames = readdirSync(SRC)
  .map(f => (f.match(JPG_RE) ? { k: Number(f.match(JPG_RE)[1]), file: f } : null))
  .filter(Boolean)
  .sort((a, b) => a.k - b.k);
const MAXK = frames[frames.length - 1].k;
const DT = (T_END - /* zero-based */ 0) / (MAXK - 1); // 40/272 s
const tOf = k => (k - 1) * DT;

(async () => {
  rmSync(OUT, { recursive: true, force: true });
  for (const tier of Object.keys(TIERS)) for (const c of CHAPTERS) mkdirSync(join(OUT, tier, c.id), { recursive: true });

  // chapter membership by frame index (k 1..273); the story starts at frame 1
  for (const c of CHAPTERS) c._frames = [];
  for (const { k } of frames) {
    const c = CHAPTERS.find(c => tOf(k) >= c.tStart - 1e-9 && tOf(k) < c.tEnd - 1e-9) ?? CHAPTERS[CHAPTERS.length - 1];
    c._frames.push(k);
  }
  const used = CHAPTERS.reduce((n, c) => n + c._frames.length, 0);

  const manifest = {
    generated: new Date().toISOString(),
    source: {
      folder: "public/scroll animation",
      pattern: "ezgif-frame-001..273.jpg",
      width: 1920,
      height: 1080,
      frames: frames.length,
      note: "full 0-40s timeline encoded from frame 1 (watch beauty shot leads ch02); desktop native 1920x1080 quality per user instruction",
    },
    tiers: Object.fromEntries(Object.entries(TIERS).map(([k, v]) => [k, { w: v.w, h: v.h, fps: +(1 / DT).toFixed(3), ext: "jpg", fit: k === "mobile" ? "contain" : "cover" }])),
    bands: { chapters02to04: "#050505", chapter05: "#0d1518" },
    chapters: [],
    framesByChapter: {},
  };
  for (const c of CHAPTERS) manifest.framesByChapter[c.id] = c._frames;

  const report = { source: { folder: SRC, frames: frames.length, skipped: 0 }, md5: {}, perFile: {} };
  const grand = { desktop: 0, mobile: 0 };
  let done = 0, cursor = 0;
  const queue = frames.map(f => {
    const c = CHAPTERS.find(c => tOf(f.k) >= c.tStart - 1e-9 && tOf(f.k) < c.tEnd - 1e-9) ?? CHAPTERS[CHAPTERS.length - 1];
    f.ch = c.id;
    return f;
  });
  async function worker() {
    while (cursor < queue.length) {
      const f = queue[cursor++];
      for (const [tier, { w, h, q }] of Object.entries(TIERS)) {
        const name = `frame-${String(f.k).padStart(4, "0")}.jpg`;
        const buf = await sharp(join(SRC, f.file)).resize(w, h).jpeg({ quality: q, progressive: true, mozjpeg: true }).toBuffer();
        const target = join(OUT, tier, f.ch, name);
        writeFileSync(target, buf);
        report.md5[`${tier}/${f.ch}/${name}`] = createHash("md5").update(buf).digest("hex");
        report.perFile[`${tier}/${f.ch}/${name}`] = buf.byteLength;
        grand[tier] += buf.byteLength;
      }
      done++;
      if (done % 50 === 0) console.log(`  encoded ${done}/${queue.length}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  // posters (one per chapter + warp-window still folded into ch 04)
  for (const c of CHAPTERS) {
    const ks = [["poster", c.posterK]];
    if (c.posterWarpK) ks.push(["poster-warp", c.posterWarpK]);
    for (const [base, k] of ks) {
      const srcFrame = frames.find(f => f.k === k);
      if (!srcFrame) throw new Error(`poster frame ${k} missing`);
      for (const [tier, { w, h, q }] of Object.entries(TIERS)) {
        const name = `${base}-${w}x${h}.jpg`;
        const buf = await sharp(join(SRC, srcFrame.file)).resize(w, h).jpeg({ quality: q + 6, progressive: true, mozjpeg: true }).toBuffer();
        const target = join(OUT, tier, c.id, name);
        writeFileSync(target, buf);
        report.md5[`${tier}/${c.id}/${name}`] = createHash("md5").update(buf).digest("hex");
        report.perFile[`${tier}/${c.id}/${name}`] = buf.byteLength;
      }
    }
    c.entry = {
      id: c.id, title: `PLACEHOLDER — ${c.title}`, scrollVh: c.scrollVh,
      tStart: +tOf(c._frames[0]).toFixed(2), tEnd: +(tOf(c._frames[c._frames.length - 1]) + DT).toFixed(2),
      firstFrame: c._frames[0], lastFrame: c._frames[c._frames.length - 1],
      frameCount: c._frames.length,
      poster: `poster-${TIERS.desktop.w}x${TIERS.desktop.h}.jpg`,
      posterMobile: `poster-${TIERS.mobile.w}x${TIERS.mobile.h}.jpg`,
    };
    if (c.posterWarpK) c.entry.posterWarp = `poster-warp-${TIERS.desktop.w}x${TIERS.desktop.h}.jpg`;
  }
  manifest.chapters = CHAPTERS.map(c => c.entry);
  manifest.totals = {
    desktop: grand.desktop, mobile: grand.mobile,
    desktopMB: +(grand.desktop / 1048576).toFixed(2), mobileMB: +(grand.mobile / 1048576).toFixed(2),
    frames: used,
  };

  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  // ESM copy for future src imports; runtime code should fetch(manifest.json)
  // to keep the data out of the bundle.
  writeFileSync(join(OUT, "manifest.js"), `export default ${JSON.stringify(manifest)};\n`);

  writeFileSync("D:/AWW/tools/story/encode-report.json", JSON.stringify(report, null, 2));
  console.log("done:", JSON.stringify(manifest.totals));
})();
