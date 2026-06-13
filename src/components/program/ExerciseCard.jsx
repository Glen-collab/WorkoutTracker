import React, { useState, useRef } from 'react';
import { get1RM, calculateWeight } from '../../utils/trackerHelpers';
import TrackingInputs from './TrackingInputs';
import { getMotivationalMessage } from '../../data/exerciseMotivation';
import { isFunctional } from './DailyTonnage';
import { applyExerciseDefaults } from '../../data/exerciseDefaults';
import SWAP_INDEX from '../../data/exerciseSwapIndex.json';

// name -> swap-index entry, built once. Lets a strength exercise find its
// muscle category to suggest same-muscle substitutes.
const SWAP_BY_NAME = new Map(SWAP_INDEX.list.map((e) => [e.name.toLowerCase(), e]));

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white; padding: 16px 24px; border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-size: 16px; font-weight: 600;
    text-align: center; z-index: 10000; max-width: 90%;
    animation: gwtToastSlideUp 0.3s ease-out;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'gwtToastSlideDown 0.3s ease-out';
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 4000);
}

const s = {
  card: {
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    marginBottom: '10px',
    overflow: 'hidden',
    transition: 'all 0.2s',
  },
  cardCollapsed: {
    background: '#e8f5e9',
    border: '2px solid #4caf50',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    cursor: 'pointer',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    fontSize: '15px',
    color: '#333',
  },
  videoBtn: {
    background: 'linear-gradient(135deg, #f5851f 0%, #f6a623 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: '600',
  },
  videoBtnActive: {
    background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%',
    background: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  videoIframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  body: { padding: '0 14px 14px' },
  targetText: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '8px',
    fontWeight: '500',
  },
  detailRow: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px',
  },
  pill: {
    display: 'inline-block',
    background: '#e3f2fd',
    color: '#1565c0',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    marginRight: '6px',
    marginBottom: '6px',
  },
  pillGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    marginBottom: '10px',
  },
  markBtn: {
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px',
  },
  completedBadge: {
    background: '#e8f5e9',
    color: '#2e7d32',
    border: '2px solid #4caf50',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    width: '100%',
    marginTop: '10px',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  lockedInput: {
    background: '#f5f5f5',
    color: '#999',
    cursor: 'not-allowed',
  },
  expandBtn: {
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  warmup: {
    background: '#fff3e0',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '10px',
    fontSize: '13px',
  },
  warning: {
    background: '#fff3e0',
    border: '1px solid #ff9800',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px',
    color: '#e65100',
    marginBottom: '8px',
  },
  prevRec: {
    background: '#e8f5e9',
    border: '1px solid #4caf50',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#2e7d32',
    marginTop: '10px',
    marginBottom: '6px',
  },
  recSection: { marginTop: '10px' },
  recLabel: { fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' },
  recBtns: { display: 'flex', gap: '8px' },
  recBtn: {
    flex: 1,
    padding: '8px',
    borderRadius: '8px',
    border: '2px solid',
    background: 'transparent',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  notesCard: {
    background: '#fffde7',
    borderLeft: '3px solid #fbc02d',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '13px',
    color: '#555',
    marginBottom: '8px',
    fontStyle: 'italic',
  },
  setLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '4px',
    marginTop: '8px',
  },
  condInput: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '6px',
  },
};

const recLabels = { up: 'GO HEAVIER', same: 'STAY THE SAME', down: 'GO LIGHTER' };

export default function ExerciseCard({
  exercise,
  blockIndex,
  exIndex,
  blockType,
  maxes,
  userName,
  savedExerciseData,
  previousRecommendation,
  previousExerciseData,
  trackingData,
  onUpdateTracking,
  onMarkComplete,
  onSetRecommendation,
  prefillReps,
}) {
  // Collapsed if marked complete, but allow manual expand
  const isMarkedComplete = trackingData?.[`complete-${blockIndex}-${exIndex}`] || false;
  const [forceExpanded, setForceExpanded] = useState(false);
  const collapsed = isMarkedComplete && !forceExpanded;

  const [showVideo, setShowVideo] = useState(false);
  const isStrength = ['straight-set', 'superset', 'triset'].includes(blockType);
  const isCardio = blockType === 'cardio';
  const isMovement = blockType === 'movement' || blockType === 'conditioning';
  const isCircuit = blockType === 'circuit';
  const isWarmup = ['warmup', 'mobility', 'cooldown', 'core', 'abs', 'finisher'].includes(blockType);
  // Fallback: if no specific type matches, treat as generic exercise
  const isGeneric = !isStrength && !isCardio && !isMovement && !isCircuit && !isWarmup;

  // Normalize builder format: sets may be objects [{id, reps, percentage, ...}]
  // Convert to flat percentages/repsPerSet arrays the tracker expects
  // Also apply exercise defaults for any missing fields (safety net)
  const normalizedEx = (() => {
    const ex = applyExerciseDefaults({ ...exercise });
    if (Array.isArray(ex.sets) && ex.sets.length > 0 && typeof ex.sets[0] === 'object') {
      // Builder format: sets are objects per set. Could be percentage-driven
      // (1RM-based) or bodyweight/manual-weight (just reps per set). Either
      // way we flatten into repsPerSet and a numeric sets count so the rest
      // of the renderer doesn't have to know about the array shape.
      ex.repsPerSet = ex.sets.map(s => s?.reps);
      if (ex.sets[0]?.percentage != null) {
        ex.percentages = ex.sets.map(s => s.percentage);
        ex.dropPercentages = ex.sets.map(s => s.dropPercentage);
        ex.dropRepsPerSet = ex.sets.map(s => s.dropReps);
        ex.stripPercentages = ex.sets.map(s => s.stripPercentage);
        ex.stripRepsPerSet = ex.sets.map(s => s.stripReps);
        ex.isPercentageBased = true;
      }
      ex.setsCount = ex.sets.length;
      ex.sets = ex.sets.length;
    }
    return ex;
  })();
  // Use normalizedEx for rendering
  const ex = normalizedEx;

  // Check if exercise has drop/strip sets
  const isDropSet = exercise.qualifier === 'drop set';
  const isStripSet = exercise.qualifier === 'strip set';

  const getTrack = (setIdx, field) => {
    if (!trackingData) return '';
    if (setIdx !== null) return trackingData?.[`${blockIndex}-${exIndex}-${setIdx}-${field}`] || '';
    // Conditioning fields stored with null setIndex
    return trackingData?.[`${blockIndex}-${exIndex}-null-${field}`] || '';
  };

  const activeRec = trackingData?.[`rec-${blockIndex}-${exIndex}`] || null;

  const handleMark = () => {
    const firstName = (userName || '').split(' ')[0];
    let msg = getMotivationalMessage(ex.name, blockType);
    // ~30% of the time, prepend the user's first name
    if (firstName && Math.random() < 0.3) {
      msg = `${firstName}, ${msg.charAt(0).toLowerCase()}${msg.slice(1)}`;
    }
    showToast(msg);
    setForceExpanded(false); // Collapse after marking complete
    // Save completed flag to trackingData for tonnage calculations
    if (onUpdateTracking) onUpdateTracking(blockIndex, exIndex, null, `complete-${blockIndex}-${exIndex}`, true);
    if (onMarkComplete) onMarkComplete(blockIndex, exIndex);
  };

  const handleRec = (dir) => {
    if (onSetRecommendation) onSetRecommendation(blockIndex, exIndex, dir);
    if (onUpdateTracking)
      onUpdateTracking(blockIndex, exIndex, null, `rec-${blockIndex}-${exIndex}`, dir);
  };

  // Helper: show completed badge or mark button
  const clientNoteKey = `${blockIndex}-${exIndex}-null-note`;
  const clientNote = trackingData?.[clientNoteKey] || '';
  const [noteOpen, setNoteOpen] = useState(false);

  const renderMarkButton = (extraStyle) => {
    return (
      <>
        {/* Client notes per exercise */}
        <div style={{ marginTop: '8px', marginBottom: '6px' }}>
          {!noteOpen && !clientNote ? (
            <button
              onClick={() => setNoteOpen(true)}
              style={{ background: 'none', border: 'none', color: '#999', fontSize: '12px', cursor: 'pointer', padding: '4px 0' }}
            >+ Add note</button>
          ) : (
            <textarea
              placeholder="Your notes on this exercise..."
              value={clientNote}
              onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'note', e.target.value)}
              onFocus={() => setNoteOpen(true)}
              style={{
                width: '100%', padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '8px',
                fontSize: '13px', minHeight: '50px', resize: 'vertical', boxSizing: 'border-box',
                fontFamily: 'inherit', outline: 'none', color: '#444', background: isMarkedComplete ? '#f5f5f5' : '#fff',
              }}
              readOnly={isMarkedComplete}
            />
          )}
        </div>
        {isMarkedComplete ? (
          <div style={{ ...s.completedBadge, ...extraStyle }}>{'\u2705'} Completed</div>
        ) : (
          <button style={{ ...s.markBtn, ...extraStyle }} onClick={handleMark}>
            {'\u2713'} Mark Complete
          </button>
        )}
      </>
    );
  };

  // Input style when locked
  const lockStyle = isMarkedComplete ? s.lockedInput : {};
  const inputLocked = isMarkedComplete;

  // Percentage-based strength (use normalized ex)
  const isBodyweight = ex.baseMax === 'bodyweight';
  const isManualWeight = ex.baseMax === 'manual';
  const oneRM = isStrength && ex.isPercentageBased && !isBodyweight && !isManualWeight ? get1RM(ex.name, maxes, ex.baseMax) : 0;
  const hasPercentages = ex.isPercentageBased && ex.percentages?.length > 0 && !isBodyweight && !isManualWeight;

  // Only show auto warm-up for flat barbell bench and back squat
  const showWarmup = (() => {
    const name = (ex.name || '').toLowerCase();
    const isBench = name.includes('bench press') && !name.includes('incline') && !name.includes('decline') && !name.includes('dumbbell') && !name.includes('db');
    const isBackSquat = name.includes('back squat');
    return isBench || isBackSquat;
  })();

  const warmupSets = showWarmup ? (
    oneRM > 225
      ? [
          { reps: 5, pct: 60 },
          { reps: 5, pct: 65 },
          { reps: 3, pct: 80 },
          { reps: 1, pct: 85 },
        ]
      : [
          { reps: 5, pct: 60 },
          { reps: 3, pct: 65 },
          { reps: 1, pct: 80 },
        ]
  ) : [];

  const renderRecSection = () => (
    <>
      {previousRecommendation && (
        <div style={s.prevRec}>
          {'\uD83D\uDCC8'} Last week you said:{' '}
          <strong>{recLabels[previousRecommendation] || previousRecommendation}</strong>
          {(() => {
            // Saved workouts store weights in a flat weights[] array (not
            // sets[].weight) — read that so the "used X lbs" actually shows.
            const prevWeights = previousExerciseData?.weights;
            if (!Array.isArray(prevWeights) || prevWeights.length === 0) return null;
            const weights = prevWeights.map((w) => parseFloat(w)).filter((w) => w > 0);
            if (weights.length === 0) return null;
            return ` (used ${Math.max(...weights)} lbs)`;
          })()}
        </div>
      )}
      <div style={s.recSection}>
        <div style={s.recLabel}>{'\uD83D\uDCCA'} Next Week's Plan</div>
        <div style={s.recBtns}>
          {[
            { dir: 'up', icon: '\u2B06\uFE0F', color: '#4caf50' },
            { dir: 'same', icon: '\u27A1\uFE0F', color: '#2196f3' },
            { dir: 'down', icon: '\u2B07\uFE0F', color: '#f44336' },
          ].map(({ dir, icon, color }) => (
            <button
              key={dir}
              style={{
                ...s.recBtn,
                borderColor: color,
                background: activeRec === dir ? color : 'transparent',
                color: activeRec === dir ? '#fff' : color,
                ...(isMarkedComplete ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
              onClick={() => !isMarkedComplete && handleRec(dir)}
              disabled={isMarkedComplete}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderStrength = () => {
    // Timed holds (planks, wall sits, dead hangs…): a hold with a duration, no
    // reps, and no prescribed weight is bodyweight-for-time — show ONLY a
    // duration box per set, not pointless Weight/Reps inputs.
    const isTimedHold = !ex.isPercentageBased && ex.duration && !ex.reps && !ex.weight;
    if (isTimedHold) {
      // setsCount-first so an empty sets[] doesn't render "0 Set".
      const thSets = (typeof ex.sets === 'number' && ex.sets > 0)
        ? ex.sets
        : (parseInt(ex.setsCount) || (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets)) || 1);
      const thUnit = getUnitLabel(ex.durationUnit, 'sec');
      // Only call it a "Hold" for actual isometric holds (plank, wall sit, dead
      // hang, L-sit…). Other timed movements (tire walks, carries) are "For
      // time" — not a hold.
      const isActualHold = /\b(plank|wall\s?sit|dead\s?hang|hang|l-?sit|hollow|bridge|superman|iso|isometric|hold)\b/i.test(ex.name || '');
      const timedLabel = isActualHold ? 'Hold for time' : 'For time';
      return (
        <>
          <div style={{ ...s.targetText, fontWeight: '700' }}>
            {timedLabel} — {thSets} Set{thSets > 1 ? 's' : ''}{ex.qualifier ? ` (${ex.qualifier})` : ''}
          </div>
          {Array.from({ length: thSets }).map((_, si) => (
            <div key={si}>
              <div style={s.setLabel}>
                Set {si + 1}: {formatWithUnit(ex.duration, thUnit)}{ex.qualifier ? ` ${ex.qualifier}` : ''}
              </div>
              <input
                type="text"
                placeholder={`${ex.duration} ${thUnit}`}
                value={getTrack(si, 'duration')}
                onChange={(e) => onUpdateTracking(blockIndex, exIndex, si, 'duration', e.target.value)}
                style={{ ...s.condInput, marginBottom: '6px', ...lockStyle }}
                readOnly={inputLocked}
              />
            </div>
          ))}
          {renderExtraFields()}
          {renderMarkButton()}
          {renderRecSection()}
        </>
      );
    }

    // Functional/corrective exercises: show warmup-style view, no percentage weights
    if (isFunctional(ex.name)) {
      const fnSets = typeof ex.sets === 'number' ? ex.sets : (ex.setsCount || parseInt(ex.sets) || 1);
      const fnDurationUnit = getUnitLabel(ex.durationUnit, 'sec');
      const fnHasDuration = ex.duration;
      const fnHasReps = ex.reps;

      // Build info pills
      const fnDetails = [
        fnHasReps ? { label: 'Reps', val: `${ex.reps}${ex.qualifier ? ' ' + ex.qualifier : ''}` } : null,
        fnHasDuration ? { label: 'Duration', val: formatWithUnit(ex.duration, fnDurationUnit) } : null,
        ex.rest ? { label: 'Rest', val: ex.rest } : null,
      ].filter(Boolean);

      return (
        <>
          {/* Info pills */}
          {fnDetails.length > 0 && (
            <div style={s.pillGrid}>
              {fnDetails.map((d, i) => (
                <span key={i} style={s.pill}>{d.label}: {d.val}</span>
              ))}
            </div>
          )}
          {/* Editable tracking */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Sets:</span>
                <input
                  type="number"
                  placeholder={String(fnSets)}
                  value={getTrack(0, 'sets') || ''}
                  onChange={(e) => onUpdateTracking(blockIndex, exIndex, 0, 'sets', e.target.value)}
                  style={{ width: '50px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', textAlign: 'center', ...lockStyle }}
                  readOnly={inputLocked}
                />
              </div>
              {fnHasReps && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#666' }}>Reps:</span>
                  <input
                    type="number"
                    placeholder={String(ex.reps).replace(/[^\d]/g, '') || '10'}
                    value={getTrack(0, 'reps') || ''}
                    onChange={(e) => onUpdateTracking(blockIndex, exIndex, 0, 'reps', e.target.value)}
                    style={{ width: '50px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', textAlign: 'center', ...lockStyle }}
                    readOnly={inputLocked}
                  />
                </div>
              )}
              {fnHasDuration && !fnHasReps && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#666' }}>Duration:</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{formatWithUnit(ex.duration, fnDurationUnit)}</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              Target: {fnSets} sets {fnHasReps ? `× ${ex.reps}${ex.qualifier ? ' ' + ex.qualifier : ''}` : ''} {fnHasDuration && !fnHasReps ? `× ${formatWithUnit(ex.duration, fnDurationUnit)}` : ''}{ex.calories ? ` × ${ex.calories} cal` : ''}
            </div>
          </div>
          {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
          {renderMarkButton()}
        </>
      );
    }

    // Manual weight exercises - user enters their own weight (not percentage-based)
    if (isManualWeight && ex.isPercentageBased && Array.isArray(ex.percentages)) {
      const mwSets = ex.percentages.length;
      const dUnit = getUnitLabel(ex.durationUnit, 'sec');
      const hasDuration = ex.duration;
      const hasReps = ex.reps;
      // Detect machine exercises for pin weight field
      const isMachineExercise = (ex.equipment || []).some(e => e === 'Machine' || e === 'Cable') ||
        /machine|cable|lat pull|pec dec|leg press|leg ext|leg curl|hip abduct|hip adduct|calf raise|pulldown/i.test(ex.name || '');

      return (
        <>
          <div style={{ ...s.targetText, fontWeight: '700' }}>
            Manual Weight — {mwSets} Sets{ex.qualifier ? ` (${ex.qualifier})` : ''}
          </div>
          {hasDuration && (
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              Duration: {formatWithUnit(ex.duration, dUnit)}{ex.qualifier ? ` ${ex.qualifier}` : ''}
            </div>
          )}
          {ex.percentages.map((_, si) => {
            const targetReps = ex.repsPerSet?.[si] || ex.reps || '';
            const dropReps = ex.dropRepsPerSet?.[si];
            const stripReps = ex.stripRepsPerSet?.[si];
            return (
              <div key={si}>
                <div style={s.setLabel}>
                  Set {si + 1}{targetReps ? `: ${targetReps} reps` : ''}{hasDuration && !hasReps ? `: ${formatWithUnit(ex.duration, dUnit)}` : ''}{ex.qualifier && !isDropSet && !isStripSet && !hasDuration ? ` ${ex.qualifier}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    inputMode="text"
                    placeholder={isMachineExercise ? "Weight / lbs (or BW)" : "Weight (lbs) or BW"}
                    value={getTrack(si, 'weight')}
                    onChange={(e) => onUpdateTracking(blockIndex, exIndex, si, 'weight', e.target.value)}
                    style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
                    readOnly={inputLocked}
                  />
                  {isMachineExercise && (
                    <input
                      type="text"
                      placeholder="Pin #"
                      value={getTrack(si, 'pin')}
                      onChange={(e) => onUpdateTracking(blockIndex, exIndex, si, 'pin', e.target.value)}
                      style={{ ...s.condInput, flex: '0 0 60px', marginBottom: 0, textAlign: 'center', ...lockStyle }}
                      readOnly={inputLocked}
                    />
                  )}
                  {hasReps && (
                    <input
                      type="number"
                      placeholder={`${targetReps || '?'} reps`}
                      value={getTrack(si, 'reps')}
                      onChange={(e) => onUpdateTracking(blockIndex, exIndex, si, 'reps', e.target.value)}
                      style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
                      readOnly={inputLocked}
                    />
                  )}
                </div>
                {/* Drop set inputs for manual weight */}
                {(isDropSet || isStripSet) && dropReps > 0 && (
                  <div style={{ marginTop: '4px', paddingLeft: '12px', borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', marginBottom: '2px' }}>
                      Drop → {dropReps} reps
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input
                        type="number"
                        placeholder="Drop weight (lbs)"
                        value={getTrack(`${si}-drop`, 'weight')}
                        onChange={(e) => onUpdateTracking(blockIndex, exIndex, `${si}-drop`, 'weight', e.target.value)}
                        style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
                        readOnly={inputLocked}
                      />
                      <input
                        type="number"
                        placeholder={`${dropReps} reps`}
                        value={getTrack(`${si}-drop`, 'reps')}
                        onChange={(e) => onUpdateTracking(blockIndex, exIndex, `${si}-drop`, 'reps', e.target.value)}
                        style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
                        readOnly={inputLocked}
                      />
                    </div>
                  </div>
                )}
                {/* Strip set inputs for manual weight */}
                {isStripSet && stripReps > 0 && (
                  <div style={{ marginTop: '4px', paddingLeft: '12px', borderLeft: '3px solid #ef4444' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#dc2626', marginBottom: '2px' }}>
                      Strip → {stripReps} reps
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input
                        type="number"
                        placeholder="Strip weight (lbs)"
                        value={getTrack(`${si}-strip`, 'weight')}
                        onChange={(e) => onUpdateTracking(blockIndex, exIndex, `${si}-strip`, 'weight', e.target.value)}
                        style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
                        readOnly={inputLocked}
                      />
                      <input
                        type="number"
                        placeholder={`${stripReps} reps`}
                        value={getTrack(`${si}-strip`, 'reps')}
                        onChange={(e) => onUpdateTracking(blockIndex, exIndex, `${si}-strip`, 'reps', e.target.value)}
                        style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
                        readOnly={inputLocked}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {renderExtraFields()}
          {renderMarkButton()}
          {renderRecSection()}
        </>
      );
    }

    // Bodyweight exercises (pull-ups, dips, planks, etc.) - handles both reps and duration
    if (isBodyweight && ex.isPercentageBased && Array.isArray(ex.percentages)) {
      const bwSets = ex.percentages.length;
      const dUnit = getUnitLabel(ex.durationUnit, 'sec');
      const hasDuration = ex.duration;
      const hasReps = ex.reps;

      return (
        <>
          <div style={{ ...s.targetText, fontWeight: '700' }}>
            Bodyweight — {bwSets} Sets{ex.qualifier ? ` (${ex.qualifier})` : ''}
          </div>
          {ex.percentages.map((_, si) => {
            const targetReps = ex.repsPerSet?.[si] || ex.reps || '';
            // Duration-based (planks, holds) vs reps-based (pull-ups, push-ups)
            const setDescription = hasDuration && !hasReps
              ? `${formatWithUnit(ex.duration, dUnit)}${ex.qualifier ? ` ${ex.qualifier}` : ''}`
              : `${targetReps || '?'} reps${ex.qualifier ? ` ${ex.qualifier}` : ''}`;

            return (
              <div key={si}>
                <div style={s.setLabel}>
                  Set {si + 1}: {setDescription}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  {hasDuration && !hasReps ? (
                    // Duration input for holds/planks
                    <input
                      type="text"
                      placeholder={`${ex.duration} ${dUnit}`}
                      value={getTrack(si, 'duration')}
                      onChange={(e) => onUpdateTracking(blockIndex, exIndex, si, 'duration', e.target.value)}
                      style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
                      readOnly={inputLocked}
                    />
                  ) : (
                    // Reps input for regular bodyweight exercises
                    <input
                      type="number"
                      placeholder={`${targetReps || '?'} reps`}
                      value={getTrack(si, 'reps')}
                      onChange={(e) => onUpdateTracking(blockIndex, exIndex, si, 'reps', e.target.value)}
                      style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
                      readOnly={inputLocked}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {renderExtraFields()}
          {renderMarkButton()}
          {renderRecSection()}
        </>
      );
    }

    if (hasPercentages && oneRM > 0) {
      return (
        <>
          {warmupSets.length > 0 && (
            <div style={s.warmup}>
              <strong>Warm-Up Protocol</strong>
              {warmupSets.map((ws, i) => (
                <div key={i}>
                  {ws.reps} reps @ {ws.pct}% = {calculateWeight(oneRM, ws.pct)} lbs
                </div>
              ))}
            </div>
          )}
          <div style={{ ...s.targetText, fontWeight: '700' }}>
            {ex.schemeName || 'Working Sets'} - Auto-Calculated Weights
          </div>
          {ex.percentages.map((pct, si) => {
            const mainWeight = calculateWeight(oneRM, pct);
            const mainReps = ex.repsPerSet?.[si] || ex.reps || '?';
            const dropPct = ex.dropPercentages?.[si];
            const dropReps = ex.dropRepsPerSet?.[si];
            const stripPct = ex.stripPercentages?.[si];
            const stripReps = ex.stripRepsPerSet?.[si];
            const dropWeight = dropPct ? calculateWeight(oneRM, dropPct) : 0;
            const stripWeight = stripPct ? calculateWeight(oneRM, stripPct) : 0;

            // Build set label with drop/strip info
            let setLabel = `Set ${si + 1}: ${mainWeight} lbs × ${mainReps}`;
            if ((isDropSet || isStripSet) && dropPct && dropReps) {
              setLabel += ` → ${dropWeight} lbs × ${dropReps}`;
            }
            if (isStripSet && stripPct && stripReps) {
              setLabel += ` → ${stripWeight} lbs × ${stripReps}`;
            }

            return (
              <div key={si}>
                <div style={s.setLabel}>{setLabel}</div>
                <TrackingInputs
                  blockIndex={blockIndex}
                  exIndex={exIndex}
                  setIndex={si}
                  weightValue={getTrack(si, 'weight')}
                  repsValue={getTrack(si, 'reps')}
                  weightPlaceholder={`${mainWeight} lbs${ex.qualifier && !isDropSet && !isStripSet ? ' ' + ex.qualifier : ''}`}
                  repsPlaceholder={`${mainReps} reps`}
                  onUpdate={onUpdateTracking}
                  disabled={inputLocked}
                  prefillReps={prefillReps}
                />
                {/* Drop set inputs */}
                {(isDropSet || isStripSet) && dropPct > 0 && dropReps > 0 && (
                  <div style={{ marginTop: '4px', paddingLeft: '12px', borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', marginBottom: '2px' }}>
                      Drop → {dropWeight} lbs × {dropReps}
                    </div>
                    <TrackingInputs
                      blockIndex={blockIndex}
                      exIndex={exIndex}
                      setIndex={`${si}-drop`}
                      weightValue={getTrack(`${si}-drop`, 'weight')}
                      repsValue={getTrack(`${si}-drop`, 'reps')}
                      weightPlaceholder={`${dropWeight} lbs`}
                      repsPlaceholder={`${dropReps} reps`}
                      onUpdate={onUpdateTracking}
                      disabled={inputLocked}
                    />
                  </div>
                )}
                {/* Strip set inputs (3rd drop) */}
                {isStripSet && stripPct > 0 && stripReps > 0 && (
                  <div style={{ marginTop: '4px', paddingLeft: '12px', borderLeft: '3px solid #ef4444' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#dc2626', marginBottom: '2px' }}>
                      Strip → {stripWeight} lbs × {stripReps}
                    </div>
                    <TrackingInputs
                      blockIndex={blockIndex}
                      exIndex={exIndex}
                      setIndex={`${si}-strip`}
                      weightValue={getTrack(`${si}-strip`, 'weight')}
                      repsValue={getTrack(`${si}-strip`, 'reps')}
                      weightPlaceholder={`${stripWeight} lbs`}
                      repsPlaceholder={`${stripReps} reps`}
                      onUpdate={onUpdateTracking}
                      disabled={inputLocked}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {renderExtraFields()}
          {renderMarkButton()}
          {renderRecSection()}
        </>
      );
    }

    if (hasPercentages && oneRM === 0) {
      const fallbackSets = typeof ex.sets === 'number' ? ex.sets : (ex.setsCount || 3);
      const fallbackReps = ex.reps || '10';
      return (
        <>
          <div style={s.warning}>
            {'\u26A0\uFE0F'} No 1RM entered — showing default tracking inputs.
          </div>
          <div style={s.targetText}>
            {fallbackSets} sets x {fallbackReps} reps
          </div>
          {Array.from({ length: fallbackSets }).map((_, si) => (
            <div key={si}>
              <div style={s.setLabel}>Set {si + 1}</div>
              <TrackingInputs
                blockIndex={blockIndex}
                exIndex={exIndex}
                setIndex={si}
                weightValue={getTrack(si, 'weight')}
                repsValue={getTrack(si, 'reps')}
                weightPlaceholder="Weight (lbs)"
                repsPlaceholder={fallbackReps ? `${fallbackReps} reps` : 'Reps'}
                onUpdate={onUpdateTracking}
                disabled={inputLocked}
                prefillReps={prefillReps}
              />
            </div>
          ))}
          {renderExtraFields()}
          {renderMarkButton()}
          {renderRecSection()}
        </>
      );
    }

    // Regular strength
    const sets = typeof ex.sets === 'number' ? ex.sets : (ex.setsCount || parseInt(ex.sets) || 1);
    // Use previous week's weights as placeholder hints
    const prevWeights = previousExerciseData?.weights || savedExerciseData?.weights || [];
    return (
      <>
        <div style={s.targetText}>
          {sets} sets x {ex.reps || ex.repsPerSet?.[0] || '?'} reps
        </div>
        {ex.weight && <div style={s.detailRow}>Weight: {ex.weight}{ex.qualifier ? ` ${ex.qualifier}` : ''}</div>}
        {Array.from({ length: sets }).map((_, si) => {
          const prevW = prevWeights[si];
          const wPlaceholder = prevW ? `${prevW} lbs (last wk)` : 'Weight (lbs)';
          // Prescribed reps so the +/- stepper seeds off the programmed target.
          const repsHint = ex.repsPerSet?.[si] || ex.reps;
          return (
          <div key={si}>
            <div style={s.setLabel}>Set {si + 1}</div>
            <TrackingInputs
              blockIndex={blockIndex}
              exIndex={exIndex}
              setIndex={si}
              weightValue={getTrack(si, 'weight')}
              repsValue={getTrack(si, 'reps')}
              weightPlaceholder={wPlaceholder}
              repsPlaceholder={repsHint ? `${repsHint} reps` : 'Reps'}
              onUpdate={onUpdateTracking}
              disabled={inputLocked}
              prefillReps={prefillReps}
            />
          </div>
        );})}
        {renderExtraFields()}
        {renderMarkButton()}
        {renderRecSection()}
      </>
    );
  };

  // Unit display helpers
  const UNIT_LABELS = {
    sec: 'sec', min: 'min', hr: 'hr',
    m: 'm', yd: 'yd', ft: 'ft', mi: 'mi', km: 'km',
    mph: 'mph', kph: 'kph', 'min/mi': 'min/mi',
  };
  const getUnitLabel = (unit, fallback) => UNIT_LABELS[unit] || fallback || '';

  // Strip embedded unit text from values (legacy data like "5 minutes" → "5")
  const stripUnits = (val) => {
    if (!val) return val;
    return String(val).replace(/\s*(seconds?|sec|minutes?|min|hours?|hr|meters?|miles?|mi|km|yards?|yd|feet|ft|mph|kph)\s*/gi, '').trim();
  };

  // Format a value with its unit, avoiding "5 minutes min" duplication
  const formatWithUnit = (val, unitLabel) => {
    if (!val) return null;
    const clean = stripUnits(val);
    return clean ? `${clean} ${unitLabel}` : null;
  };

  // Extra fields: shows distance, duration, weight, rest, tempo, notes for ANY exercise
  // that has them — regardless of block type. Used after sets in strength rendering.
  const renderExtraFields = () => {
    const dUnit = getUnitLabel(ex.durationUnit, 'sec');
    const distUnit = getUnitLabel(ex.distanceUnit, 'yd');

    const pills = [
      ex.distance ? { label: 'Distance', val: `${ex.distance} ${distUnit}` } : null,
      ex.duration ? { label: 'Duration', val: `${ex.duration} ${dUnit}` } : null,
      ex.speed ? { label: 'Speed', val: `${ex.speed} ${getUnitLabel(ex.speedUnit, 'mph')}` } : null,
      ex.incline ? { label: 'Incline', val: ex.incline } : null,
      ex.rest ? { label: 'Rest', val: ex.rest } : null,
      ex.tempo ? { label: 'Tempo', val: ex.tempo } : null,
    ].filter(Boolean);

    const hasTrackableFields = ex.distance || ex.duration;

    return (
      <>
        {pills.length > 0 && (
          <div style={{ ...s.pillGrid, marginTop: '8px' }}>
            {pills.map((p, i) => (
              <span key={i} style={s.pill}>{p.label}: {p.val}</span>
            ))}
          </div>
        )}
        {hasTrackableFields && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
            {ex.duration && (
              <input
                type="text"
                placeholder={`${ex.duration} ${dUnit}`}
                value={getTrack(null, 'duration')}
                onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'duration', e.target.value)}
                style={{ ...s.condInput, flex: 1, minWidth: '80px', marginBottom: 0, ...lockStyle }}
                readOnly={inputLocked}
              />
            )}
            {ex.distance && (
              <input
                type="text"
                placeholder={`${ex.distance} ${distUnit}`}
                value={getTrack(null, 'distance')}
                onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'distance', e.target.value)}
                style={{ ...s.condInput, flex: 1, minWidth: '80px', marginBottom: 0, ...lockStyle }}
                readOnly={inputLocked}
              />
            )}
          </div>
        )}
        {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
      </>
    );
  };

  // Cardio: treadmill, bike, rowing - just duration and optional distance
  // Swap alternatives for conditioning exercises
  const CARDIO_ALTERNATIVES = [
    { name: 'Treadmill', icon: '\uD83C\uDFC3' },
    { name: 'Rowing Machine', icon: '\uD83D\uDEA3' },
    { name: 'Assault Bike', icon: '\uD83D\uDEB4' },
    { name: 'Stationary Bike', icon: '\uD83D\uDEB2' },
    { name: 'Elliptical', icon: '\u26AA' },
    { name: 'Ski Erg', icon: '\u26F7\uFE0F' },
    { name: 'Stair Climber', icon: '\uD83E\uDDF1' },
    { name: 'Jog', icon: '\uD83C\uDFC3' },
    { name: 'Jump Rope', icon: '\u2B55' },
  ];
  const [showSwap, setShowSwap] = useState(false);
  const [swappedName, setSwappedName] = useState(null);
  const [swappedVideo, setSwappedVideo] = useState(null);
  const [swapSearch, setSwapSearch] = useState('');
  const [showAllCat, setShowAllCat] = useState(false);
  const [swapOwn, setSwapOwn] = useState('');
  const displayName = swappedName || ex.name;
  // The demo video follows the swap: a library substitute shows its own video;
  // a swap to something videoless (write-your-own) shows none rather than the
  // wrong original; no swap shows the prescribed exercise's video.
  const activeVideo = swappedName
    ? (swappedVideo ? `https://iframe.videodelivery.net/${swappedVideo}` : null)
    : ex.youtube;

  const handleSwap = (newName, newVideo) => {
    setSwappedName(newName);
    setSwappedVideo(newVideo || null);
    onUpdateTracking(blockIndex, exIndex, null, 'swapped_exercise', newName);
    setShowSwap(false);
    setSwapSearch('');
    setShowAllCat(false);
    setSwapOwn('');
  };
  const resetSwap = () => {
    setSwappedName(null);
    setSwappedVideo(null);
    onUpdateTracking(blockIndex, exIndex, null, 'swapped_exercise', '');
  };

  const isConditioningExercise = blockType === 'conditioning' || blockType === 'cardio' || blockType === 'movement';

  const renderSwapButton = () => {
    if (!isConditioningExercise || inputLocked) return null;
    return (
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <button
          onClick={() => setShowSwap(!showSwap)}
          style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#667eea', fontWeight: 600, cursor: 'pointer' }}
        >
          {swappedName ? `Swapped to: ${swappedName}` : 'Swap Equipment'}
        </button>
        {showSwap && (
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#fff', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', minWidth: '200px', marginTop: '4px', maxHeight: '250px', overflowY: 'auto' }}>
            {CARDIO_ALTERNATIVES.filter(a => a.name !== ex.name).map(alt => (
              <button
                key={alt.name}
                onClick={() => handleSwap(alt.name)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: swappedName === alt.name ? '#f0f0ff' : '#fff', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}
              >
                {alt.icon} {alt.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Strength swap: substitute a prescribed lift with a same-muscle alternative
  // (keeps the prescribed sets/reps/scheme — the client just does their numbers
  // on the new movement), a searched exercise, or a write-your-own. Reuses the
  // same swapped_exercise tracking field the cardio swap saves through.
  const renderStrengthSwap = () => {
    if (inputLocked) return null;
    const cur = SWAP_BY_NAME.get((ex.name || '').toLowerCase());
    const cat = cur?.category;
    const mv = cur?.movement?.[0];
    const q = swapSearch.trim().toLowerCase();

    let results = [];
    if (q) {
      results = SWAP_INDEX.list.filter(e => e.name.toLowerCase().includes(q) && e.name !== ex.name).slice(0, 40);
    } else if (cat) {
      results = SWAP_INDEX.list.filter(e =>
        e.category === cat && e.name !== ex.name && (!mv || (e.movement || []).includes(mv)));
    }
    const capped = (!q && !showAllCat) ? results.slice(0, 10) : results;
    const heading = q ? 'Matches' : (cat ? 'Similar exercises (same muscle)' : 'Search for an exercise');

    const row = (e) => (
      <button key={e.name} onClick={() => handleSwap(e.name, e.video)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left',
          padding: '9px 12px', border: 'none', borderBottom: '1px solid #f3f4f6', background: '#fff',
          cursor: 'pointer', fontSize: '14px' }}>
        <span style={{ flex: 1 }}>{e.name}{e.video ? ' 🎬' : ''}</span>
        {e.equipment && e.equipment[0] && (
          <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{e.equipment[0]}</span>
        )}
      </button>
    );

    return (
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => setShowSwap(!showSwap)}
          style={{ background: swappedName ? '#eef2ff' : 'none', border: '1px solid #c7d2fe',
            borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#4f46e5',
            fontWeight: 700, cursor: 'pointer' }}>
          {swappedName ? `Swapped → ${swappedName}` : '⇄ Swap Exercise'}
        </button>
        {swappedName && (
          <button onClick={resetSwap}
            style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#9ca3af',
              fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>reset</button>
        )}
        {showSwap && (
          <div style={{ marginTop: '6px', border: '1px solid #e5e7eb', borderRadius: '10px',
            background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
              <input type="text" value={swapSearch} onChange={(e) => setSwapSearch(e.target.value)}
                placeholder="Search all exercises…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                  border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div style={{ padding: '6px 12px 2px', fontSize: '11px', fontWeight: 700, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: '0.5px' }}>{heading}</div>
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {capped.map(row)}
              {capped.length === 0 && (
                <div style={{ padding: '10px 12px', fontSize: '13px', color: '#9ca3af' }}>
                  {q ? 'No matches — try the search or write your own below.' : 'Use search or write your own below.'}
                </div>
              )}
            </div>
            {!q && results.length > capped.length && (
              <button onClick={() => setShowAllCat(true)}
                style={{ width: '100%', padding: '8px', border: 'none', borderTop: '1px solid #f3f4f6',
                  background: '#fafafa', color: '#4f46e5', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                Show all {results.length} {cat} options
              </button>
            )}
            <div style={{ display: 'flex', gap: '6px', padding: '8px 10px', borderTop: '1px solid #eef2ff',
              background: '#fafbff' }}>
              <input type="text" value={swapOwn} onChange={(e) => setSwapOwn(e.target.value)}
                placeholder="✏️ Write my own…"
                style={{ flex: 1, minWidth: 0, padding: '8px 10px', border: '1px solid #d1d5db',
                  borderRadius: '8px', fontSize: '14px' }} />
              <button onClick={() => swapOwn.trim() && handleSwap(swapOwn.trim(), '')}
                disabled={!swapOwn.trim()}
                style={{ padding: '8px 14px', border: 'none', borderRadius: '8px', fontWeight: 700,
                  fontSize: '13px', cursor: swapOwn.trim() ? 'pointer' : 'default',
                  background: swapOwn.trim() ? '#4f46e5' : '#e5e7eb', color: swapOwn.trim() ? '#fff' : '#9ca3af' }}>
                Use
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // "Write your own" / "Choose your own cardio" — fully client-filled card.
  // The client names the exercise and enters their own numbers; nothing is
  // prescribed. Cardio kind also gets the machine picker (reuses the swap list).
  const renderUserDefined = () => {
    const kind = ex.userDefinedKind === 'cardio' ? 'cardio' : 'strength';
    const field = (label, key, ph) => (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '70px' }}>
        {/* minHeight reserves 2 lines so a wrapping label (e.g. "Time / Interval")
            doesn't push its input below the others — boxes stay straight across. */}
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '3px', minHeight: '26px', lineHeight: '13px', display: 'flex', alignItems: 'flex-end' }}>{label}</span>
        <input
          type="text"
          placeholder={ph}
          value={getTrack(null, key)}
          onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, key, e.target.value)}
          style={{ ...s.condInput, marginBottom: 0, ...lockStyle }}
          readOnly={inputLocked}
        />
      </div>
    );
    return (
      <>
        <div style={{ ...s.detailRow, fontStyle: 'italic', color: '#6b7280', marginBottom: '10px' }}>
          {kind === 'cardio' ? 'Pick your machine and fill in your numbers.' : 'Name your exercise and fill in what you did.'}
        </div>
        {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
        {/* Exercise name */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '3px' }}>Exercise name</span>
          <input
            type="text"
            placeholder={kind === 'cardio' ? 'e.g. Stairmaster intervals' : 'e.g. Landmine press'}
            value={getTrack(null, 'custom_name')}
            onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'custom_name', e.target.value)}
            style={{ ...s.condInput, marginBottom: 0, ...lockStyle }}
            readOnly={inputLocked}
          />
        </div>
        {/* Cardio machine picker — native <select> so the whole list (incl. the
            last item, Jump Rope) is always reachable on mobile and never clipped
            by the card's scroll container like the old absolute dropdown was. */}
        {kind === 'cardio' && (
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '3px' }}>Machine</span>
            <select
              value={swappedName || ''}
              onChange={(e) => {
                const v = e.target.value;
                setSwappedName(v || null);
                onUpdateTracking(blockIndex, exIndex, null, 'swapped_exercise', v);
              }}
              disabled={inputLocked}
              style={{ ...s.condInput, marginBottom: 0, ...lockStyle, cursor: inputLocked ? 'default' : 'pointer' }}
            >
              <option value="">Pick a machine…</option>
              {CARDIO_ALTERNATIVES.map((alt) => (
                <option key={alt.name} value={alt.name}>{alt.icon} {alt.name}</option>
              ))}
            </select>
          </div>
        )}
        {/* Fields the client fills in */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '12px' }}>
          {kind === 'cardio' ? (
            <>
              {field('Duration', 'duration', 'min')}
              {field('Distance', 'distance', 'mi')}
              {field('Time / Interval', 'interval', '30s on/off')}
            </>
          ) : (
            <>
              {field('Sets', 'sets', '3')}
              {field('Reps', 'reps', '10')}
              {field('Weight', 'weight', 'lbs')}
              {field('Time / Interval', 'interval', 'optional')}
            </>
          )}
        </div>
        {renderMarkButton()}
      </>
    );
  };

  const renderCardio = () => {
    const dUnit = getUnitLabel(ex.durationUnit, 'min');
    const distUnit = getUnitLabel(ex.distanceUnit, 'mi');
    const spdUnit = getUnitLabel(ex.speedUnit, 'mph');

    // Builder format: set count lives in setsCount (sets is an empty array)
    const cardioSets = ex.setsCount || (typeof ex.sets === 'number' ? String(ex.sets) : '');
    const details = [
      { label: 'Sets', val: cardioSets && cardioSets !== '1' && cardioSets !== '0' ? cardioSets : '' },
      { label: 'Duration', val: formatWithUnit(ex.duration, dUnit) },
      { label: 'Distance', val: formatWithUnit(ex.distance, distUnit) },
      { label: 'Speed', val: formatWithUnit(ex.speed, spdUnit) },
      { label: 'Incline', val: ex.incline },
      { label: 'Intensity', val: ex.intensity },
      { label: 'Calories', val: ex.calories ? `${ex.calories} cal` : '' },
    ].filter((d) => d.val);

    return (
      <>
        {renderSwapButton()}
        {details.length > 0 && (
          <div style={s.pillGrid}>
            {details.map((d, i) => (
              <span key={i} style={s.pill}>
                {d.label}: {d.val}
              </span>
            ))}
          </div>
        )}
        {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
        {ex.description && (
          <div style={{ ...s.detailRow, fontStyle: 'italic', marginBottom: '10px' }}>
            {ex.description}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder={`Duration (${dUnit})`}
            value={getTrack(null, 'duration')}
            onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'duration', e.target.value)}
            style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
            readOnly={inputLocked}
          />
          <input
            type="text"
            placeholder={`Distance (${distUnit})`}
            value={getTrack(null, 'distance')}
            onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'distance', e.target.value)}
            style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
            readOnly={inputLocked}
          />
        </div>
        {renderMarkButton()}
      </>
    );
  };

  // Movement/Conditioning: med ball, agility, plyos, rowing, ski erg - reps or duration based
  const renderMovement = () => {
    const dUnit = getUnitLabel(ex.durationUnit, 'min');
    const distUnit = getUnitLabel(ex.distanceUnit, 'm');
    const spdUnit = getUnitLabel(ex.speedUnit, 'mph');

    // Show preset values as info pills — include targets for duration/distance
    const condSets = ex.setsCount || ex.sets || '';
    const details = [
      condSets && condSets !== '1' && condSets !== '0' ? { label: 'Sets', val: condSets } : null,
      ex.reps ? { label: 'Reps', val: ex.reps } : null,
      ex.weight ? { label: 'Weight', val: `${ex.weight} lbs` } : null,
      ex.distance ? { label: 'Target', val: `${ex.distance} ${distUnit}`, highlight: true } : null,
      ex.duration ? { label: 'Target', val: `${ex.duration} ${dUnit}`, highlight: true } : null,
      ex.calories ? { label: 'Calories', val: `${ex.calories} cal`, highlight: true } : null,
      formatWithUnit(ex.speed, spdUnit) ? { label: 'Speed', val: formatWithUnit(ex.speed, spdUnit) } : null,
      ex.incline ? { label: 'Incline', val: ex.incline } : null,
      ex.rest ? { label: 'Rest', val: ex.rest } : null,
    ].filter(Boolean);

    // Check if this is a cardio-type conditioning exercise (has duration or distance)
    const hasCardioFields = ex.duration || ex.distance;

    return (
      <>
        {renderSwapButton()}
        {details.length > 0 && (
          <div style={s.pillGrid}>
            {details.map((d, i) => (
              <span key={i} style={d.highlight ? { ...s.pill, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', fontWeight: 700 } : s.pill}>
                {d.label}: {d.val}
              </span>
            ))}
          </div>
        )}
        {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
        {ex.description && (
          <div style={{ ...s.detailRow, fontStyle: 'italic', marginBottom: '10px' }}>
            {ex.description}
          </div>
        )}
        {/* Editable inputs for conditioning: duration, distance, weight */}
        {(hasCardioFields || ex.weight) && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {(ex.duration || hasCardioFields) && (
              <input
                type="text"
                placeholder={`Duration (${dUnit})`}
                value={getTrack(null, 'duration')}
                onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'duration', e.target.value)}
                style={{ ...s.condInput, flex: 1, minWidth: '80px', marginBottom: 0, ...lockStyle }}
                readOnly={inputLocked}
              />
            )}
            {(ex.distance || hasCardioFields) && (
              <input
                type="text"
                placeholder={`Distance (${distUnit})`}
                value={getTrack(null, 'distance')}
                onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'distance', e.target.value)}
                style={{ ...s.condInput, flex: 1, minWidth: '80px', marginBottom: 0, ...lockStyle }}
                readOnly={inputLocked}
              />
            )}
            {ex.weight && (
              <input
                type="text"
                placeholder={`${ex.weight} lbs`}
                value={getTrack(null, 'weight')}
                onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'weight', e.target.value)}
                style={{ ...s.condInput, flex: 1, minWidth: '80px', marginBottom: 0, ...lockStyle }}
                readOnly={inputLocked}
              />
            )}
          </div>
        )}
        {renderMarkButton()}
      </>
    );
  };

  const renderCircuit = () => (
    <>
      {ex.reps && <div style={s.targetText}>Reps: {ex.reps}</div>}
      {[
        { label: 'Weight', val: ex.weight },
        { label: 'Duration', val: ex.duration },
        { label: 'Rest', val: ex.rest },
      ]
        .filter((d) => d.val)
        .map((d, i) => (
          <span key={i} style={s.pill}>
            {d.label}: {d.val}
          </span>
        ))}
      {renderMarkButton({ marginTop: '12px' })}
    </>
  );

  // Warmup/Cooldown/Mobility/Core: foam rolling, stretches, bird dogs, crunches - editable inputs
  const renderWarmup = () => {
    // Some exercises (Inchworm, etc.) ship with ex.sets as an object — use
    // the normalized number for any string interpolation. ex.reps may also
    // be null with the real value living in ex.repsPerSet[0] (matches TV).
    const setsCount = typeof ex.sets === 'number' ? ex.sets : (ex.setsCount || parseInt(ex.sets) || 1);
    const repsValue = ex.reps || ex.repsPerSet?.[0];
    const hasSets = !!ex.sets || !!ex.setsCount;
    const hasReps = !!repsValue;
    const hasDuration = ex.duration;
    const dUnit = getUnitLabel(ex.durationUnit, 'sec');

    return (
      <>
        {/* Editable sets/reps/duration for core and warmup exercises */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {hasSets && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Sets:</span>
                <input
                  type="number"
                  placeholder={String(setsCount)}
                  value={getTrack(0, 'sets') || ''}
                  onChange={(e) => onUpdateTracking(blockIndex, exIndex, 0, 'sets', e.target.value)}
                  style={{ width: '50px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', textAlign: 'center', ...lockStyle }}
                  readOnly={inputLocked}
                />
              </div>
            )}
            {hasReps && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Reps:</span>
                <input
                  type="number"
                  placeholder={String(repsValue).replace(/[^\d]/g, '') || '10'}
                  value={getTrack(0, 'reps') || ''}
                  onChange={(e) => onUpdateTracking(blockIndex, exIndex, 0, 'reps', e.target.value)}
                  style={{ width: '50px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', textAlign: 'center', ...lockStyle }}
                  readOnly={inputLocked}
                />
              </div>
            )}
            {hasDuration && !hasReps && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Duration:</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{formatWithUnit(ex.duration, dUnit)}</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            Target: {hasSets ? `${setsCount} sets` : ''} {hasReps ? `× ${repsValue}` : ''} {hasDuration && !hasReps ? `× ${formatWithUnit(ex.duration, dUnit)}` : ''}{ex.calories ? ` × ${ex.calories} cal` : ''}
          </div>
        </div>
        {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
        {ex.description && (
          <div style={{ ...s.detailRow, fontStyle: 'italic', marginBottom: '10px' }}>
            {ex.description}
          </div>
        )}
        {renderMarkButton()}
      </>
    );
  };

  return (
    <div style={{ ...s.card, ...(collapsed ? s.cardCollapsed : {}) }}>
      <div style={s.header} onClick={() => collapsed && setForceExpanded(true)}>
        <div style={s.headerLeft}>
          <span>
            {exIndex + 1}. {(ex.isUserDefined && getTrack(null, 'custom_name')) || displayName}
            {ex.qualifier && <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}> ({ex.qualifier})</span>}
          </span>
          {activeVideo && (
            <button
              style={{ ...s.videoBtn, ...(showVideo ? s.videoBtnActive : {}) }}
              onClick={(e) => {
                e.stopPropagation();
                const next = !showVideo;
                setShowVideo(next);
                // If we're actively casting to a TV, also beam (or clear) this
                // exercise full-screen on the TV. Lazily-loaded to avoid
                // coupling ExerciseCard to the cast hook.
                try {
                  const pair = sessionStorage.getItem('bsa_cast_pair');
                  if (pair) {
                    const payload = next ? {
                      name: displayName,
                      youtube: activeVideo,
                      sets: ex.sets,
                      reps: ex.reps || (ex.repsPerSet && ex.repsPerSet[0]) || '',
                      duration: ex.duration || '',
                      durationUnit: ex.durationUnit || '',
                      distance: ex.distance || '',
                      distanceUnit: ex.distanceUnit || '',
                      qualifier: ex.qualifier || '',
                      notes: ex.notes || '',
                    } : null;
                    fetch('https://app.bestrongagain.com/api/cast/play', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pair_code: pair, exercise: payload }),
                      keepalive: true,
                    }).catch(() => {});
                  }
                } catch {}
              }}
            >
              {showVideo ? '\u2716' : '\uD83D\uDCF9'}
            </button>
          )}
        </div>
        {collapsed && (
          <button style={s.expandBtn} onClick={() => setForceExpanded(true)}>
            +
          </button>
        )}
      </div>

      {showVideo && activeVideo && (
        <div style={{ padding: '0 14px 10px' }}>
          <div style={s.videoContainer}>
            <iframe
              src={`${activeVideo}?preload=metadata`}
              style={s.videoIframe}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {!collapsed && (
        <div style={s.body}>
          {!ex.isUserDefined && isStrength && renderStrengthSwap()}
          {ex.isUserDefined ? renderUserDefined() : (
            <>
              {isStrength && renderStrength()}
              {isCardio && renderCardio()}
              {isMovement && renderMovement()}
              {isCircuit && renderCircuit()}
              {isWarmup && renderWarmup()}
              {isGeneric && renderWarmup()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
