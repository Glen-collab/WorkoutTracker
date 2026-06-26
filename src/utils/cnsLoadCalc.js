// Unified CNS / neural-load model — tracker copy of the builder's engine.
// Computes the neural cost of a day's blocks so the athlete sees today's CNS
// load alongside tonnage. Self-contained: the lift classifier reads the
// equipment/movement arrays the builder bakes onto each exercise (no library
// lookup), falling back to auxiliary when they're missing.
//
//   Plyo (Contacts)  → cns × total contacts        (sets × reps)
//   Sprint (Reps)    → cns × total efforts         (# of runs)
//   Tempo (Distance) → cns × (total yards / 100)    (volume, low neural)
//   Lifting          → LIFT_CNS[bucket] × work reps (compound 5 / auxiliary 2)

import { classifyMovement, LIFT_CNS } from '../data/movementClassification.js';

const COMPOUND_MOVEMENTS = new Set(['Push', 'Pull', 'Squat', 'Hinge', 'Hip']);

// Compound = barbell AND a compound movement pattern; everything else auxiliary.
// Reads straight off the exercise object (builder bakes equipment/movement in).
function classifyCnsBucket(ex) {
  if (!ex) return 'auxiliary';
  if (ex.cnsBucket === 'compound' || ex.cnsBucket === 'auxiliary') return ex.cnsBucket;
  const eq = Array.isArray(ex.equipment) ? ex.equipment : [];
  const mv = Array.isArray(ex.movement) ? ex.movement : [];
  const isBarbell = eq.some((e) => /barbell/i.test(e));
  const isCompoundMovement = mv.some((m) => COMPOUND_MOVEMENTS.has(m));
  return isBarbell && isCompoundMovement ? 'compound' : 'auxiliary';
}

function totalReps(exercise) {
  // Builder sets may be objects [{reps, percentage, isWarmup}] or a flat count.
  if (Array.isArray(exercise.sets) && exercise.sets.length && typeof exercise.sets[0] === 'object') {
    return exercise.sets.reduce((s, set) => set.isWarmup ? s : s + (Number(set.reps) || 0), 0);
  }
  const setsCount = parseInt(exercise.setsCount, 10)
    || (Array.isArray(exercise.sets) ? exercise.sets.length : Number(exercise.sets))
    || 1;
  const reps = exercise.reps;
  if (typeof reps === 'number') return reps * setsCount;
  if (!reps) return setsCount; // no rep count (e.g. a sprint set) → count the efforts
  const str = String(reps).trim();
  if (str.includes(',')) return str.split(',').reduce((sum, r) => sum + (parseFloat(r.trim()) || 0), 0);
  const n = parseFloat(str);
  return isNaN(n) ? setsCount : n * setsCount;
}

export function cnsLoadForExercise(exercise) {
  if (!exercise || !exercise.name) return { load: 0, cns: 0, modality: 'other', contacts: 0, distance: 0 };
  const efforts = totalReps(exercise);
  const cls = classifyMovement(exercise.name);

  if (cls && cls.cns > 0) {
    let load = 0, contacts = 0, distance = 0;
    if (cls.driver === 'Distance') {
      const per = parseFloat(exercise.distance) || 0;
      distance = per * (efforts || 1);
      load = distance > 0 ? cls.cns * (distance / 100) : cls.cns * efforts;
    } else {
      if (cls.driver === 'Contacts') contacts = efforts;
      load = cls.cns * efforts;
    }
    const modality = /Plyo/.test(cls.type) ? 'jump'
      : /Sprint|Run/.test(cls.type) ? 'sprint'
      : /Agility|Technical|Drill/.test(cls.type) ? 'drill' : 'movement';
    return { load, cns: cls.cns, modality, contacts, distance };
  }

  if (efforts === 0) return { load: 0, cns: 0, modality: 'lift', contacts: 0, distance: 0 };
  const bucket = classifyCnsBucket(exercise);
  const cns = LIFT_CNS[bucket] || 2;
  return { load: cns * efforts, cns, modality: 'lift', contacts: 0, distance: 0 };
}

// Total CNS load for a day's blocks (the program "blocks" array the tracker
// holds for the current day). Returns rounded total + the modality split.
export function cnsLoadForDay(blocks) {
  let total = 0, contacts = 0, distance = 0;
  const byModality = { lift: 0, jump: 0, sprint: 0, drill: 0, movement: 0, other: 0 };
  for (const block of (blocks || [])) {
    if (block.type === 'theme') continue;
    for (const ex of (block.exercises || [])) {
      const r = cnsLoadForExercise(ex);
      if (r.load <= 0) continue;
      total += r.load;
      byModality[r.modality] = (byModality[r.modality] || 0) + r.load;
      contacts += r.contacts;
      distance += r.distance;
    }
  }
  return { total: Math.round(total), byModality, contacts, distance: Math.round(distance) };
}
