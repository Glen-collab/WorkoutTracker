import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getBlockTypeName, getBlockIcon, get1RM, calculateWeight } from '../../utils/trackerHelpers';
import { applyExerciseDefaults } from '../../data/exerciseDefaults';

const API_BASE = 'https://app.bestrongagain.com/api/workout/';
const WS_BASE = 'wss://app.bestrongagain.com/ws/';

// Block types that get collapsed into a single inline string
const INLINE_TYPES = ['warmup', 'cooldown', 'mobility', 'movement'];

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

// ── Build a display string for an exercise ──
function getExerciseString(exercise) {
  const ex = applyExerciseDefaults(exercise);
  const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 1);
  const reps = ex.repsPerSet?.[0] || ex.reps || ex.duration || '';
  const qualifier = ex.qualifier ? ` ${ex.qualifier}` : '';
  return `${ex.name} ${setsCount}x${reps}${qualifier}`;
}

// ── Inline banner for warmup/cooldown/mobility (comma-separated string) ──
function InlineBanner({ block, label, icon }) {
  const exercises = block.exercises || [];
  if (exercises.length === 0) return null;
  const text = exercises.map(ex => getExerciseString(ex)).join(',  ');
  return (
    <div style={styles.inlineBanner}>
      <span style={styles.inlineLabel}>{icon} {label}:</span> {text}
    </div>
  );
}

// ── Exercise row for workout blocks (bigger fonts) ──
function TVExercise({ exercise, blockIndex, exIndex, maxes, savedData, liveTracking, blockType }) {
  const ex = applyExerciseDefaults(exercise);
  const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 1);
  const repsDisplay = ex.repsPerSet?.[0] || ex.reps || (ex.duration ? ex.duration : '?');

  // Get prescribed weight
  let prescribedWeight = '';
  if (ex.isPercentageBased && ex.percentages?.length > 0) {
    const manualMax = ex.manualMax || 0;
    const oneRM = manualMax > 0 ? manualMax : get1RM(ex.name, maxes, ex.baseMax);
    if (oneRM > 0) {
      prescribedWeight = ex.percentages.map(p => `${calculateWeight(oneRM, p)} lbs`).join(' / ');
    }
  } else if (ex.weight) {
    prescribedWeight = `${ex.weight} lbs`;
  }

  // Get tracked data — prefer live WebSocket data, fall back to saved workout from API
  const lt = liveTracking || {};
  const liveComplete = lt[`complete-${blockIndex}-${exIndex}`];
  const liveWeights = Array.from({ length: setsCount }, (_, si) => lt[`${blockIndex}-${exIndex}-${si}-weight`] || '');
  const liveReps = Array.from({ length: setsCount }, (_, si) => lt[`${blockIndex}-${exIndex}-${si}-reps`] || '');
  const hasLiveData = liveComplete || liveWeights.some(w => w) || liveReps.some(r => r);

  const weights = hasLiveData ? liveWeights : (savedData?.weights || []);
  const actualReps = hasLiveData ? liveReps : (savedData?.actualReps || []);
  const isComplete = liveComplete || savedData?.completed || (weights.some(w => w) || actualReps.some(r => r));

  // Is conditioning/cardio?
  const isCardio = blockType === 'conditioning' || blockType === 'cardio';

  return (
    <div style={{
      ...styles.exerciseRow,
      background: isComplete ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
      borderLeft: isComplete ? '4px solid #4caf50' : '4px solid rgba(255,255,255,0.1)',
    }}>
      <div style={styles.exerciseHeader}>
        <span style={styles.exerciseName}>
          {isComplete && <span style={{ color: '#4caf50', marginRight: '10px' }}>✓</span>}
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
          <span style={styles.setsLabel}>
            {setsCount}x{repsDisplay}
            {prescribedWeight && ` @ ${prescribedWeight}`}
          </span>
          {ex.isPercentageBased && ex.percentages && (
            <span style={styles.percentages}>
              ({ex.percentages.map(p => `${p}%`).join(' / ')})
            </span>
          )}

          {/* Tracked sets */}
          {weights.length > 0 && (
            <div style={styles.trackedSets}>
              {Array.from({ length: setsCount }).map((_, si) => {
                const w = weights[si];
                const r = actualReps[si];
                if (!w && !r) return null;
                return (
                  <span key={si} style={styles.setChip}>
                    S{si + 1}: {w || '—'} × {r || '—'}
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

// ── Workout block (superset, straight-set, circuit, etc.) ──
function TVWorkoutBlock({ block, blockIndex, maxes, savedBlockData, liveTracking }) {
  const lt = liveTracking || {};
  const completedCount = (block.exercises || []).filter((_, exIndex) => {
    const liveComplete = lt[`complete-${blockIndex}-${exIndex}`];
    const sd = savedBlockData?.exercises?.[exIndex];
    return liveComplete || sd?.completed || sd?.weights?.some(w => w) || sd?.actualReps?.some(r => r);
  }).length;
  const totalCount = block.exercises?.length || 0;

  return (
    <div style={styles.workoutBlock}>
      <div style={styles.blockHeader}>
        <div style={styles.blockHeaderLeft}>
          <span style={{ fontSize: '28px' }}>{getBlockIcon(block.type)}</span>
          <span style={styles.blockTitle}>{getBlockTypeName(block.type)}</span>
          {totalCount > 0 && (
            <span style={styles.blockBadge}>{completedCount}/{totalCount}</span>
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
          liveTracking={liveTracking}
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
  const [liveTracking, setLiveTracking] = useState({});
  const [deviceCount, setDeviceCount] = useState(0);
  const wsRef = useRef(null);

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
    if (data.savedWorkout) setSavedWorkout(data.savedWorkout);
    setLastUpdate(new Date());
    setConnected(true);
  }, []);

  // WebSocket connection — replaces polling
  useEffect(() => {
    if (!connected || !code) return;

    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(WS_BASE + code);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[TV WS] Connected to room', code);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'status') {
            setDeviceCount(msg.devices);
            return;
          }

          // Phone sent a tracking update
          if (msg.type === 'tracking') {
            setLiveTracking(msg.data || {});
            setLastUpdate(new Date());
          }

          // Phone completed an exercise
          if (msg.type === 'exercise_complete') {
            setLiveTracking(prev => ({
              ...prev,
              [`complete-${msg.blockIndex}-${msg.exIndex}`]: true,
              ...Object.fromEntries(
                (msg.weights || []).map((w, si) => [`${msg.blockIndex}-${msg.exIndex}-${si}-weight`, w])
              ),
              ...Object.fromEntries(
                (msg.reps || []).map((r, si) => [`${msg.blockIndex}-${msg.exIndex}-${si}-reps`, r])
              ),
            }));
            setLastUpdate(new Date());
          }

          // Phone navigated to a different day
          if (msg.type === 'day_change') {
            setCurrentWeek(msg.week);
            setCurrentDay(msg.day);
            setLiveTracking({});
            if (msg.program) setProgram(msg.program);
            setLastUpdate(new Date());
          }

          // Full sync — phone sends entire tracking state
          if (msg.type === 'full_sync') {
            if (msg.tracking) setLiveTracking(msg.tracking);
            if (msg.week) setCurrentWeek(msg.week);
            if (msg.day) setCurrentDay(msg.day);
            if (msg.program) setProgram(msg.program);
            setLastUpdate(new Date());
          }

        } catch { /* ignore bad messages */ }
      };

      ws.onclose = () => {
        console.log('[TV WS] Disconnected, reconnecting in 3s...');
        setDeviceCount(0);
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [connected, code]);

  // Navigate to a specific week/day
  const loadDay = useCallback(async (week, day) => {
    if (week === currentWeek && day === currentDay) return;
    try {
      const res = await fetch(API_BASE + 'load-program.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code, email: email || 'tv-display@bestrongagain.com',
          requested_week: week, requested_day: day,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.program) {
        setProgram(data.data.program);
        setCurrentWeek(week);
        setCurrentDay(day);
        setSavedWorkout(data.data.savedWorkout || null);
        setLastUpdate(new Date());
      }
    } catch { /* retry next poll */ }
  }, [code, email, currentWeek, currentDay]);

  if (!connected) return <TVCodeEntry onConnect={handleConnect} />;

  const blocks = program?.blocks || [];
  const daysPerWeek = program?.daysPerWeek || 1;
  const totalWeeks = program?.totalWeeks || 1;
  const days = Array.from({ length: daysPerWeek }, (_, i) => i + 1);

  // Separate blocks by type
  const themeBlock = blocks.find(b => b.type === 'theme' && b.themeText);
  const inlineBlocks = blocks.filter(b => INLINE_TYPES.includes(b.type));
  const workoutBlocks = blocks.filter(b => !INLINE_TYPES.includes(b.type) && b.type !== 'theme');

  const themeText = themeBlock
    ? themeBlock.themeText.replace(/\[name\]/gi, (userName || 'Athlete').split(' ')[0])
    : null;

  return (
    <div style={styles.tvContainer}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <h1 style={styles.programTitle}>{program?.name || 'Workout'}</h1>
          <span style={styles.userBadge}>{userName || 'Athlete'}</span>
        </div>
        <div style={styles.topBarRight}>
          {totalWeeks > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => currentWeek > 1 && loadDay(currentWeek - 1, 1)}
                style={{ ...styles.weekBtn, opacity: currentWeek <= 1 ? 0.3 : 1 }}
                disabled={currentWeek <= 1}
              >{'\u25C0'}</button>
              <span style={styles.weekDay}>Week {currentWeek}/{totalWeeks}</span>
              <button
                onClick={() => currentWeek < totalWeeks && loadDay(currentWeek + 1, 1)}
                style={{ ...styles.weekBtn, opacity: currentWeek >= totalWeeks ? 0.3 : 1 }}
                disabled={currentWeek >= totalWeeks}
              >{'\u25B6'}</button>
            </div>
          )}
          <div style={styles.dayPills}>
            {days.map(d => (
              <button
                key={d}
                onClick={() => loadDay(currentWeek, d)}
                style={d === currentDay ? styles.dayPillActive : styles.dayPill}
              >
                D{d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content — single column, top to bottom */}
      <div style={styles.content}>
        {/* Theme banner */}
        {themeText && <div style={styles.themeBanner}>{themeText}</div>}

        {/* Warmup / cooldown / mobility — inline comma strings */}
        {inlineBlocks.map((block, i) => {
          const label = getBlockTypeName(block.type);
          const icon = getBlockIcon(block.type);
          return <InlineBanner key={`inline-${i}`} block={block} label={label} icon={icon} />;
        })}

        {/* Workout blocks — stacked vertically, full width */}
        {workoutBlocks.map((block, i) => {
          const origIndex = blocks.indexOf(block);
          return (
            <TVWorkoutBlock
              key={`work-${i}`}
              block={block}
              blockIndex={origIndex}
              maxes={maxes}
              savedBlockData={savedWorkout?.data?.blocks?.[origIndex]}
              liveTracking={liveTracking}
            />
          );
        })}
      </div>

      {/* Status bar */}
      <div style={styles.statusBar}>
        <span>
          <span style={{ color: deviceCount > 1 ? '#4caf50' : '#ff9800', marginRight: '6px' }}>
            {deviceCount > 1 ? '\u{1F7E2}' : '\u{1F7E1}'}
          </span>
          {deviceCount > 1 ? `Phone connected` : 'Waiting for phone...'}
          {' — '}Code: {code}
        </span>
        <span>
          {lastUpdate
            ? `Last update: ${lastUpdate.toLocaleTimeString()}`
            : ''}
        </span>
        <button onClick={() => { setConnected(false); if (wsRef.current) wsRef.current.close(); }} style={styles.disconnectBtn}>
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
  landingTitle: { fontSize: '42px', fontWeight: '800', color: '#fff', margin: '0 0 8px' },
  landingSubtitle: { fontSize: '18px', color: 'rgba(255,255,255,0.6)', margin: '0 0 40px' },
  codeInput: {
    display: 'block', width: '100%', boxSizing: 'border-box', padding: '20px',
    fontSize: '36px', fontWeight: '700', textAlign: 'center', letterSpacing: '12px',
    border: '2px solid rgba(255,255,255,0.2)', borderRadius: '16px',
    background: 'rgba(255,255,255,0.08)', color: '#fff', outline: 'none', marginBottom: '16px',
  },
  error: { color: '#ef5350', fontSize: '16px', marginBottom: '16px', fontWeight: '600' },
  connectBtn: {
    width: '100%', padding: '18px', fontSize: '20px', fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
    border: 'none', borderRadius: '14px', cursor: 'pointer', marginBottom: '20px',
  },
  hint: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' },

  // TV Display
  tvContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    color: '#fff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 40px',
    boxSizing: 'border-box',
  },

  // Top bar
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px', flexShrink: 0,
  },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  programTitle: { fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: '800', margin: 0, color: '#fff' },
  userBadge: {
    background: 'rgba(102,126,234,0.3)', border: '1px solid rgba(102,126,234,0.5)',
    borderRadius: '20px', padding: '6px 16px', fontSize: '18px', fontWeight: '600', color: '#b8c6ff',
  },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  weekDay: { fontSize: '20px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  weekBtn: {
    background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer',
    padding: '4px 8px', color: '#667eea', fontWeight: '700',
  },
  dayPills: { display: 'flex', gap: '6px' },
  dayPill: {
    padding: '8px 14px', borderRadius: '14px', fontSize: '16px', fontWeight: '600',
    background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
    border: 'none', cursor: 'pointer',
  },
  dayPillActive: {
    padding: '8px 14px', borderRadius: '14px', fontSize: '16px', fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
    boxShadow: '0 2px 10px rgba(102,126,234,0.5)', border: 'none', cursor: 'pointer',
  },

  // Scrollable content area
  content: {
    flex: 1,
    overflow: 'auto',
  },

  // Theme banner — compact, full width
  themeBanner: {
    background: 'linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))',
    borderRadius: '12px',
    border: '1px solid rgba(102,126,234,0.3)',
    padding: '12px 24px',
    fontSize: '18px',
    lineHeight: '1.4',
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    marginBottom: '12px',
  },

  // Inline banner for warmup/cooldown (comma-separated)
  inlineBanner: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '10px 24px',
    fontSize: '17px',
    lineHeight: '1.5',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '12px',
  },
  inlineLabel: {
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginRight: '6px',
  },

  // Workout block — full width, stacked
  workoutBlock: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginBottom: '14px',
  },
  blockHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 24px',
    background: 'rgba(102,126,234,0.15)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  blockHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  blockTitle: { fontSize: '22px', fontWeight: '700', color: '#fff' },
  blockBadge: {
    background: 'rgba(255,255,255,0.15)', borderRadius: '10px',
    padding: '2px 12px', fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.7)',
  },
  circuitTag: {
    background: 'rgba(255,193,7,0.2)', color: '#ffd54f', borderRadius: '8px',
    padding: '4px 12px', fontSize: '14px', fontWeight: '700', letterSpacing: '1px',
  },
  blockNotes: {
    padding: '10px 24px', fontSize: '16px', color: 'rgba(255,255,255,0.5)',
    borderBottom: '1px solid rgba(255,255,255,0.05)', fontStyle: 'italic',
  },

  // Exercise row — bigger fonts
  exerciseRow: {
    padding: '14px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  exerciseHeader: {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px',
  },
  exerciseName: { fontSize: '20px', fontWeight: '600', color: '#fff' },
  qualifier: {
    fontSize: '14px', color: '#b8c6ff', background: 'rgba(102,126,234,0.2)',
    borderRadius: '6px', padding: '2px 10px', fontWeight: '600',
  },
  setsRow: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px',
  },
  setsLabel: { fontSize: '18px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  percentages: { fontSize: '15px', color: 'rgba(255,255,255,0.4)' },
  trackedSets: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  setChip: {
    background: 'rgba(76,175,80,0.2)', border: '1px solid rgba(76,175,80,0.4)',
    color: '#81c784', borderRadius: '8px', padding: '4px 12px',
    fontSize: '16px', fontWeight: '600',
  },
  cardioInfo: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  cardioTag: {
    background: 'rgba(33,150,243,0.15)', border: '1px solid rgba(33,150,243,0.3)',
    color: '#64b5f6', borderRadius: '8px', padding: '5px 12px',
    fontSize: '17px', fontWeight: '600',
  },
  trackedTag: {
    background: 'rgba(76,175,80,0.2)', border: '1px solid rgba(76,175,80,0.4)',
    color: '#81c784', borderRadius: '8px', padding: '5px 12px',
    fontSize: '17px', fontWeight: '600',
  },
  exerciseNotes: {
    marginTop: '4px', fontSize: '15px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic',
  },

  // Status bar
  statusBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', marginTop: '8px', fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
  },
  disconnectBtn: {
    background: 'rgba(239,83,80,0.2)', border: '1px solid rgba(239,83,80,0.4)',
    color: '#ef5350', borderRadius: '8px', padding: '6px 16px',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
};
