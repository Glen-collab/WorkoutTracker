import React, { useState, useEffect, useCallback } from 'react';
import MetricSheet, { InfoDot } from '../common/MetricSheet';

const overlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'linear-gradient(135deg, rgba(26,26,46,0.97), rgba(22,33,62,0.97))',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 16, fontFamily: 'Arial, sans-serif',
};

const card = {
  textAlign: 'center', color: '#fff', maxWidth: 400, width: '100%', padding: 24,
};

const grid = {
  display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', margin: '20px 0',
};

const statBox = {
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '12px 16px',
  minWidth: '100px',
  flex: '1 1 auto',
};

const statLabel = {
  fontSize: '10px', fontWeight: '600', opacity: 0.7, marginBottom: '4px',
};

const statValue = {
  fontSize: '20px', fontWeight: '800',
};

// Makes a stat tile tappable without changing how it looks.
const tappable = { position: 'relative', cursor: 'pointer' };

export default function WeeklySummaryModal({ isOpen, onClose, weekNumber, accessCode, userEmail, daysPerWeek, getWeeklyStats }) {
  const [stats, setStats] = useState(null);
  // Which stat's explainer sheet is open (null = closed). Sits above this
  // modal's overlay (z 9999) on purpose.
  const [infoKey, setInfoKey] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!isOpen || !getWeeklyStats || !accessCode || !userEmail) return;
    try {
      const result = await getWeeklyStats({ email: userEmail, code: accessCode });
      if (result.success && result.data?.weeks) {
        const weekData = result.data.weeks.find(w => w.week === weekNumber);
        if (weekData) {
          setStats(weekData);
          return;
        }
      }
    } catch { /* ignore */ }
    setStats(null);
  }, [isOpen, getWeeklyStats, accessCode, userEmail, weekNumber]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (!isOpen) return null;

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>&#127942;</div>
        <h2 style={{ fontSize: 26, margin: '0 0 4px', fontWeight: 'bold', color: '#FFD700' }}>
          Week {weekNumber} Complete!
        </h2>
        {stats ? (
          <>
            <p style={{ fontSize: 14, opacity: 0.7, margin: '0 0 16px' }}>
              {stats.workouts} / {daysPerWeek || '?'} workouts completed
            </p>

            <div style={grid}>
              {stats.tonnage > 0 && (
                <div style={{ ...statBox, ...tappable }} onClick={() => setInfoKey('tonnage')} role="button" tabIndex={0}>
                  <InfoDot dark />
                  <div style={statLabel}>TOTAL TONNAGE</div>
                  <div style={statValue}>{stats.tonnage.toLocaleString()} lbs</div>
                </div>
              )}
              {stats.core_crunches > 0 && (
                <div style={{ ...statBox, ...tappable }} onClick={() => setInfoKey('core')} role="button" tabIndex={0}>
                  <InfoDot dark />
                  <div style={statLabel}>CORE WORK</div>
                  <div style={statValue}>{stats.core_crunches.toLocaleString()} crunches</div>
                </div>
              )}
              {stats.cardio_minutes > 0 && (
                <div style={{ ...statBox, ...tappable }} onClick={() => setInfoKey('cardio_time')} role="button" tabIndex={0}>
                  <InfoDot dark />
                  <div style={statLabel}>CARDIO</div>
                  <div style={statValue}>{Math.round(stats.cardio_minutes)} min</div>
                </div>
              )}
              {stats.cardio_miles > 0 && (
                <div style={{ ...statBox, ...tappable }} onClick={() => setInfoKey('distance')} role="button" tabIndex={0}>
                  <InfoDot dark />
                  <div style={statLabel}>DISTANCE</div>
                  <div style={statValue}>{stats.cardio_miles.toFixed(1)} mi</div>
                </div>
              )}
              {stats.est_calories > 0 && (
                <div style={{ ...statBox, ...tappable }} onClick={() => setInfoKey('calories')} role="button" tabIndex={0}>
                  <InfoDot dark />
                  <div style={statLabel}>EST. CALORIES</div>
                  <div style={statValue}>{stats.est_calories}</div>
                </div>
              )}
            </div>
            <MetricSheet infoKey={infoKey} onClose={() => setInfoKey(null)} />
          </>
        ) : (
          <p style={{ fontSize: 14, opacity: 0.7, margin: '0 0 16px' }}>
            Great work this week!
          </p>
        )}

        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#1a1a2e', border: 'none', borderRadius: 24,
            padding: '12px 40px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
