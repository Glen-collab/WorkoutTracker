import React, { useState, useEffect, useCallback } from 'react';
import { cnsLoadForDay } from '../../utils/cnsLoadCalc';
import { projectDayStats } from './DailyTonnage';

const s = {
  card: {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
  },
  row: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  stat: {
    flex: '1 1 auto',
    minWidth: '80px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px',
    textAlign: 'center',
    color: '#fff',
  },
  statLabel: {
    fontSize: '10px',
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: '800',
  },
  progress: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: '10px',
  },
  tabRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '6px',
    marginBottom: '12px',
  },
  tab: {
    padding: '5px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.05)',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: '#FFD700',
    background: 'rgba(255,215,0,0.15)',
  },
  graphArea: {
    marginTop: '12px',
    padding: '8px 0',
  },
  graphLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: '8px',
  },
  barRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '4px',
    height: '80px',
  },
  barCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: '1 1 0',
    maxWidth: '40px',
  },
  barValue: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '2px',
  },
  bar: {
    width: '100%',
    borderRadius: '4px 4px 0 0',
    minHeight: '2px',
  },
  barLabel: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '3px',
  },
};

const GRAPH_METRICS = [
  { key: 'tonnage', label: 'Tonnage (lbs)', color: '#667eea', suffix: '' },
  { key: 'cns_load', label: '⚡ CNS Load', color: '#dc2626', suffix: '' },
  { key: 'est_calories', label: 'Calories', color: '#ef4444', suffix: '' },
  { key: 'core_crunches', label: 'Core (reps)', color: '#10b981', suffix: '' },
  { key: 'cardio_minutes', label: 'Time (min)', color: '#f59e0b', suffix: ' min' },
  { key: 'cardio_miles', label: 'Distance (mi)', color: '#3b82f6', suffix: ' mi' },
];

export default function WeeklyStatsCard({ accessCode, userEmail, currentWeek, daysPerWeek, totalWeeks, getWeeklyStats, liveStats, dayBlocks, allWorkouts, maxes, userWeight, userGender }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [graphMetric, setGraphMetric] = useState('tonnage');
  const [loaded, setLoaded] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!getWeeklyStats || !accessCode || !userEmail) return;
    try {
      const result = await getWeeklyStats({ email: userEmail, code: accessCode });
      if (result.success && result.data?.weeks) {
        setWeeklyData(result.data.weeks);
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, [getWeeklyStats, accessCode, userEmail]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Today's neural cost, computed from the day's prescribed blocks (same engine
  // as the builder's ⚡ CNS Load view). Used both as the "today" pill and as the
  // current-week point on the CNS graph line.
  const cnsToday = (() => {
    try { return cnsLoadForDay(dayBlocks || [], maxes).total; } catch { return 0; }
  })();

  // Build ALL weeks array (1 to totalWeeks), merging in actual data
  const numWeeks = totalWeeks || Math.max(currentWeek, ...weeklyData.map(w => w.week), 4);

  // PROJECTION — the prescribed shape of the whole program before anything is
  // logged, so the graph shows a roadmap instead of a flatline of zeros. For
  // each week we sum the projected stats of its days (projectDayStats reuses the
  // exact live math on prescribed weights/reps + the athlete's own 1RM/bodyweight,
  // so it auto-scales powerlifter → beginner with no fudge factor). cns_load uses
  // the same engine as the CNS view. Keyed by week → metric values.
  const projectedByWeek = React.useMemo(() => {
    const out = {};
    if (!allWorkouts || typeof allWorkouts !== 'object') return out;
    // Scan the program's actual day keys ("week-day") so hidden / sparse days
    // are handled correctly instead of assuming a contiguous 1..daysPerWeek.
    for (const key of Object.keys(allWorkouts)) {
      const [wStr] = key.split('-');
      const w = parseInt(wStr, 10);
      if (!w || w > numWeeks) continue;
      const blocks = allWorkouts[key];
      if (!Array.isArray(blocks) || !blocks.length) continue;
      const acc = out[w] || (out[w] = { tonnage: 0, core_crunches: 0, cardio_minutes: 0, cardio_miles: 0, est_calories: 0, cns_load: 0 });
      const p = projectDayStats(blocks, maxes, userWeight, userGender);
      acc.tonnage += p.tonnage; acc.core_crunches += p.core_crunches;
      acc.cardio_minutes += p.cardio_minutes; acc.cardio_miles += p.cardio_miles;
      acc.est_calories += p.est_calories;
      try { acc.cns_load += cnsLoadForDay(blocks, maxes).total; } catch { /* skip */ }
    }
    return out;
  }, [allWorkouts, numWeeks, maxes, userWeight, userGender]);

  // Sticky projection — the future dashed roadmap should NEVER blink out as the
  // athlete logs. After a workout the program briefly re-fetches; during that
  // window allWorkouts can be momentarily empty, which would blank the plan.
  // Cache the last good projection per program (by access code) and fall back to
  // it whenever the live compute comes back empty, so the future line persists.
  const projCacheRef = React.useRef({ key: null, data: {} });
  const projection = React.useMemo(() => {
    const key = `${accessCode || ''}|${numWeeks}`;
    if (projectedByWeek && Object.keys(projectedByWeek).length > 0) {
      projCacheRef.current = { key, data: projectedByWeek };
      return projectedByWeek;
    }
    if (projCacheRef.current.key === key && Object.keys(projCacheRef.current.data).length > 0) {
      return projCacheRef.current.data;
    }
    return projectedByWeek;
  }, [projectedByWeek, accessCode, numWeeks]);

  const allWeeks = [];
  for (let w = 1; w <= numWeeks; w++) {
    const existing = weeklyData.find(d => d.week === w);
    let weekData = existing || { week: w, workouts: 0, tonnage: 0, core_crunches: 0, cardio_minutes: 0, cardio_miles: 0, est_calories: 0, cns_load: 0 };

    // Merge live stats for current week (add current session's progress)
    if (w === currentWeek && liveStats) {
      weekData = {
        ...weekData,
        tonnage: (weekData.tonnage || 0) + (liveStats.tonnage || 0),
        core_crunches: (weekData.core_crunches || 0) + (liveStats.coreEquiv || 0),
        cardio_minutes: (weekData.cardio_minutes || 0) + (liveStats.cardioMinutes || 0),
        cardio_miles: (weekData.cardio_miles || 0) + (liveStats.cardioMiles || 0),
        est_calories: (weekData.est_calories || 0) + (liveStats.estCalories || 0),
        // Today's prescribed CNS load adds onto whatever's logged this week so
        // the current point reflects the session in progress.
        cns_load: (weekData.cns_load || 0) + cnsToday,
      };
    }
    allWeeks.push(weekData);
  }

  const currentStats = allWeeks.find(w => w.week === currentWeek);

  if (!loaded || (weeklyData.length === 0 && !currentStats)) return null;

  const metric = GRAPH_METRICS.find(m => m.key === graphMetric) || GRAPH_METRICS[0];
  // Scale to the bigger of logged actuals and the projected plan so the dashed
  // projection line always fits inside the chart.
  const maxVal = Math.max(
    ...allWeeks.map(w => w[metric.key] || 0),
    ...allWeeks.map(w => projection[w.week]?.[metric.key] || 0),
    1,
  );

  return (
    <div style={s.card}>
      <h3 style={s.title}>{'\uD83D\uDCCA'} Week {currentWeek} Stats</h3>

      {currentStats && (
        <>
          <div style={s.progress}>
            {currentStats.workouts} / {daysPerWeek || '?'} workouts completed
          </div>
          <div style={s.row}>
            {currentStats.tonnage > 0 && (
              <div style={s.stat}>
                <div style={s.statLabel}>TONNAGE</div>
                <div style={s.statValue}>{currentStats.tonnage.toLocaleString()}</div>
              </div>
            )}
            {currentStats.core_crunches > 0 && (
              <div style={s.stat}>
                <div style={s.statLabel}>CORE</div>
                <div style={s.statValue}>{currentStats.core_crunches.toLocaleString()}</div>
              </div>
            )}
            {currentStats.cardio_minutes > 0 && (
              <div style={s.stat}>
                <div style={s.statLabel}>CARDIO</div>
                <div style={s.statValue}>{Math.round(currentStats.cardio_minutes)} min</div>
              </div>
            )}
            {currentStats.cardio_miles > 0 && (
              <div style={s.stat}>
                <div style={s.statLabel}>DISTANCE</div>
                <div style={s.statValue}>{currentStats.cardio_miles.toFixed(1)} mi</div>
              </div>
            )}
            {currentStats.est_calories > 0 && (
              <div style={s.stat}>
                <div style={s.statLabel}>CALORIES</div>
                <div style={s.statValue}>{currentStats.est_calories}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Progress graph across weeks */}
      {allWeeks.length > 1 && (
        <div style={s.graphArea}>
          <div style={s.graphLabel}>WEEKLY PROGRESS</div>
          <div style={s.tabRow}>
            {GRAPH_METRICS.map(m => (
              <button
                key={m.key}
                style={{ ...s.tab, ...(graphMetric === m.key ? s.tabActive : {}) }}
                onClick={() => setGraphMetric(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          {/* Legend: dashed = the program's plan, solid dot = what you've logged */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke={metric.color} strokeWidth="2" strokeDasharray="3,2" opacity="0.7" /></svg>
              projected
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill={metric.color} stroke="#fff" strokeWidth="1" /></svg>
              logged
            </span>
          </div>
          <div style={{ overflowX: allWeeks.length > 8 ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
            {(() => {
              const pad = { top: 20, right: 16, bottom: 28, left: 40 };
              // For 8 or fewer weeks, fill container (use percentage width via viewBox)
              // For more weeks, use fixed width per week for scrolling
              const weekWidth = 45;
              const scrollThreshold = 8;
              const useScroll = allWeeks.length > scrollThreshold;
              const w = useScroll ? pad.left + pad.right + (allWeeks.length - 1) * weekWidth + 20 : 300;
              const h = 120;
              const innerW = w - pad.left - pad.right;
              const innerH = h - pad.top - pad.bottom;
              const yOf = (val) => pad.top + innerH - (maxVal > 0 ? (Math.max(0, val) / maxVal) * innerH : 0);
              const points = allWeeks.map((wk, i) => {
                const actual = wk[metric.key] || 0;
                const proj = projection[wk.week]?.[metric.key] || 0;
                return {
                  x: pad.left + (allWeeks.length > 1 ? (i / (allWeeks.length - 1)) * innerW : innerW / 2),
                  actual, proj,
                  yActual: yOf(actual),
                  yProj: yOf(proj),
                  week: wk.week,
                  hasData: wk.workouts > 0,
                };
              });
              // Dashed projection line spans the whole program (the plan).
              const hasProjection = points.some(p => p.proj > 0);
              const projPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.yProj}`).join(' ');
              // Solid actual line connects ONLY logged weeks (so unlogged future
              // weeks don't drag the line down to zero — that was the flatline).
              const logged = points.filter(p => p.hasData);
              const actualPath = logged.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.yActual}`).join(' ');
              // Y-axis ticks
              const yTicks = [0, Math.round(maxVal / 2), Math.round(maxVal)];
              const fmt = v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v);

              return (
                <svg viewBox={`0 0 ${w} ${h}`} style={{ width: useScroll ? w : '100%', height: 'auto', minWidth: useScroll ? w : 'auto' }}>
                  {/* Grid lines */}
                  {yTicks.map((t, i) => {
                    const y = pad.top + innerH - (maxVal > 0 ? (t / maxVal) * innerH : 0);
                    return (
                      <g key={i}>
                        <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                        <text x={pad.left - 4} y={y + 3} fill="rgba(255,255,255,0.4)" fontSize="7" textAnchor="end">{fmt(t)}</text>
                      </g>
                    );
                  })}
                  {/* Projected plan — dashed line across the WHOLE program, incl.
                      future weeks, so the roadmap stays visible as weeks lock in */}
                  {hasProjection && (
                    <path d={projPath} fill="none" stroke={metric.color} strokeWidth="1.75" strokeDasharray="5,3" opacity="0.7" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  {/* Actual logged — solid, connecting logged weeks only */}
                  {logged.length > 1 && (
                    <path d={actualPath} fill="none" stroke={metric.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  {/* Hollow markers on projected (unlogged) weeks + solid dots on logged */}
                  {points.map((p, i) => (
                    <g key={i}>
                      {p.hasData ? (
                        <circle cx={p.x} cy={p.yActual} r={p.week === currentWeek ? 5 : 4}
                          fill={p.week === currentWeek ? '#FFD700' : metric.color}
                          stroke="#fff" strokeWidth="1" />
                      ) : (
                        hasProjection && (
                          <circle cx={p.x} cy={p.yProj} r={p.week === currentWeek ? 4 : 3}
                            fill="#1a1a2e" stroke={metric.color} strokeWidth="1.5" opacity="0.8" />
                        )
                      )}
                      {p.hasData && p.actual > 0 && (
                        <text x={p.x} y={p.yActual - 8} fill="rgba(255,255,255,0.85)" fontSize="8" textAnchor="middle" fontWeight="600">{fmt(p.actual)}</text>
                      )}
                      <text x={p.x} y={h - 6} fill={p.week === currentWeek ? '#FFD700' : p.hasData ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'} fontSize="9" textAnchor="middle" fontWeight={p.week === currentWeek ? 'bold' : 'normal'}>
                        W{p.week}
                      </text>
                    </g>
                  ))}
                </svg>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
