import React, { useMemo } from 'react';

const QUALIFIER_2X = ['each', 'each arm', 'each leg', 'each side', 'all one arm first', 'all one leg first'];

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

function calcBlockTonnage(block, maxes) {
  if (!block?.exercises) return 0;
  let total = 0;

  for (const ex of block.exercises) {
    const mult = getMultiplier(ex.qualifier);
    const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 1);

    if (ex.percentageSets && Array.isArray(ex.percentageSets)) {
      // Percentage-based
      for (const ps of ex.percentageSets) {
        const pct = parseFloat(ps.percentage) || 0;
        const reps = parseInt(ps.reps) || 0;
        const baseMax = ex.baseMax ? (maxes[ex.baseMax] || 0) : 0;
        const weight = Math.round(baseMax * pct / 100 / 5) * 5;
        total += weight * reps * mult;
      }
    } else {
      // Manual weight
      const weight = parseFloat(ex.weight) || 0;
      if (weight > 0) {
        const totalReps = parseRepsTotal(ex.reps, setsCount);
        total += weight * totalReps * mult;
      }
    }
  }
  return total;
}

function calcCardio(block) {
  let minutes = 0, miles = 0;
  if (!block?.exercises) return { minutes, miles };
  for (const ex of block.exercises) {
    if (ex.duration) {
      const m = String(ex.duration).match(/(\d+)/);
      if (m) minutes += parseInt(m[1]);
    }
    if (ex.distance) {
      const d = String(ex.distance).match(/([\d.]+)/);
      if (d) miles += parseFloat(d[1]);
    }
  }
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
};

export default function DailyTonnage({ blocks, maxes }) {
  const { tonnage, cardio } = useMemo(() => {
    let ton = 0;
    let min = 0, mi = 0;
    for (const block of (blocks || [])) {
      ton += calcBlockTonnage(block, maxes || {});
      const c = calcCardio(block);
      min += c.minutes;
      mi += c.miles;
    }
    return { tonnage: ton, cardio: { minutes: min, miles: mi } };
  }, [blocks, maxes]);

  if (tonnage === 0 && cardio.minutes === 0 && cardio.miles === 0) return null;

  return (
    <div style={s.card}>
      <h3 style={s.title}>{'\uD83D\uDCCA'} Today's Volume</h3>
      <div style={s.row}>
        {tonnage > 0 && (
          <div style={s.stat}>
            <div style={s.statLabel}>TOTAL TONNAGE</div>
            <div style={s.statValue}>{tonnage.toLocaleString()} lbs</div>
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
