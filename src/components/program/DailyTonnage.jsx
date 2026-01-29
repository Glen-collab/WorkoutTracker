import React, { useMemo } from 'react';

const QUALIFIER_2X = ['each', 'each arm', 'each leg', 'each side', 'all one arm first', 'all one leg first'];

// Core exercise name patterns
const CORE_PATTERNS = [
  /crunch/i, /sit.?up/i, /plank/i, /ab\b/i, /abs\b/i, /core/i,
  /hollow/i, /v.?up/i, /leg.?raise/i, /flutter/i, /bicycle/i,
  /pallof/i, /dead.?bug/i, /bird.?dog/i, /russian.?twist/i,
  /woodchop/i, /anti.?rot/i, /roll.?out/i, /pike/i, /dragon.?flag/i,
  /hanging.?(knee|leg|toe)/i, /toes.?to.?bar/i, /knee.?to.?elbow/i,
  /mountain.?climber/i, /bear.?crawl/i, /farmer/i, /carry/i,
  /l.?sit/i, /side.?bend/i, /oblique/i, /saxon/i,
];

function isCore(exerciseName) {
  if (!exerciseName) return false;
  return CORE_PATTERNS.some(p => p.test(exerciseName));
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
function calcCoreEquiv(ex) {
  const mult = getMultiplier(ex.qualifier);
  const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 1);

  // Check for duration-based (planks, holds)
  if (ex.duration) {
    const match = String(ex.duration).match(/(\d+)/);
    if (match) {
      const seconds = parseInt(match[1]);
      // If it says "min" multiply by 60
      const isMin = /min/i.test(String(ex.duration));
      const totalSec = (isMin ? seconds * 60 : seconds) * setsCount;
      return Math.round(totalSec / 2) * mult;
    }
  }

  // Rep-based core
  const totalReps = parseRepsTotal(ex.reps, setsCount);
  return totalReps * mult;
}

function calcBlockTonnage(block, maxes, trackingData, blockIndex) {
  if (!block?.exercises) return { tonnage: 0, coreEquiv: 0 };
  let tonnage = 0;
  let coreEquiv = 0;

  block.exercises.forEach((ex, exIndex) => {
    // Only count if marked complete
    const completedKey = `complete-${blockIndex}-${exIndex}`;
    // Check both direct key and the null-setIndex pattern
    const isCompleted = trackingData?.[completedKey] ||
      trackingData?.[`${blockIndex}-${exIndex}-null-${completedKey}`];
    if (!isCompleted) return;

    // Core exercises → crunch equivalents, not tonnage
    if (isCore(ex.name)) {
      coreEquiv += calcCoreEquiv(ex);
      return;
    }

    const mult = getMultiplier(ex.qualifier);
    const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 1);

    if (ex.percentageSets && Array.isArray(ex.percentageSets)) {
      for (const ps of ex.percentageSets) {
        const pct = parseFloat(ps.percentage) || 0;
        const reps = parseInt(ps.reps) || 0;
        const baseMax = ex.baseMax ? (maxes[ex.baseMax] || 0) : 0;
        const weight = Math.round(baseMax * pct / 100 / 5) * 5;
        tonnage += weight * reps * mult;
      }
    } else {
      const weight = parseFloat(ex.weight) || 0;
      if (weight > 0) {
        const totalReps = parseRepsTotal(ex.reps, setsCount);
        tonnage += weight * totalReps * mult;
      }
    }
  });

  return { tonnage, coreEquiv };
}

function calcCardio(block, trackingData, blockIndex) {
  let minutes = 0, miles = 0;
  if (!block?.exercises) return { minutes, miles };
  block.exercises.forEach((ex, exIndex) => {
    const completedKey = `complete-${blockIndex}-${exIndex}`;
    const isCompleted = trackingData?.[completedKey] ||
      trackingData?.[`${blockIndex}-${exIndex}-null-${completedKey}`];
    if (!isCompleted) return;

    if (ex.duration) {
      const m = String(ex.duration).match(/(\d+)/);
      if (m) minutes += parseInt(m[1]);
    }
    if (ex.distance) {
      const d = String(ex.distance).match(/([\d.]+)/);
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

export default function DailyTonnage({ blocks, maxes, trackingData }) {
  const { tonnage, cardio, coreEquiv } = useMemo(() => {
    let ton = 0, core = 0;
    let min = 0, mi = 0;
    (blocks || []).forEach((block, blockIndex) => {
      const bt = calcBlockTonnage(block, maxes || {}, trackingData, blockIndex);
      ton += bt.tonnage;
      core += bt.coreEquiv;
      const c = calcCardio(block, trackingData, blockIndex);
      min += c.minutes;
      mi += c.miles;
    });
    return { tonnage: ton, cardio: { minutes: min, miles: mi }, coreEquiv: core };
  }, [blocks, maxes, trackingData]);

  const hasAnything = tonnage > 0 || cardio.minutes > 0 || cardio.miles > 0 || coreEquiv > 0;

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
      </div>
    </div>
  );
}
