import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getBlockTypeName, getBlockIcon, get1RM, calculateWeight } from '../../utils/trackerHelpers';
import { applyExerciseDefaults } from '../../data/exerciseDefaults';
import TVStatic from './TVStatic';

const API_BASE = 'https://app.bestrongagain.com/api/workout/';
const WS_BASE = 'wss://app.bestrongagain.com/ws/';

// Block types that get collapsed into a single inline string
const INLINE_TYPES = ['warmup', 'cooldown', 'mobility', 'movement'];

// Generate a random 6-char room ID
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ── TV Landing: choose mode ──
function TVLanding({ roomId, deviceCount, onSwitchToStatic }) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'qr'

  const trackerUrl = `https://bestrongagain.netlify.app?tv=${roomId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(trackerUrl)}&bgcolor=0f0c29&color=fff`;

  if (mode === 'qr') {
    return (
      <div style={styles.landing}>
        <div style={styles.landingCard}>
          <h1 style={styles.landingTitle}>Scan to Start</h1>
          <p style={styles.landingSubtitle}>Point your phone camera at the QR code</p>

          <div style={styles.qrContainer}>
            <img src={qrUrl} alt="Scan to connect" style={styles.qrImage} />
          </div>

          {deviceCount > 1 ? (
            <div style={styles.connectedBanner}>
              {'\u{1F7E2}'} Phone connected — loading workout...
            </div>
          ) : (
            <p style={styles.hint}>
              Scan with your phone camera, then log in with your access code.<br />
              Your workout will appear on this TV.
            </p>
          )}

          <button onClick={() => setMode('choose')} style={styles.backLink}>
            {'\u2190'} Back to options
          </button>
        </div>
      </div>
    );
  }

  // Choose mode
  return (
    <div style={styles.landing}>
      <div style={{ ...styles.landingCard, maxWidth: '700px' }}>
        <h1 style={styles.landingTitle}>Gym TV</h1>
        <p style={styles.landingSubtitle}>Choose how to display your workout</p>

        <div style={styles.modeGrid}>
          <button onClick={() => setMode('qr')} style={styles.modeCard}>
            <span style={{ fontSize: '48px', marginBottom: '12px' }}>📱</span>
            <span style={styles.modeTitle}>Phone Control</span>
            <span style={styles.modeDesc}>
              Scan QR with your phone. Track on phone, TV updates live.
            </span>
          </button>

          <button onClick={onSwitchToStatic} style={styles.modeCard}>
            <span style={{ fontSize: '48px', marginBottom: '12px' }}>📋</span>
            <span style={styles.modeTitle}>Show Workout</span>
            <span style={styles.modeDesc}>
              Enter your code. See 2 days side-by-side like a whiteboard.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pull reps/duration from wherever the builder stored them ──
function getReps(ex) {
  if (ex.repsPerSet?.length > 0) return ex.repsPerSet[0];
  if (ex.reps) return ex.reps;
  if (Array.isArray(ex.sets) && ex.sets.length > 0 && typeof ex.sets[0] === 'object') {
    return ex.sets[0].reps || ex.sets[0].targetReps || '';
  }
  return '';
}

function getDuration(ex) {
  if (ex.duration) {
    const unit = ex.durationUnit || 'min';
    return `${ex.duration} ${unit}`;
  }
  return '';
}

function getSetsCount(ex) {
  const count = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 0);
  return count;
}

// Format sets x reps — hide sets if 0, show duration if timed
function formatSetsReps(ex) {
  const sets = getSetsCount(ex);
  const reps = getReps(ex);
  const duration = getDuration(ex);

  // Timed/duration exercise
  if (!reps && duration) {
    return sets > 0 ? `${sets}x ${duration}` : duration;
  }
  // Has reps
  if (reps) {
    return sets > 0 ? `${sets}x${reps}` : `x${reps}`;
  }
  // Has distance
  if (ex.distance) {
    const unit = ex.distanceUnit || 'mi';
    return sets > 0 ? `${sets}x ${ex.distance} ${unit}` : `${ex.distance} ${unit}`;
  }
  return '';
}

// ── Build a display string for an exercise ──
function getExerciseString(exercise) {
  const ex = applyExerciseDefaults(exercise);
  const display = formatSetsReps(ex);
  const qualifier = ex.qualifier ? ` ${ex.qualifier}` : '';
  return `${ex.name} ${display}${qualifier}`;
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
  const setsCount = getSetsCount(ex) || 1;
  const setsRepsDisplay = formatSetsReps(ex);

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
            {setsRepsDisplay}
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
  const [staticMode, setStaticMode] = useState(false);
  const [roomId] = useState(() => generateRoomId());
  const [program, setProgram] = useState(null);
  const [userName, setUserName] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [maxes, setMaxes] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [liveTracking, setLiveTracking] = useState({});
  const [deviceCount, setDeviceCount] = useState(0);
  const wsRef = useRef(null);
  const contentRef = useRef(null);

  // WebSocket connection — starts immediately on mount
  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(WS_BASE + roomId);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[TV WS] Connected to room', roomId);
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

          // Phone controls TV scroll
          if (msg.type === 'scroll_tv') {
            if (contentRef.current) {
              const amount = msg.direction === 'up' ? -300 : 300;
              contentRef.current.scrollBy({ top: amount, behavior: 'smooth' });
            }
            return;
          }

          // Full sync — phone sends entire program + tracking state
          if (msg.type === 'full_sync') {
            if (msg.tracking) setLiveTracking(msg.tracking);
            if (msg.week) setCurrentWeek(msg.week);
            if (msg.day) setCurrentDay(msg.day);
            if (msg.program) setProgram(msg.program);
            if (msg.userName) setUserName(msg.userName);
            if (msg.maxes) setMaxes(msg.maxes);
            setLastUpdate(new Date());
          }

        } catch { /* ignore bad messages */ }
      };

      ws.onclose = () => {
        console.log('[TV WS] Disconnected, reconnecting in 3s...');
        setDeviceCount(0);
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [roomId]);

  // Static whiteboard mode
  if (staticMode) return <TVStatic />;

  // Show landing until phone sends program data
  if (!program) {
    return <TVLanding roomId={roomId} deviceCount={deviceCount} onSwitchToStatic={() => setStaticMode(true)} />;
  }

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
          <span style={styles.weekDay}>Week {currentWeek}/{totalWeeks} &bull; Day {currentDay}/{daysPerWeek}</span>
          <div style={styles.dayPills}>
            {days.map(d => (
              <span key={d} style={d === currentDay ? styles.dayPillActive : styles.dayPill}>
                D{d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content — single column, top to bottom */}
      <div ref={contentRef} style={styles.content}>
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
              savedBlockData={null}
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
          {' — '}Room: {roomId}
        </span>
        <span>
          {lastUpdate
            ? `Last update: ${lastUpdate.toLocaleTimeString()}`
            : ''}
        </span>
        <button onClick={() => { setProgram(null); setLiveTracking({}); setUserName(''); }} style={styles.disconnectBtn}>
          New Session
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
  landingTitle: { fontSize: '42px', fontWeight: '800', color: '#fff', margin: '0 0 8px' },
  landingSubtitle: { fontSize: '18px', color: 'rgba(255,255,255,0.6)', margin: '0 0 30px' },
  qrContainer: {
    background: '#fff',
    borderRadius: '20px',
    padding: '20px',
    display: 'inline-block',
    marginBottom: '24px',
  },
  qrImage: {
    width: '260px',
    height: '260px',
    display: 'block',
  },
  roomCode: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '20px',
  },
  roomCodeValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#b8c6ff',
    letterSpacing: '3px',
  },
  connectedBanner: {
    background: 'rgba(76,175,80,0.15)',
    border: '1px solid rgba(76,175,80,0.4)',
    borderRadius: '12px',
    padding: '16px 24px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#81c784',
  },
  hint: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' },
  backLink: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
    fontSize: '14px', cursor: 'pointer', marginTop: '16px', padding: '8px',
  },
  modeGrid: {
    display: 'flex', gap: '20px', marginTop: '10px',
  },
  modeCard: {
    flex: 1, background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: '16px', padding: '30px 20px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    transition: 'all 0.2s',
  },
  modeTitle: {
    fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px',
  },
  modeDesc: {
    fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5',
  },

  // TV Display
  tvContainer: {
    height: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    color: '#fff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 30px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },

  // Top bar
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '8px', flexShrink: 0,
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
    borderRadius: '8px',
    border: '1px solid rgba(102,126,234,0.3)',
    padding: '8px 20px',
    fontSize: '16px',
    lineHeight: '1.3',
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    marginBottom: '8px',
  },

  // Inline banner for warmup/cooldown (comma-separated)
  inlineBanner: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '6px 20px',
    fontSize: '15px',
    lineHeight: '1.4',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '8px',
  },
  inlineLabel: {
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginRight: '6px',
  },

  // Workout block — full width, stacked
  workoutBlock: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  blockHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 20px',
    background: 'rgba(102,126,234,0.15)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  blockHeaderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  blockTitle: { fontSize: '20px', fontWeight: '700', color: '#fff' },
  blockBadge: {
    background: 'rgba(255,255,255,0.15)', borderRadius: '10px',
    padding: '2px 12px', fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.7)',
  },
  circuitTag: {
    background: 'rgba(255,193,7,0.2)', color: '#ffd54f', borderRadius: '8px',
    padding: '4px 12px', fontSize: '14px', fontWeight: '700', letterSpacing: '1px',
  },
  blockNotes: {
    padding: '4px 20px', fontSize: '14px', color: 'rgba(255,255,255,0.5)',
    borderBottom: '1px solid rgba(255,255,255,0.05)', fontStyle: 'italic',
  },

  // Exercise row — tight spacing
  exerciseRow: {
    padding: '6px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  exerciseHeader: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px',
  },
  exerciseName: { fontSize: '19px', fontWeight: '600', color: '#fff' },
  qualifier: {
    fontSize: '14px', color: '#b8c6ff', background: 'rgba(102,126,234,0.2)',
    borderRadius: '6px', padding: '2px 10px', fontWeight: '600',
  },
  setsRow: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px',
  },
  setsLabel: { fontSize: '17px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
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
