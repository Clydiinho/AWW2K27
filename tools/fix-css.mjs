// Fixes the browser-target bug where the CSS minifier emits only
// -webkit-backdrop-filter (Safari's spelling, from the Safari < 15.4 part of
// the default baseline) and drops the standard property. Chromium has never
// supported the -webkit-backdrop-filter alias, so every glass panel lost its
// backdrop blur on production. This inserts `backdrop-filter: <value>` before
// each -webkit-backdrop-filter, so both spellings ship and every current
// browser applies the blur. Runs once per `vite build` (dist is regenerated).
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('dist/assets');
let files = 0, fixes = 0;
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.css')) continue;
  const p = path.join(dir, name);
  const css = fs.readFileSync(p, 'utf8');
  const out = css.replace(/-webkit-backdrop-filter:([^;}]+)/g, (m, value) => (fixes++, `backdrop-filter:${value};-webkit-backdrop-filter:${value}`));
  if (out !== css) { files++; fs.writeFileSync(p, out); }
}
console.log(`fix-css: restored ${fixes} standard backdrop-filter declaration(s) in ${files} file(s)`);
