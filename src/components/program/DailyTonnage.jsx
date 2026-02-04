import React, { useMemo } from 'react';

const QUALIFIER_2X = ['each', 'each arm', 'each leg', 'each side', 'all one arm first', 'all one leg first'];

// Core exercise name patterns (count as crunch equivalents, not tonnage)
const CORE_PATTERNS = [
  /crunch/i, /sit.?up/i, /plank/i, /ab\b/i, /abs\b/i, /core/i,
  /hollow/i, /v.?up/i, /leg.?raise/i, /flutter/i, /bicycle/i,
  /pallof/i, /dead.?bug/i, /bird.?dog/i, /russian.?twist/i,
  /woodchop/i, /anti.?rot/i, /roll.?out/i, /pike/i, /dragon.?flag/i,
  /hanging.?(knee|leg|toe)/i, /toes.?to.?bar/i, /knee.?to.?elbow/i,
  /mountain.?climber/i, /bear.?crawl/i, /farmer/i, /carry/i,
  /l.?sit/i, /side.?bend/i, /oblique/i, /saxon/i,
];

// Mobility/stretch exercises that should NOT count towards tonnage
const MOBILITY_PATTERNS = [
  /cat.?(and|&)?.?cow/i, /cat.?cow/i,
  /stretch/i, /foam.?roll/i, /roll.?out/i,
  /mobility/i, /activation/i,
  /world.?greatest/i, /scorpion/i, /90.?90/i,
  /couch.?stretch/i, /pigeon/i, /frog/i,
  /spiderman/i, /inchworm/i,
  /band.?pull.?apart/i, /face.?pull/i,
  /arm.?circle/i, /leg.?swing/i, /hip.?circle/i,
  /glute.?bridge/i, /clam/i, /fire.?hydrant/i,
  /blackburn/i, /black.?bird/i, /prone/i,
  /y.?t.?w/i, /itw/i, /ytwl/i,
];

function isCore(exerciseName) {
  if (!exerciseName) return false;
  return CORE_PATTERNS.some(p => p.test(exerciseName));
}

function isMobility(exerciseName) {
  if (!exerciseName) return false;
  return MOBILITY_PATTERNS.some(p => p.test(exerciseName));
}

// Block types that should count towards tonnage
function isTonnageBlock(blockType) {
  return ['straight-set', 'superset', 'triset', 'circuit'].includes(blockType);
}

function getMultiplier(qualifier) {
  if (!qualifier) return 1;
  return QUALIFIER_2X.includes(qualifier.toLowerCase().trim()) ? 2 : 1;
}

function parseRepsTotal(reps, setsCount) {
  if (!reps) return 0;
  const str = String(reps);
  if (str.includes(',')) {
    return str.split(',').reduce((sum, r) => sum + (parseFloat(r.trim()) || 0), 0);
  }
  return (parseFloat(str) || 0) * (setsCount || 1);
}

// Calculate crunch-equivalents for a core exercise
// Timed exercises (planks, holds): seconds / 2 = crunch equivalent
// Rep-based: actual total reps × qualifier multiplier
function calcCoreEquiv(ex, trackingData, blockIndex, exIndex) {
  const mult = getMultiplier(ex.qualifier);

  // Check for tracked sets/reps (user-entered values)
  const trackedSets = parseFloat(trackingData?.[`${blockIndex}-${exIndex}-0-sets`]) || 0;
  const trackedReps = parseFloat(trackingData?.[`${blockIndex}-${exIndex}-0-reps`]) || 0;

  // Use tracked values if available, otherwise fall back to preset
  const setsCount = trackedSets > 0 ? trackedSets : (typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 1));

  // Check for duration-based (planks, holds)
  if (ex.duration && !trackedReps) {
    const match = String(ex.duration).match(/(\d+)/);
    if (match) {
      const seconds = parseInt(match[1]);
      // If it says "min" multiply by 60
      const isMin = /min/i.test(String(ex.duration));
      const totalSec = (isMin ? seconds * 60 : seconds) * setsCount;
      return Math.round(totalSec / 2) * mult;
    }
  }

  // Rep-based core - use tracked reps if available
  const repsPerSet = trackedReps > 0 ? trackedReps : (parseFloat(String(ex.reps).replace(/[^\d]/g, '')) || 0);
  const totalReps = repsPerSet * setsCount;
  return totalReps * mult;
}

// Get default weight based on gender (or 175 as neutral default)
export function getDefaultWeight(gender) {
  if (gender === 'M') return 200;
  if (gender === 'F') return 150;
  return 175; // neutral default
}

export function calcBlockTonnage(block, maxes, trackingData, blockIndex, userWeight, gender) {
  if (!block?.exercises) return { tonnage: 0, coreEquiv: 0 };

  // Use provided weight or gender-based default
  const effectiveWeight = userWeight > 0 ? userWeight : getDefaultWeight(gender);

  // Bodyweight multiplier: 15% of bodyweight
  const BODYWEIGHT_MULTIPLIER = 0.15;

  let tonnage = 0;
  let coreEquiv = 0;

  // Only calculate tonnage for strength-type blocks (not warmup/cooldown/mobility)
  const countTonnage = isTonnageBlock(block.type);

  block.exercises.forEach((ex, exIndex) => {
    const completedKey = `complete-${blockIndex}-${exIndex}`;
    const isCompleted = trackingData?.[completedKey];

    // All exercises require mark complete
    if (!isCompleted) return;

    // Core exercises → crunch equivalents, not tonnage
    if (isCore(ex.name)) {
      coreEquiv += calcCoreEquiv(ex, trackingData, blockIndex, exIndex);
      return;
    }

    // Skip mobility/stretch exercises - they don't count towards tonnage
    if (isMobility(ex.name)) {
      return;
    }

    // Skip tonnage calculation for non-strength blocks (warmup, cooldown, mobility, core)
    if (!countTonnage) {
      return;
    }

    const mult = getMultiplier(ex.qualifier);

    // Determine how many sets this exercise has
    let setsCount;
    if (Array.isArray(ex.sets) && ex.sets.length > 0 && typeof ex.sets[0] === 'object') {
      setsCount = ex.sets.length; // Builder format: array of objects
    } else if (typeof ex.sets === 'number') {
      setsCount = ex.sets;
    } else {
      setsCount = parseInt(ex.sets) || parseInt(ex.setsCount) || 1;
    }

    // Check for percentage-based exercise (builder format or normalized)
    const isPercentage = ex.isPercentageBased ||
      (Array.isArray(ex.sets) && ex.sets.length > 0 && typeof ex.sets[0] === 'object' && ex.sets[0]?.percentage != null);
    const percentages = ex.percentages || (isPercentage && Array.isArray(ex.sets) ? ex.sets.map(s => s.percentage) : null);
    const repsPerSet = ex.repsPerSet || (isPercentage && Array.isArray(ex.sets) ? ex.sets.map(s => s.reps) : null);

    // Read actual tracked weights/reps from user input
    for (let si = 0; si < setsCount; si++) {
      const trackedWeight = parseFloat(trackingData?.[`${blockIndex}-${exIndex}-${si}-weight`]) || 0;
      const trackedReps = parseFloat(trackingData?.[`${blockIndex}-${exIndex}-${si}-reps`]) || 0;

      if (trackedWeight > 0 && trackedReps > 0) {
        // User entered actual weight and reps — use those
        tonnage += trackedWeight * trackedReps * mult;
      } else if (isPercentage && percentages) {
        // Fall back to calculated percentage weight
        const pct = parseFloat(percentages[si]) || 0;
        const baseMax = ex.baseMax ? (maxes?.[ex.baseMax] || 0) : 0;
        const calcWeight = trackedWeight || Math.round(baseMax * pct / 100 / 5) * 5;
        const calcReps = trackedReps || parseFloat(repsPerSet?.[si]) || parseFloat(ex.reps) || 0;
        if (calcWeight > 0 && calcReps > 0) {
          tonnage += calcWeight * calcReps * mult;
        } else if (calcReps > 0) {
          // No max entered and no tracked weight - use 15% bodyweight as fallback
          tonnage += effectiveWeight * BODYWEIGHT_MULTIPLIER * calcReps * mult;
        }
      } else {
        // Check if user explicitly cleared the weight field (key exists but value is empty/0)
        const weightKey = `${blockIndex}-${exIndex}-${si}-weight`;
        const userClearedWeight = weightKey in (trackingData || {}) && !trackedWeight;

        // Fall back to prescribed weight (unless user explicitly cleared it)
        const prescribedWeight = userClearedWeight ? 0 : (trackedWeight || parseFloat(ex.weight) || 0);
        const prescribedReps = trackedReps || parseFloat(ex.reps) || 0;

        if (prescribedWeight > 0 && prescribedReps > 0) {
          tonnage += prescribedWeight * prescribedReps * mult;
        } else if (!isConditioningBlock(block) && prescribedReps > 0) {
          // No weight (bodyweight exercise or user cleared it): use 15% of effective bodyweight
          tonnage += effectiveWeight * BODYWEIGHT_MULTIPLIER * prescribedReps * mult;
        }
      }
    }
  });

  return { tonnage, coreEquiv };
}

function isConditioningBlock(block) {
  return block?.type === 'conditioning' || block?.type === 'cardio';
}

export function calcCardio(block, trackingData, blockIndex) {
  let minutes = 0, miles = 0;
  if (!block?.exercises) return { minutes, miles };
  block.exercises.forEach((ex, exIndex) => {
    const isCompleted = trackingData?.[`complete-${blockIndex}-${exIndex}`];
    if (!isCompleted) return;

    // Check trackingData first for user-entered values, then fall back to preset
    const trackedDuration = trackingData?.[`${blockIndex}-${exIndex}-null-duration`];
    const trackedDistance = trackingData?.[`${blockIndex}-${exIndex}-null-distance`];

    const durationVal = trackedDuration || ex.duration;
    const distanceVal = trackedDistance || ex.distance;

    if (durationVal) {
      const m = String(durationVal).match(/(\d+)/);
      if (m) minutes += parseInt(m[1]);
    }
    if (distanceVal) {
      const d = String(distanceVal).match(/([\d.]+)/);
      if (d) miles += parseFloat(d[1]);
    }
  });
  return { minutes, miles };
}

const s = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#333',
  },
  row: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  stat: {
    flex: '1 1 auto',
    minWidth: '90px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '10px',
    padding: '12px',
    textAlign: 'center',
    color: '#fff',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    opacity: 0.85,
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: '800',
  },
  cardioStat: {
    flex: '1 1 auto',
    minWidth: '90px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    borderRadius: '10px',
    padding: '12px',
    textAlign: 'center',
    color: '#fff',
  },
  coreStat: {
    flex: '1 1 auto',
    minWidth: '90px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    borderRadius: '10px',
    padding: '12px',
    textAlign: 'center',
    color: '#fff',
  },
  empty: {
    fontSize: '13px',
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};

export default function DailyTonnage({ blocks, maxes, trackingData, userWeight, userGender }) {
  const { tonnage, cardio, coreEquiv, estCalories } = useMemo(() => {
    const effectiveWeight = userWeight > 0 ? userWeight : getDefaultWeight(userGender);
    const weightKg = effectiveWeight * 0.453592;
    let ton = 0, core = 0;
    let min = 0, mi = 0;
    let completedExercises = 0;
    (blocks || []).forEach((block, blockIndex) => {
      const bt = calcBlockTonnage(block, maxes || {}, trackingData, blockIndex, userWeight || 0, userGender);
      ton += bt.tonnage;
      core += bt.coreEquiv;
      const c = calcCardio(block, trackingData, blockIndex);
      min += c.minutes;
      mi += c.miles;
      // Count completed exercises for calorie estimate
      (block.exercises || []).forEach((ex, exIndex) => {
        if (trackingData?.[`complete-${blockIndex}-${exIndex}`]) completedExercises++;
      });
    });
    // Calorie estimate: MET formula + tonnage bonus
    // Base: MET × weightKg × (minutes / 60)
    // Tonnage bonus: ~10 calories per 1000 lbs moved (reflects actual work done)
    const strengthMinutes = completedExercises * 3;
    const baseMET = 6;
    const strengthCal = baseMET * weightKg * (strengthMinutes / 60);
    const tonnageBonus = (ton / 1000) * 10; // Extra calories for heavier lifting
    const cardioCal = 7.5 * weightKg * (min / 60);
    const calories = Math.round(strengthCal + tonnageBonus + cardioCal);
    return { tonnage: ton, cardio: { minutes: min, miles: mi }, coreEquiv: core, estCalories: calories };
  }, [blocks, maxes, trackingData, userWeight, userGender]);

  const hasAnything = tonnage > 0 || cardio.minutes > 0 || cardio.miles > 0 || coreEquiv > 0 || estCalories > 0;

  return (
    <div style={s.card}>
      <h3 style={s.title}>{'\uD83D\uDCCA'} Today's Volume</h3>
      {!hasAnything && (
        <div style={s.empty}>Mark exercises complete to see your volume stats</div>
      )}
      <div style={s.row}>
        {tonnage > 0 && (
          <div style={s.stat}>
            <div style={s.statLabel}>TOTAL TONNAGE</div>
            <div style={s.statValue}>{tonnage.toLocaleString()} lbs</div>
          </div>
        )}
        {coreEquiv > 0 && (
          <div style={s.coreStat}>
            <div style={s.statLabel}>CORE WORK</div>
            <div style={s.statValue}>{coreEquiv.toLocaleString()} crunches</div>
          </div>
        )}
        {cardio.minutes > 0 && (
          <div style={s.cardioStat}>
            <div style={s.statLabel}>CARDIO TIME</div>
            <div style={s.statValue}>{cardio.minutes} min</div>
          </div>
        )}
        {cardio.miles > 0 && (
          <div style={s.cardioStat}>
            <div style={s.statLabel}>DISTANCE</div>
            <div style={s.statValue}>{cardio.miles.toFixed(1)} mi</div>
          </div>
        )}
        {estCalories > 0 && (
          <div style={{
            ...s.stat,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          }}>
            <div style={s.statLabel}>EST. CALORIES</div>
            <div style={s.statValue}>{Math.round(estCalories)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
