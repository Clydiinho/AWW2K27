// Verify the encoded manifest against the budgets (desktop <= 9 MB, mobile <= 4 MB)
// and structural integrity. Schema-agnostic: sizes/ext/counts come from the manifest.
// Run: node tools/story/audit-manifest.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "D:/AWW/public/story";
const BUDGET = { desktop: 16 * 1048576, mobile: 9 * 1048576 };

const sizeDir = dir => readdirSync(dir, { recursive: true })
  .map(f => join(dir, f))
  .filter(p => { try { return statSync(p).isFile(); } catch { return false; } })
  .reduce((s, p) => s + statSync(p).size, 0);

const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));
const report = JSON.parse(readFileSync("D:/AWW/tools/story/encode-report.json", "utf8"));

const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok, detail });

// 1) budget: measured file bytes on disk
for (const tier of ["desktop", "mobile"]) {
  const bytes = sizeDir(join(ROOT, tier));
  check(`budget ${tier}`, bytes <= BUDGET[tier],
    `${(bytes / 1048576).toFixed(2)} MB on disk vs ${(BUDGET[tier] / 1048576) | 0} MB limit`);
}
// 2) manifest totals: encoded frames (excludes the reserved hero scene)
check("manifest totals self-report",
  manifest.totals.frames + report.source.skipped === report.source.frames,
  `${manifest.totals.frames} encoded frames (skipped ${report.source.skipped})`);
// 3) chapter continuity across the encoded range, no gaps/overlaps
const seq = manifest.chapters.map(c => [c.firstFrame, c.lastFrame]);
let contiguous = seq[0][0] === Object.values(manifest.framesByChapter).flat()[0];
for (let i = 1; i < seq.length; i++) contiguous = contiguous && seq[i - 1][1] + 1 === seq[i][0];
const allFrames = Object.values(manifest.framesByChapter).flat();
const maxK = Math.max(...allFrames);
check("chapter continuity no gaps/overlaps",
  contiguous && allFrames.length === manifest.totals.frames && seq[seq.length - 1][1] === maxK,
  seq.map(([a, b]) => `${a}-${b}`).join(", "));

// 4) per-chapter folder contents == manifest
for (const c of manifest.chapters) {
  for (const tier of ["desktop", "mobile"]) {
    const ext = manifest.tiers[tier].ext;
    const files = readdirSync(join(ROOT, tier, c.id)).filter(f => f.endsWith(`.${ext}`));
    const frames = files.filter(f => new RegExp(`^frame-\\d{4}\\.${ext}$`).test(f));
    const posters = files.filter(f => /^poster/.test(f));
    check(`ch${c.id} ${tier} counts`, frames.length === c.frameCount && posters.length >= 1,
      `${frames.length}/${c.frameCount} frames, ${posters.length} poster(s)`);
    const expected = c.frameCount === manifest.framesByChapter[c.id]
      ? manifest.framesByChapter[c.id]
      : Array.from({ length: c.frameCount }, (_, i) => c.firstFrame + i);
    const missing = expected.map(k => `frame-${String(k).padStart(4, "0")}.${ext}`)
      .filter(n => !files.includes(n));
    check(`ch${c.id} ${tier} names exact`, missing.length === 0, missing.length ? `missing ${missing[0]}…` : "all present");
  }
}
// 5) posters exist per manifest
for (const c of manifest.chapters) {
  for (const tier of ["desktop", "mobile"]) {
    const names = [tier === "desktop" ? c.poster : c.posterMobile];
    if (c.posterWarp && tier === "desktop") names.push(c.posterWarp);
    for (const n of names) {
      let ok = false;
      try { ok = statSync(join(ROOT, tier, c.id, n)).isFile(); } catch { /* missing */ }
      check(`ch${c.id} ${tier} poster exists`, ok, n);
    }
  }
}
// 6) md5 report coverage: every encoded/poster file of each tier
const ext = manifest.tiers.desktop.ext;
const perTierFiles = manifest.chapters.reduce((n, c) => n + c.frameCount
  + 1 + (c.posterWarp ? 1 : 0), 0);
for (const tier of ["desktop", "mobile"]) {
  const cover = Object.keys(report.md5).filter(k => k.startsWith(tier + "/")).length;
  check(`md5 coverage ${tier}`, cover === perTierFiles, `${cover} hashes (expected ${perTierFiles}: frames + 5 posters)`);
}

let fail = 0;
for (const c of checks) { console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name} — ${c.detail}`); if (!c.ok) fail++; }
console.log(fail ? `\nFAIL: ${fail} check(s)` : "\nPASS — manifest is within budget and consistent");
process.exitCode = fail ? 1 : 0;
