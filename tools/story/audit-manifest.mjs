// Build-order step 2 (docs/STORY-PLAN.md §h): verify the encoded manifest against
// the budgets (desktop <= 9 MB, mobile <= 4 MB) and structural integrity.
// Run: node tools/story/audit-manifest.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "D:/AWW/public/story";
const BUDGET = { desktop: 9 * 1048576, mobile: 4 * 1048576 };

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
// 2) manifest totals match disk manifest.totals
check("manifest totals self-report", manifest.totals.frames === 288,
  `${manifest.totals.frames} frames`);
// 3) chapter continuity 1..288, no gaps/overlaps
const seq = manifest.chapters.map(c => [c.firstFrame, c.lastFrame]);
let contiguous = seq[0][0] === 1;
for (let i = 1; i < seq.length; i++) contiguous = contiguous && seq[i - 1][1] + 1 === seq[i][0];
check("chapter continuity 1..288 no gaps", contiguous && seq[seq.length - 1][1] === manifest.totals.frames,
  seq.map(([a, b]) => `${a}-${b}`).join(", "));

// 4) per-chapter folder file counts == frameCount (+ posters)
for (const c of manifest.chapters) {
  for (const tier of ["desktop", "mobile"]) {
    const w = tier === "desktop" ? "1280x720" : "720x405";
    const files = readdirSync(join(ROOT, tier, c.id)).filter(f => f.endsWith(".avif"));
    const frames = files.filter(f => /^frame-\d{4}\.avif$/.test(f));
    const posters = files.filter(f => /^poster/.test(f));
    check(`ch${c.id} ${tier} counts`, frames.length === c.frameCount && posters.length >= 1,
      `${frames.length}/${c.frameCount} frames, ${posters.length} poster(s)`);
    // frames reference names on disk
    const expected = Array.from({ length: c.frameCount }, (_, i) =>
      `frame-${String(c.firstFrame + i).padStart(4, "0")}.avif`);
    const missing = expected.filter(n => !frames.includes(n));
    check(`ch${c.id} ${tier} names exact`, missing.length === 0, missing.length ? `missing ${missing[0]}…` : "all present");
  }
}
// 5) posters exist per manifest
for (const c of manifest.chapters) {
  for (const tier of ["desktop", "mobile"]) {
    const names = c.id === "04"
      ? [`poster-warp-${tier === "desktop" ? "1280x720" : "720x405"}.avif`]
      : [];
    check(`ch${c.id} ${tier} poster exists`, statSync(join(ROOT, tier, c.id, tier === "desktop" ? c.poster : c.posterMobile)).isFile(),
      tier === "desktop" ? c.poster : c.posterMobile);
    for (const n of names) check(`ch${c.id} ${tier} extra poster`, statSync(join(ROOT, tier, c.id, n)).isFile(), n);
  }
}
// 6) md5 report coverage
const coverDesktop = Object.keys(report.md5).filter(k => k.startsWith("desktop/")).length;
const coverMobile = Object.keys(report.md5).filter(k => k.startsWith("mobile/")).length;
check("md5 coverage", coverDesktop === 293 && coverMobile === 293, `${coverDesktop}+${coverMobile} hashes (288 frames + 5 posters/tier)`);

let fail = 0;
for (const c of checks) { console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name} — ${c.detail}`); if (!c.ok) fail++; }
console.log(fail ? `\nFAIL: ${fail} check(s)` : "\nPASS — manifest is within budget and consistent");
process.exitCode = fail ? 1 : 0;