// Story frame encoder — build-order step 1 (docs/STORY-PLAN.md §h).
// Extracts the video range 4.0s..40.0s at 8 fps, encodes two AVIF tiers
// (1280x720 desktop, 720x405 mobile) plus chapter posters, and writes
// public/story/manifest.json (+ manifest.js ESM re-export for src import).
// Frame numbering is continuous across chapters: frame N plays at t = 4.0 + (N-1)/8.
import sharp from "sharp";
import { mkdirSync, statSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const VID = "D:/AWW/public/scroll animation.webm";
const OUT = "D:/AWW/public/story";
const CACHE = "D:/AWW/.cache/encode";

const FPS = 8;
const T_START = 4.0; // scene 1 (hero) is excluded per the storyboard
const T_END = 40.0;
const CHAPTERS = [
  { id: "02", title: "Inside the Watch", tStart: 4.0, tEnd: 17.3, scrollVh: 450, posterT: 4.0 },
  { id: "03", title: "The Event", tStart: 17.3, tEnd: 27.0, scrollVh: 350, posterT: 17.6 },
  { id: "04", title: "The World", tStart: 27.0, tEnd: 36.0, scrollVh: 330, posterT: 29.6, posterWarpT: 34.1 },
  { id: "05", title: "The Experience", tStart: 36.0, tEnd: 40.0, scrollVh: 240, posterT: 36.2 },
];
const TIERS = { desktop: { w: 1280, h: 720 }, mobile: { w: 720, h: 405 } };
const TOTAL = Math.round((T_END - T_START) * FPS); // 288

// chapter membership: t in [tStart, tEnd) — frame k plays at T_START + k/FPS
function chapterOf(k) {
  const t = T_START + k / FPS;
  for (const c of CHAPTERS) if (t >= c.tStart && t < c.tEnd) return c.id;
  return CHAPTERS[CHAPTERS.length - 1].id; // last frame lands in ch 05
}

(async () => {
  rmSync(CACHE, { recursive: true, force: true });
  mkdirSync(CACHE, { recursive: true });
  rmSync(OUT, { recursive: true, force: true });
  for (const tier of Object.keys(TIERS)) for (const c of CHAPTERS) mkdirSync(join(OUT, tier, c.id), { recursive: true });

  // two ffmpeg passes: pre-scaled tier PNGs (fast SIMD scale), then sharp encodes AVIF concurrently
  for (const [tier, { w, h }] of Object.entries(TIERS)) {
    console.log(`extracting ${TOTAL} frames @ ${w}x${h} (${tier})...`);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", `${T_START}`, "-i", VID, "-vf", `fps=${FPS},scale=${w}:${h}`, "-start_number", "0", join(CACHE, `${tier}-%04d.png`)]);
  }
  const pngs = (await import("node:fs")).readdirSync(CACHE).filter(f => /^desktop-\d{4}\.png$/.test(f));
  if (pngs.length !== TOTAL) throw new Error(`expected ${TOTAL} frames, got ${pngs.length}`);
  pngs.sort();

  const manifest = {
    generated: new Date().toISOString(),
    source: { file: "scroll animation.webm", tStart: T_START, tEnd: T_END, fps: FPS, note: "scene 1 (0-4s) reserved for the hero; not part of the scroll story" },
    tiers: Object.fromEntries(Object.entries(TIERS).map(([k, v]) => [k, { ...v, fps: FPS, ext: "avif", fit: k === "mobile" ? "contain" : "cover" }])),
    bands: { chapters02to04: "#050505", chapter05: "#0d1518" },
    chapters: [],
    framesByChapter: {},
  };

  // classify frames per chapter (store frame index k; frame number = k+1)
  for (const c of CHAPTERS) c._frames = [];
  pngs.forEach((f, k) => {
    const ch = CHAPTERS.find(c => c.id === chapterOf(k));
    if (ch) ch._frames.push(k);
  });
  for (const c of CHAPTERS) manifest.framesByChapter[c.id] = c._frames.map(k => k + 1);

  // encode every frame into both tiers (6-way pool)
  const report = { source: { video: VID, tStart: T_START, fps: FPS }, md5: {}, perFile: {} };
  const grand = { desktop: 0, mobile: 0 };
  let done = 0, cursor = 0;
  async function worker() {
    while (cursor < pngs.length) {
      const k = cursor++;
      const tierPng = tier => join(CACHE, `${tier}-${String(k).padStart(4, "0")}.png`);
      const ch = CHAPTERS.find(c => c.id === chapterOf(k));
      for (const [tier, { w, h }] of Object.entries(TIERS)) {
        const name = `frame-${String(k + 1).padStart(4, "0")}.avif`;
        const buf = await sharp(tierPng(tier)).avif({ quality: 50, effort: 4 }).toBuffer();
        const target = join(OUT, tier, ch.id, name);
        writeFileSync(target, buf);
        report.md5[`${tier}/${ch.id}/${name}`] = createHash("md5").update(buf).digest("hex");
        report.perFile[`${tier}/${ch.id}/${name}`] = buf.byteLength;
        grand[tier] += buf.byteLength;
      }
      done++;
      if (done % 40 === 0) console.log(`  encoded ${done}/${TOTAL}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  // posters (one per chapter + the warp-window still folded into ch 04)
  const posters = [
    ["02", 4.0, "poster"], ["03", 17.6, "poster"], ["04", 29.6, "poster"],
    ["04", 34.1, "poster-warp"], ["05", 36.2, "poster"],
  ];
  for (const [chId, t, base] of posters) {
    const tmp = join(CACHE, `poster_${base}.png`);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", `${t}`, "-i", VID, "-frames:v", "1", tmp]);
    for (const [tier, { w, h }] of Object.entries(TIERS)) {
      const name = `${base}-${tier === "desktop" ? "1280x720" : "720x405"}.avif`;
      const target = join(OUT, tier, chId, name);
      const buf = await sharp(tmp).resize(w, h).avif({ quality: 50, effort: 4 }).toBuffer();
      writeFileSync(target, buf);
      report.md5[`${tier}/${chId}/${name}`] = createHash("md5").update(buf).digest("hex");
      report.perFile[`${tier}/${chId}/${name}`] = buf.byteLength;
    }
  }

  // chapter manifest entries
  for (const c of CHAPTERS) {
    c.entry = {
      id: c.id, title: `PLACEHOLDER — ${c.title}`, scrollVh: c.scrollVh,
      tStart: c.tStart, tEnd: c.tEnd,
      firstFrame: c._frames[0] + 1, lastFrame: c._frames[c._frames.length - 1] + 1,
      frameCount: c._frames.length,
      poster: "poster-1280x720.avif",
      posterMobile: "poster-720x405.avif",
    };
    if (c.posterWarpT) c.entry.posterWarp = "poster-warp-1280x720.avif";
  }
  manifest.chapters = CHAPTERS.map(c => c.entry);
  manifest.totals = {
    desktop: grand.desktop, mobile: grand.mobile,
    desktopMB: +(grand.desktop / 1048576).toFixed(2), mobileMB: +(grand.mobile / 1048576).toFixed(2),
    frames: pngs.length,
  };

  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  // ESM copy for future src imports; runtime code should fetch(manifest.json) to stay out of the bundle.
  writeFileSync(join(OUT, "manifest.js"), `export default ${JSON.stringify(manifest)};\n`);

  writeFileSync("D:/AWW/tools/story/encode-report.json", JSON.stringify(report, null, 2));
  console.log("done:", JSON.stringify(manifest.totals));
})();
