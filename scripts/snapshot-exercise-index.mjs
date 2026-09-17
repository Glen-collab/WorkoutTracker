// snapshot-exercise-index.mjs
// Refreshes the BUNDLED copy of the exercise list (src/data/exerciseSwapIndex.json)
// from the server. The bundled copy is only the offline/first-launch fallback —
// the tracker fetches the live list at startup (src/data/exerciseIndex.js), so
// new exercises reach clients without running this or rebuilding.
//
// The list itself is built in bsa-coach-platform (scripts/build_exercise_index.mjs)
// and served by GET /api/workout/exercise-index. This replaced
// generate-swap-index.mjs, which read ../workoutbuilder off the local disk.
//
// Run from the tracker repo root now and then:  node scripts/snapshot-exercise-index.mjs

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const INDEX_URL = 'https://app.bestrongagain.com/api/workout/exercise-index';
const outPath = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/exerciseSwapIndex.json');

const r = await fetch(INDEX_URL);
if (!r.ok) {
  console.error(`GET ${INDEX_URL} -> ${r.status}; bundled copy left unchanged`);
  process.exit(1);
}
const data = await r.json();
if (!Array.isArray(data.list) || data.list.length === 0) {
  console.error('Server returned no exercises; bundled copy left unchanged');
  process.exit(1);
}
writeFileSync(outPath, JSON.stringify(data));
console.log(`Wrote ${data.list.length} exercises -> ${outPath}`);
