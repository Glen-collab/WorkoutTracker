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

const K = 100;          // INOL → comparable-to-movement units
const INOL_CAP = 97;    // clamp %1RM so the denominator stays ≥ 3

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
function barbellCns(ex, maxes) {
  let inol = 0, peak = 0;
  for (const s of liftSets(ex, maxes)) {
    inol += s.reps / (100 - Math.min(s.pct, INOL_CAP));
    if (s.pct > peak) peak = s.pct;
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
    let load = 0, contacts = 0, distance = 0;
    if (cls.driver === 'Distance') {
      const per = parseFloat(exercise.distance) || 0;
      distance = per * (efforts || 1);
      load = distance > 0 ? cls.cns * (distance / 100) : cls.cns * efforts;
    } else {
      if (cls.driver === 'Contacts') contacts = efforts;
      load = cls.cns * efforts;
    }
    const modality = /Plyo/.test(cls.type) ? 'jump' : /Sprint|Run/.test(cls.type) ? 'sprint' : /Agility|Technical|Drill/.test(cls.type) ? 'drill' : 'movement';
    return { load, cns: cls.cns, modality, contacts, distance, peakPct: 0 };
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
  return { weeks, highThreshold: Math.round(highThreshold) };
}
