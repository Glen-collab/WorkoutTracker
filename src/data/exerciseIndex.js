// exerciseIndex.js — the exercise list behind swaps and fallback demo videos.
//
// The list used to be compiled into the build (exerciseSwapIndex.json), so a
// new exercise meant rebuilding the tracker — and in a native app it would mean
// an App Store review. It now comes from the server
// (GET /api/workout/exercise-index), which also carries the custom exercises
// coaches save from the builder.
//
// Order of preference, all synchronous at startup so nothing waits on the
// network: the last copy the server sent (localStorage) → the bundled copy.
// refreshExerciseIndex() then asks the server in the background; if the list
// changed, the new copy is used from that moment and saved for next launch.
// If the server can't be reached, the tracker carries on with what it has.

import BUNDLED from './exerciseSwapIndex.json';

const INDEX_URL = 'https://app.bestrongagain.com/api/workout/exercise-index';
const CACHE_KEY = 'gwt_exercise_index';

let list = BUNDLED.list || [];
let etag = null;
let byName = buildByName(list);

function buildByName(items) {
  return new Map(items.map((e) => [String(e.name || '').trim().toLowerCase(), e]));
}

function adopt(items, tag) {
  list = items;
  etag = tag;
  byName = buildByName(items);
}

function isValid(data) {
  return Array.isArray(data?.list) && data.list.length > 0 && data.list.every((e) => e && typeof e.name === 'string');
}

try {
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  if (cached && isValid(cached.data)) adopt(cached.data.list, cached.etag || null);
} catch { /* no cache (private mode, blocked storage, bad JSON) — bundled copy stands */ }

export function getExerciseList() {
  return list;
}

export function getExerciseByName(name) {
  return byName.get(String(name || '').trim().toLowerCase());
}

let inFlight = null;

export function refreshExerciseIndex() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const headers = etag ? { 'If-None-Match': etag } : {};
      const r = await fetch(INDEX_URL, { headers });
      if (r.status === 304 || !r.ok) return;
      const data = await r.json();
      if (!isValid(data)) return;
      // The body's version is authoritative; the header can be hidden cross-origin.
      const tag = data.version ? `"${data.version}"` : r.headers.get('ETag');
      adopt(data.list, tag);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ etag: tag, data }));
      } catch { /* storage full or blocked — still using the fresh list this session */ }
    } catch { /* offline or server down — keep the list we have */ }
    finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
