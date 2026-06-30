// Unified CNS / neural-load model — the fatigue engine for BOTH heavy lifting
// and movement (sprints/plyos), on one currency so they sum into a daily wave.
//
//   Movement (plyo/sprint/tempo) → CNS rating (1-5) × efforts   [classifyMovement]
//   Heavy barbell lift           → intensity-driven load (INOL) [cnsLifts]
//
// LIFTING is intensity-driven, not rep-driven: a single @ 95% costs the nervous
// system far more than 5 reps @ 70%. We score only the high-CNS lifts (squat /
// bench / deadlift / clean / snatch families — see cnsLifts.js) using INOL
// (Intensity × Number Of Lifts = reps ÷ (100 − %1RM)), summed across working
// sets. The denominator shrinks near max, so near-maximal reps auto-dominate —
// exactly how an Olympic lifter gauges neural fatigue. Accessory/unilateral/
// complex lifts contribute 0 (they're not what fries the CNS).
//
// Intensity comes from the prescribed % (percentage-based sets) or, for absolute
// weights, from weight ÷ the athlete's 1RM (so it's per-athlete in the tracker).
// v1 scale factor K is tunable once real weeks are on it.

import { classifyMovement } from '../data/movementClassification.js';
import { isCnsLift } from '../data/cnsLifts.js';

const K = 100;          // INOL → unified neural-load units (lifting & movement)
const INOL_CAP = 97;    // clamp intensity so the denominator stays ≥ 3
const CNS_FLOOR = 80;   // only efforts ≥ this intensity% tax the CNS. Below is
                        // volume/conditioning, not a neural stressor — a 10×10 @
                        // 65% pump set OR a lateral-agility/tempo day → 0 CNS.

// Sprints/jumps run on the SAME intensity model as lifting so both lines live on
// one comparable scale. Intensity = the coach's %PB if set, else mapped from the
// movement's CNS rating (the velocity zone's neural demand). The mapping lands
// max-velocity/accel & shock plyos ABOVE the floor (they count) and agility /
// tempo / recovery BELOW it (→ 0), exactly how a coach reads a week.
const CNS_TO_INTENSITY = { 5: 95, 4: 88, 3: 82, 2: 74, 1: 64 };

function totalReps(exercise) {
  if (exercise.isPercentageBased && Array.isArray(exercise.sets)) {
    return exercise.sets.reduce((s, set) => set.isWarmup ? s : s + (Number(set.reps) || 0), 0);
  }
  const setsCount = parseInt(exercise.setsCount, 10) || (Array.isArray(exercise.sets) ? exercise.sets.length : 1) || 1;
  const reps = exercise.reps;
  if (typeof reps === 'number') return reps * setsCount;
  if (!reps) return setsCount;
  const str = String(reps).trim();
  if (str.includes(',')) return str.split(',').reduce((sum, r) => sum + (parseFloat(r.trim()) || 0), 0);
  const n = parseFloat(str);
  return isNaN(n) ? setsCount : n * setsCount;
}

// Builder calls the clean max 'powerClean'; the tracker calls it 'clean'. Resolve
// either so absolute-weight Olympic lifts derive intensity in both.
const BASEMAX_ALIAS = { powerClean: 'clean', clean: 'powerClean' };

// Working sets as {pct, reps} — from prescribed %, or weight ÷ 1RM for absolutes.
function liftSets(ex, maxes) {
  const max = (ex.baseMax && maxes)
    ? (Number(maxes[ex.baseMax] ?? maxes[BASEMAX_ALIAS[ex.baseMax]]) || 0)
    : 0;
  const out = [];
  // % sets carried as objects (builder working copy)
  if (Array.isArray(ex.sets) && ex.sets.length && typeof ex.sets[0] === 'object' && ex.sets[0].percentage != null) {
    for (const s of ex.sets) {
      if (s.isWarmup) continue;
      const pct = Number(s.percentage) || 0, reps = Number(s.reps) || 0;
      if (pct > 0 && reps > 0) out.push({ pct, reps });
    }
    return out;
  }
  // Flat percentages[] + repsPerSet[] (saved / tracker-normalized shape)
  if (Array.isArray(ex.percentages) && ex.percentages.length) {
    ex.percentages.forEach((p, i) => {
      const pct = Number(p) || 0, reps = Number(ex.repsPerSet?.[i] ?? ex.reps) || 0;
      if (pct > 0 && reps > 0) out.push({ pct, reps });
    });
    return out;
  }
  // Absolute weight → derive intensity from the 1RM (per-athlete)
  const w = parseFloat(ex.weight) || 0;
  if (w > 0 && max > 0) {
    const pct = (w / max) * 100;
    const sets = parseInt(ex.setsCount, 10) || (Array.isArray(ex.sets) ? ex.sets.length : 1) || 1;
    const reps = parseFloat(String(ex.reps).match(/\d+/)?.[0] || '') || 0;
    if (pct > 0 && reps > 0) for (let i = 0; i < sets; i++) out.push({ pct, reps });
  }
  return out;
}

// Heavy-lift neural load (INOL × K) + the peak %1RM hit (the max-effort signal).
// Only sets in the neural zone (≥ CNS_FLOOR) add to load; lighter volume work
// still reports its intensity to Peak % but doesn't count as CNS stress.
function barbellCns(ex, maxes) {
  let inol = 0, peak = 0;
  for (const s of liftSets(ex, maxes)) {
    if (s.pct > peak) peak = s.pct;
    if (s.pct < CNS_FLOOR) continue;
    inol += s.reps / (100 - Math.min(s.pct, INOL_CAP));
  }
  return { load: inol * K, peak };
}

// CNS load for one exercise + which modality it belongs to. `maxes` lets heavy
// lifts prescribed in absolute weight derive their intensity from the 1RM.
export function cnsLoadForExercise(exercise, maxes) {
  if (!exercise || !exercise.name) return { load: 0, cns: 0, modality: 'other', contacts: 0, distance: 0, peakPct: 0 };
  const cls = classifyMovement(exercise.name);

  if (cls && cls.cns > 0) {
    const efforts = totalReps(exercise);
    // Intensity: coach's %PB if set, else the zone's CNS rating mapped to a %.
    const tp = parseFloat(exercise.targetPct);
    const intensity = tp > 0 ? tp : (CNS_TO_INTENSITY[cls.cns] || 70);
    let contacts = 0, distance = 0, effortCount;
    if (cls.driver === 'Distance') {
      const per = parseFloat(exercise.distance) || 0;
      distance = per * (efforts || 1);
      effortCount = distance > 0 ? distance / 100 : efforts;   // each 100 = 1 effort
    } else {
      effortCount = efforts;
      if (cls.driver === 'Contacts') contacts = efforts;
    }
    // Same intensity-gated INOL as lifting → one comparable neural-load scale.
    const load = intensity >= CNS_FLOOR ? (effortCount / (100 - Math.min(intensity, INOL_CAP))) * K : 0;
    const modality = /Plyo/.test(cls.type) ? 'jump' : /Sprint|Run/.test(cls.type) ? 'sprint' : /Agility|Technical|Drill/.test(cls.type) ? 'drill' : 'movement';
    return { load, cns: cls.cns, modality, contacts, distance, peakPct: intensity >= CNS_FLOOR ? intensity : 0 };
  }

  // Heavy barbell lift → intensity load. Everything else (accessories, complexes,
  // light lifts) contributes 0 to neural load.
  if (isCnsLift(exercise.name)) {
    const b = barbellCns(exercise, maxes);
    return { load: b.load, cns: 5, modality: 'lift', contacts: 0, distance: 0, peakPct: b.peak };
  }
  return { load: 0, cns: 0, modality: 'lift', contacts: 0, distance: 0, peakPct: 0 };
}

export function cnsLoadForDay(blocks, maxes) {
  let total = 0, contacts = 0, distance = 0, peakPct = 0;
  const byModality = { lift: 0, jump: 0, sprint: 0, drill: 0, movement: 0, other: 0 };
  for (const block of (blocks || [])) {
    if (block.type === 'theme') continue;
    for (const ex of (block.exercises || [])) {
      const r = cnsLoadForExercise(ex, maxes);
      if (r.peakPct > peakPct) peakPct = r.peakPct;
      if (r.load <= 0) continue;
      total += r.load;
      byModality[r.modality] = (byModality[r.modality] || 0) + r.load;
      contacts += r.contacts;
      distance += r.distance;
    }
  }
  return { total, byModality, contacts, distance, peakPct };
}

// HIGH day = a day whose load is in the top third of this program's non-zero
// days (Francis high/low) — used to flag high days <48h apart on the calendar.
export function cnsLoadForProgram(allWorkouts, totalWeeks, daysPerWeek, maxes) {
  const weeks = [];
  const allDayLoads = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const days = [];
    let weekTotal = 0, weekContacts = 0, weekDistance = 0, weekPeak = 0;
    for (let d = 1; d <= daysPerWeek; d++) {
      const r = cnsLoadForDay(allWorkouts[`${w}-${d}`] || [], maxes);
      days.push({ day: d, total: Math.round(r.total), byModality: r.byModality, contacts: r.contacts, distance: Math.round(r.distance), peakPct: Math.round(r.peakPct) });
      weekTotal += r.total; weekContacts += r.contacts; weekDistance += r.distance;
      if (r.peakPct > weekPeak) weekPeak = r.peakPct;
      if (r.total > 0) allDayLoads.push(r.total);
    }
    weeks.push({ week: w, total: Math.round(weekTotal), contacts: weekContacts, distance: Math.round(weekDistance), peakPct: Math.round(weekPeak), days });
  }
  const sorted = allDayLoads.slice().sort((a, b) => a - b);
  const highThreshold = sorted.length ? sorted[Math.floor(sorted.length * 0.66)] : Infinity;
  weeks.forEach((wk) => wk.days.forEach((d) => { d.intensity = d.total === 0 ? 'rest' : d.total >= highThreshold ? 'high' : 'low'; }));

  // ACWR (Acute:Chronic Workload Ratio) on total CNS — the load-management flag.
  // acute = this week; chronic = rolling average of the last 4 weeks (incl. this
  // one). >1.5 = spike (overreach/risk), 0.8–1.3 = sweet spot, <0.8 = unloading
  // (deload / supercompensation). Distinguishes a PLANNED overreach (spike then
  // unload) from an accidental, un-recovered load jump.
  weeks.forEach((wk, i) => {
    const window = weeks.slice(Math.max(0, i - 3), i + 1).map((w) => w.total);
    const chronic = window.reduce((a, b) => a + b, 0) / window.length;
    wk.chronic = Math.round(chronic);
    wk.acwr = chronic > 0 ? wk.total / chronic : 0;
    wk.acwrHistory = window.length; // <2 = baseline still building
  });
  return { weeks, highThreshold: Math.round(highThreshold) };
}
