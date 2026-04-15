import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getBlockTypeName, getBlockIcon, get1RM, calculateWeight } from '../../utils/trackerHelpers';
import { applyExerciseDefaults } from '../../data/exerciseDefaults';

const API_BASE = 'https://app.bestrongagain.com/api/workout/';

// ── TV Landing: enter access code ──
function TVCodeEntry({ onConnect }) {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!code || code.length !== 4) { setError('Enter a 4-digit access code'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_BASE + 'load-program.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email: email || 'tv-display@bestrongagain.com' }),
      });
      const data = await res.json();
      if (data.success && data.data?.program) {
        onConnect({ code, email: email || data.data.userPosition?.email || '', data: data.data });
      } else {
        setError('Invalid code. Try again.');
      }
    } catch {
      setError('Network error. Check connection.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.landing}>
      <div style={styles.landingCard}>
        <div style={styles.landingIcon}>📺</div>
        <h1 style={styles.landingTitle}>Gym TV Mode</h1>
        <p style={styles.landingSubtitle}>Enter your access code to display your workout</p>

        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="Access Code"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={styles.codeInput}
          autoFocus
        />

        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ ...styles.codeInput, fontSize: '24px', letterSpacing: 'normal' }}
        />

        {error && <div style={styles.error}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading} style={styles.connectBtn}>
          {loading ? 'Connecting...' : 'Display Workout'}
        </button>

        <p style={styles.hint}>
          Open the Workout Tracker on your phone to track weights & reps.<br />
          This screen updates automatically.
        </p>
      </div>
    </div>
  );
}

// ── Exercise row for TV ──
function TVExercise({ exercise, blockIndex, exIndex, maxes, savedData, blockType }) {
  const ex = applyExerciseDefaults(exercise);
  const setsCount = typeof ex.sets === 'number' ? ex.sets : parseInt(ex.sets) || 1;

  // Get prescribed weight
  let prescribedWeight = '';
  if (ex.isPercentageBased && ex.percentages?.length > 0) {
    const oneRM = get1RM(ex.name, maxes, ex.baseMax);
    if (oneRM > 0) {
      prescribedWeight = ex.percentages.map(p => `${calculateWeight(oneRM, p)} lbs`).join(' / ');
    }
  } else if (ex.weight) {
    prescribedWeight = `${ex.weight} lbs`;
  }

  // Get tracked data from saved workout
  const weights = savedData?.weights || [];
  const actualReps = savedData?.actualReps || [];
  const isComplete = savedData?.completed || (weights.some(w => w) || actualReps.some(r => r));

  // Is conditioning/cardio?
  const isCardio = blockType === 'conditioning' || blockType === 'cardio';

  return (
    <div style={{
      ...styles.exerciseRow,
      background: isComplete ? 'rgba(76, 175, 80, 0.12)' : 'rgba(255,255,255,0.06)',
      borderLeft: isComplete ? '4px solid #4caf50' : '4px solid transparent',
    }}>
      <div style={styles.exerciseHeader}>
        <span style={styles.exerciseName}>
          {isComplete && <span style={{ color: '#4caf50', marginRight: '8px' }}>✓</span>}
          {ex.name}
        </span>
        {ex.qualifier && <span style={styles.qualifier}>{ex.qualifier}</span>}
      </div>

      {isCardio ? (
        <div style={styles.cardioInfo}>
          {ex.duration && <span style={styles.cardioTag}>⏱ {ex.duration} {ex.durationUnit || 'min'}</span>}
          {ex.distance && <span style={styles.cardioTag}>📏 {ex.distance} {ex.distanceUnit || 'mi'}</span>}
          {ex.intensity && <span style={styles.cardioTag}>🔥 {ex.intensity}</span>}
          {savedData?.actualDuration && <span style={styles.trackedTag}>Actual: {savedData.actualDuration} min</span>}
          {savedData?.actualDistance && <span style={styles.trackedTag}>Actual: {savedData.actualDistance} mi</span>}
        </div>
      ) : (
        <div style={styles.setsRow}>
          {/* Prescribed */}
          <div style={styles.prescribedSection}>
            <span style={styles.setsLabel}>
              {setsCount}x{ex.reps || '?'}
              {prescribedWeight && ` @ ${prescribedWeight}`}
            </span>
            {ex.isPercentageBased && ex.percentages && (
              <span style={styles.percentages}>
                ({ex.percentages.map(p => `${p}%`).join(' / ')})
              </span>
            )}
          </div>

          {/* Tracked sets */}
          {weights.length > 0 && (
            <div style={styles.trackedSets}>
              {Array.from({ length: setsCount }).map((_, si) => {
                const w = weights[si];
                const r = actualReps[si];
                if (!w && !r) return null;
                return (
                  <span key={si} style={styles.setChip}>
                    Set {si + 1}: {w || '—'} lbs × {r || '—'}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {ex.notes && <div style={styles.exerciseNotes}>{ex.notes}</div>}
    </div>
  );
}

// ── Block card for TV ──
function TVBlock({ block, blockIndex, maxes, savedBlockData, isActive }) {
  const isTheme = block.type === 'theme';

  if (isTheme && block.themeText) {
    return (
      <div style={styles.themeCard}>
        {block.themeText}
      </div>
    );
  }

  const completedCount = (block.exercises || []).filter((_, exIndex) => {
    const sd = savedBlockData?.exercises?.[exIndex];
    return sd?.completed || sd?.weights?.some(w => w) || sd?.actualReps?.some(r => r);
  }).length;
  const totalCount = block.exercises?.length || 0;

  return (
    <div style={{
      ...styles.blockCard,
      ...(isActive ? { border: '2px solid #667eea', boxShadow: '0 0 20px rgba(102,126,234,0.3)' } : {}),
    }}>
      <div style={styles.blockHeader}>
        <div style={styles.blockHeaderLeft}>
          <span style={{ fontSize: '24px' }}>{getBlockIcon(block.type)}</span>
          <span style={styles.blockTitle}>{getBlockTypeName(block.type)}</span>
          {totalCount > 0 && (
            <span style={styles.blockBadge}>
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {block.circuitType && (
          <span style={styles.circuitTag}>{block.circuitType.toUpperCase()}</span>
        )}
      </div>

      {block.notes && <div style={styles.blockNotes}>{block.notes}</div>}

      {(block.exercises || []).map((exercise, exIndex) => (
        <TVExercise
          key={exIndex}
          exercise={exercise}
          blockIndex={blockIndex}
          exIndex={exIndex}
          maxes={maxes}
          savedData={savedBlockData?.exercises?.[exIndex]}
          blockType={block.type}
        />
      ))}
    </div>
  );
}

// ── Main TV Display ──
export default function TVScreen() {
  const [connected, setConnected] = useState(false);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState(null);
  const [userName, setUserName] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [maxes, setMaxes] = useState({});
  const [savedWorkout, setSavedWorkout] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollRef = useRef(null);

  const handleConnect = useCallback((info) => {
    const { data } = info;
    setCode(info.code);
    setEmail(info.email);
    setProgram(data.program);
    setUserName(data.program?.userName || '');
    setCurrentWeek(data.userPosition?.currentWeek || 1);
    setCurrentDay(data.userPosition?.currentDay || 1);
    setMaxes({
      bench: parseFloat(data.userPosition?.oneRmBench) || 0,
      squat: parseFloat(data.userPosition?.oneRmSquat) || 0,
      deadlift: parseFloat(data.userPosition?.oneRmDeadlift) || 0,
      clean: parseFloat(data.userPosition?.oneRmClean) || 0,
    });
    if (data.savedWorkout) {
      setSavedWorkout(data.savedWorkout);
    }
    setLastUpdate(new Date());
    setConnected(true);
  }, []);

  // Poll for updates every 8 seconds
  useEffect(() => {
    if (!connected || !code) return;

    const poll = async () => {
      try {
        const res = await fetch(API_BASE + 'load-program.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, email: email || 'tv-display@bestrongagain.com' }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          const newWeek = data.data.userPosition?.currentWeek || currentWeek;
          const newDay = data.data.userPosition?.currentDay || currentDay;

          // Update program if week/day changed
          if (newWeek !== currentWeek || newDay !== currentDay || data.data.program) {
            setProgram(data.data.program);
            setCurrentWeek(newWeek);
            setCurrentDay(newDay);
          }

          if (data.data.savedWorkout) {
            setSavedWorkout(data.data.savedWorkout);
          }
          setLastUpdate(new Date());
        }
      } catch {
        // Silently retry on next interval
      }
    };

    pollRef.current = setInterval(poll, 8000);
    return () => clearInterval(pollRef.current);
  }, [connected, code, email, currentWeek, currentDay]);

  if (!connected) {
    return <TVCodeEntry onConnect={handleConnect} />;
  }

  const blocks = program?.blocks || [];
  const daysPerWeek = program?.daysPerWeek || 1;
  const totalWeeks = program?.totalWeeks || 1;
  const days = Array.from({ length: daysPerWeek }, (_, i) => i + 1);

  return (
    <div style={styles.tvContainer}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <h1 style={styles.programTitle}>{program?.name || 'Workout'}</h1>
          <span style={styles.userBadge}>{userName || 'Athlete'}</span>
        </div>
        <div style={styles.topBarRight}>
          <div style={styles.weekDay}>
            Week {currentWeek}/{totalWeeks} &bull; Day {currentDay}/{daysPerWeek}
          </div>
          {/* Day pills */}
          <div style={styles.dayPills}>
            {days.map(d => (
              <span key={d} style={d === currentDay ? styles.dayPillActive : styles.dayPill}>
                D{d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Blocks grid — two-column layout for landscape */}
      <div style={styles.blocksGrid}>
        {blocks.map((block, i) => (
          <TVBlock
            key={i}
            block={block}
            blockIndex={i}
            maxes={maxes}
            savedBlockData={savedWorkout?.data?.blocks?.[i]}
          />
        ))}
      </div>

      {/* Status bar */}
      <div style={styles.statusBar}>
        <span>📺 TV Mode — Code: {code}</span>
        <span>
          {lastUpdate
            ? `Last sync: ${lastUpdate.toLocaleTimeString()}`
            : 'Waiting for data...'}
        </span>
        <button onClick={() => { setConnected(false); clearInterval(pollRef.current); }} style={styles.disconnectBtn}>
          Exit
        </button>
      </div>
    </div>
  );
}

// ── Styles (16:9 landscape optimized) ──
const styles = {
  // Landing
  landing: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  landingCard: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '60px 80px',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.15)',
    maxWidth: '600px',
    width: '100%',
  },
  landingIcon: { fontSize: '64px', marginBottom: '16px' },
  landingTitle: {
    fontSize: '42px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 8px',
  },
  landingSubtitle: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 40px',
  },
  codeInput: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '20px',
    fontSize: '36px',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: '12px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    outline: 'none',
    marginBottom: '16px',
  },
  error: {
    color: '#ef5350',
    fontSize: '16px',
    marginBottom: '16px',
    fontWeight: '600',
  },
  connectBtn: {
    width: '100%',
    padding: '18px',
    fontSize: '20px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  hint: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: '1.6',
  },

  // TV Display
  tvContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    color: '#fff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 30px',
    boxSizing: 'border-box',
  },

  // Top bar
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexShrink: 0,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  programTitle: {
    fontSize: 'clamp(22px, 3vw, 36px)',
    fontWeight: '800',
    margin: 0,
    color: '#fff',
  },
  userBadge: {
    background: 'rgba(102,126,234,0.3)',
    border: '1px solid rgba(102,126,234,0.5)',
    borderRadius: '20px',
    padding: '6px 16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#b8c6ff',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  weekDay: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  dayPills: {
    display: 'flex',
    gap: '6px',
  },
  dayPill: {
    padding: '6px 12px',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '600',
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.5)',
  },
  dayPillActive: {
    padding: '6px 12px',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    boxShadow: '0 2px 10px rgba(102,126,234,0.5)',
  },

  // Blocks grid — responsive columns
  blocksGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '16px',
    overflow: 'auto',
    alignContent: 'start',
  },

  // Block card
  blockCard: {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  blockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    background: 'rgba(102,126,234,0.15)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  blockHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  blockTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  blockBadge: {
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '10px',
    padding: '2px 10px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  circuitTag: {
    background: 'rgba(255,193,7,0.2)',
    color: '#ffd54f',
    borderRadius: '8px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1px',
  },
  blockNotes: {
    padding: '10px 18px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontStyle: 'italic',
  },

  // Theme card
  themeCard: {
    background: 'linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))',
    borderRadius: '16px',
    border: '1px solid rgba(102,126,234,0.3)',
    padding: '20px 24px',
    fontSize: '18px',
    lineHeight: '1.6',
    color: 'rgba(255,255,255,0.85)',
    whiteSpace: 'pre-wrap',
    fontStyle: 'italic',
  },

  // Exercise row
  exerciseRow: {
    padding: '12px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'background 0.3s',
  },
  exerciseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  exerciseName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
  },
  qualifier: {
    fontSize: '12px',
    color: '#b8c6ff',
    background: 'rgba(102,126,234,0.2)',
    borderRadius: '6px',
    padding: '2px 8px',
    fontWeight: '600',
  },
  setsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
  },
  prescribedSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  setsLabel: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  percentages: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
  },
  trackedSets: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  setChip: {
    background: 'rgba(76,175,80,0.2)',
    border: '1px solid rgba(76,175,80,0.4)',
    color: '#81c784',
    borderRadius: '8px',
    padding: '3px 10px',
    fontSize: '13px',
    fontWeight: '600',
  },
  cardioInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  cardioTag: {
    background: 'rgba(33,150,243,0.15)',
    border: '1px solid rgba(33,150,243,0.3)',
    color: '#64b5f6',
    borderRadius: '8px',
    padding: '4px 10px',
    fontSize: '14px',
    fontWeight: '600',
  },
  trackedTag: {
    background: 'rgba(76,175,80,0.2)',
    border: '1px solid rgba(76,175,80,0.4)',
    color: '#81c784',
    borderRadius: '8px',
    padding: '4px 10px',
    fontSize: '14px',
    fontWeight: '600',
  },
  exerciseNotes: {
    marginTop: '4px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },

  // Status bar
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    marginTop: '10px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  disconnectBtn: {
    background: 'rgba(239,83,80,0.2)',
    border: '1px solid rgba(239,83,80,0.4)',
    color: '#ef5350',
    borderRadius: '8px',
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
