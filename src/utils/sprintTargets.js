// Sprint %PB engine — the velocity analog of the 1RM → % → weight system.
//
//   Lifting:   weight  = 1RM × %
//   Sprinting: target time = PB ÷ %    (running 95% = 5% SLOWER than your PB)
//
// PBs are per DISTANCE (a 40yd PB ≠ a 100m PB — "5 different bench maxes"), so
// every distance is its own slot. The coach enters the athlete's best time per
// distance in the Sprint PBs panel; each prescribed sprint then auto-fills its
// target time from that PB and the chosen intensity %.

// Hybrid set (Glen's pick): the iconic field tests + the metric track ladder,
// covering every velocity zone. Each is a distinct PB slot.
export const SPRINT_DISTANCES = [
  { key: '10yd',  label: '10 yd',  zone: 'Acceleration' },
  { key: '40yd',  label: '40 yd',  zone: 'Acceleration' },
  { key: '60m',   label: '60 m',   zone: 'Max Velocity' },
  { key: '100m',  label: '100 m',  zone: 'Speed Endurance' },
  { key: '150m',  label: '150 m',  zone: 'Speed Endurance' },
  { key: '200m',  label: '200 m',  zone: 'Special Endurance' },
  { key: '300m',  label: '300 m',  zone: 'Special Endurance' },
  { key: '400m',  label: '400 m',  zone: 'Special Endurance' },
];

export const SPRINT_DISTANCE_BY_KEY = Object.fromEntries(SPRINT_DISTANCES.map((d) => [d.key, d]));

// Intensity options. Sprint reps run at a % of PB speed — at the high end you're
// near race pace; lower % = controlled/tempo work. (Coach can still type any.)
export const SPRINT_INTENSITIES = [100, 98, 95, 92, 90, 88, 85, 80, 75, 70];

// "1:02.45" / "62.45" / "9.85" → seconds (number), or NaN if unparseable.
export function parseTimeToSeconds(str) {
  if (str == null) return NaN;
  const s = String(str).trim();
  if (!s) return NaN;
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => parseFloat(p));
    if (parts.some((n) => isNaN(n))) return NaN;
    // m:ss(.hh)  or  h:mm:ss
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  }
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

// seconds → "5.05" (under a minute, 2 decimals) or "1:02.45" (m:ss.hh).
export function formatSeconds(sec) {
  if (!isFinite(sec) || sec <= 0) return '';
  if (sec < 60) return sec.toFixed(2);
  const m = Math.floor(sec / 60);
  const r = sec - m * 60;
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(2)}`;
}

// The core: target rep time = PB ÷ (intensity% / 100). 95% of a 4.80 PB = 5.05s.
// Returns '' when there's no PB for that distance or no valid intensity.
export function computeTargetTime(pbStr, pct) {
  const pb = parseTimeToSeconds(pbStr);
  const p = parseFloat(pct);
  if (!isFinite(pb) || pb <= 0 || !isFinite(p) || p <= 0) return '';
  return formatSeconds(pb / (p / 100));
}
