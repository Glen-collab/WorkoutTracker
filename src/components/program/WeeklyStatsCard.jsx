import React, { useState, useEffect, useCallback } from 'react';

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
    justifyContent: 'center',
    gap: '6px',
    marginBottom: '12px',
  },
  tab: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.05)',
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
  { key: 'tonnage', label: 'Tonnage', color: '#667eea', suffix: '' },
  { key: 'est_calories', label: 'Calories', color: '#ef4444', suffix: '' },
  { key: 'core_crunches', label: 'Core', color: '#10b981', suffix: '' },
  { key: 'cardio_minutes', label: 'Cardio', color: '#f59e0b', suffix: ' min' },
];

export default function WeeklyStatsCard({ accessCode, userEmail, currentWeek, daysPerWeek, totalWeeks, getWeeklyStats }) {
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

  // Build ALL weeks array (1 to totalWeeks), merging in actual data
  const numWeeks = totalWeeks || Math.max(currentWeek, ...weeklyData.map(w => w.week), 4);
  const allWeeks = [];
  for (let w = 1; w <= numWeeks; w++) {
    const existing = weeklyData.find(d => d.week === w);
    allWeeks.push(existing || { week: w, workouts: 0, tonnage: 0, core_crunches: 0, cardio_minutes: 0, cardio_miles: 0, est_calories: 0 });
  }

  const currentStats = allWeeks.find(w => w.week === currentWeek);

  if (!loaded || (weeklyData.length === 0 && !currentStats)) return null;

  const metric = GRAPH_METRICS.find(m => m.key === graphMetric) || GRAPH_METRICS[0];
  const maxVal = Math.max(...allWeeks.map(w => w[metric.key] || 0), 1);

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
                <div style={s.statValue}>{currentStats.cardio_minutes} min</div>
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
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
            {(() => {
              const pad = { top: 20, right: 16, bottom: 28, left: 40 };
              // Each week gets 40px width minimum, or fit to container if fewer weeks
              const weekWidth = 40;
              const minWidth = 280;
              const w = Math.max(minWidth, pad.left + pad.right + (allWeeks.length - 1) * weekWidth + 20);
              const h = 120;
              const innerW = w - pad.left - pad.right;
              const innerH = h - pad.top - pad.bottom;
              const points = allWeeks.map((wk, i) => ({
                x: pad.left + (allWeeks.length > 1 ? (i / (allWeeks.length - 1)) * innerW : innerW / 2),
                y: pad.top + innerH - (maxVal > 0 ? ((wk[metric.key] || 0) / maxVal) * innerH : 0),
                val: wk[metric.key] || 0,
                week: wk.week,
                hasData: wk.workouts > 0,
              }));
              const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
              const areaPath = linePath + ` L${points[points.length - 1].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`;
              // Y-axis ticks
              const yTicks = [0, Math.round(maxVal / 2), Math.round(maxVal)];
              const fmt = v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v;

              return (
                <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: 'auto', minWidth: w }}>
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
                  {/* Area fill */}
                  <path d={areaPath} fill={`${metric.color}22`} />
                  {/* Line */}
                  <path d={linePath} fill="none" stroke={metric.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Dots + labels */}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={p.week === currentWeek ? 5 : 4}
                        fill={p.week === currentWeek ? '#FFD700' : p.hasData ? metric.color : 'rgba(255,255,255,0.2)'}
                        stroke={p.week === currentWeek ? '#FFD700' : p.hasData ? '#fff' : 'rgba(255,255,255,0.3)'}
                        strokeWidth="1" />
                      {p.val > 0 && (
                        <text x={p.x} y={p.y - 8} fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle" fontWeight="600">{fmt(p.val)}</text>
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
