// generate-swap-index.mjs
// Builds a COMPACT swap index for the tracker's "Swap Exercise" feature from
// the builder's exercise library (the source of truth). We drop the heavy
// `schemes`/percentages and keep only what a swap needs: name, body-part
// category, equipment, movement pattern, and the Cloudflare video UID.
//
// Run from the tracker repo root:  node scripts/generate-swap-index.mjs
// Re-run whenever the builder library changes so new lifts become swappable.
//
// Reads:  ../workoutbuilder/src/data/exerciseLibrary.js   (sibling repo on disk)
// Writes: src/data/exerciseSwapIndex.json

import { pathToFileURL, fileURLToPath } from 'node:url';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const libPath = resolve(here, '../../workoutbuilder/src/data/exerciseLibrary.js');
const outPath = resolve(here, '../src/data/exerciseSwapIndex.json');

const uid = (yt) => {
  if (!yt || typeof yt !== 'string') return '';
  const m = yt.match(/([A-Za-z0-9]{20,})\/?$/);
  return m ? m[1] : '';
};

// The builder library uses extensionless relative imports (Vite-style) that
// bare node ESM can't resolve, so bundle it to a temp ESM file with esbuild
// (which inlines ./generalMovements etc.) and import that.
const tmp = mkdtempSync(join(tmpdir(), 'swapidx-'));
const bundled = join(tmp, 'lib.mjs');
await build({ entryPoints: [libPath], bundle: true, format: 'esm', outfile: bundled, logLevel: 'silent' });
const mod = await import(pathToFileURL(bundled).href);
rmSync(tmp, { recursive: true, force: true });
const categories = mod.exerciseCategories || mod.default?.exerciseCategories;
if (!categories) {
  console.error('Could not find exerciseCategories export in', libPath);
  process.exit(1);
}

const list = [];
const seen = new Set();
for (const [catKey, catVal] of Object.entries(categories)) {
  const subs = catVal?.subcategories || {};
  for (const subVal of Object.values(subs)) {
    for (const ex of subVal?.exercises || []) {
      if (!ex?.name || seen.has(ex.name)) continue;
      seen.add(ex.name);
      list.push({
        name: ex.name,
        category: catKey,
        equipment: Array.isArray(ex.equipment) ? ex.equipment : [],
        movement: Array.isArray(ex.movement) ? ex.movement : [],
        video: uid(ex.youtube),
      });
    }
  }
}

list.sort((a, b) => a.name.localeCompare(b.name));
const out = { generatedFrom: 'workoutbuilder/src/data/exerciseLibrary.js', count: list.length, list };
writeFileSync(outPath, JSON.stringify(out));
console.log(`Wrote ${list.length} exercises -> ${outPath}`);
