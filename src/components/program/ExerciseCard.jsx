import React, { useState, useRef } from 'react';
import { get1RM, calculateWeight } from '../../utils/trackerHelpers';
import TrackingInputs from './TrackingInputs';
import { getMotivationalMessage } from '../../data/exerciseMotivation';
import { isFunctional } from './DailyTonnage';

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
  const normalizedEx = (() => {
    const ex = { ...exercise };
    if (Array.isArray(ex.sets) && ex.sets.length > 0 && typeof ex.sets[0] === 'object' && ex.sets[0]?.percentage != null) {
      // Builder format: sets are objects with percentage/reps
      ex.percentages = ex.sets.map(s => s.percentage);
      ex.repsPerSet = ex.sets.map(s => s.reps);
      // Preserve drop/strip set data
      ex.dropPercentages = ex.sets.map(s => s.dropPercentage);
      ex.dropRepsPerSet = ex.sets.map(s => s.dropReps);
      ex.stripPercentages = ex.sets.map(s => s.stripPercentage);
      ex.stripRepsPerSet = ex.sets.map(s => s.stripReps);
      ex.isPercentageBased = true;
      // Keep sets count as number
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
  const renderMarkButton = (extraStyle) => {
    if (isMarkedComplete) {
      return <div style={{ ...s.completedBadge, ...extraStyle }}>{'\u2705'} Completed</div>;
    }
    return (
      <button style={{ ...s.markBtn, ...extraStyle }} onClick={handleMark}>
        {'\u2713'} Mark Complete
      </button>
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
            const prevSets = previousExerciseData?.sets;
            if (!Array.isArray(prevSets) || prevSets.length === 0) return null;
            const weights = prevSets.map(st => parseFloat(st.weight)).filter(w => w > 0);
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
              Target: {fnSets} sets {fnHasReps ? `× ${ex.reps}${ex.qualifier ? ' ' + ex.qualifier : ''}` : ''} {fnHasDuration && !fnHasReps ? `× ${formatWithUnit(ex.duration, fnDurationUnit)}` : ''}
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
            return (
              <div key={si}>
                <div style={s.setLabel}>
                  Set {si + 1}{targetReps ? `: ${targetReps} reps` : ''}{hasDuration && !hasReps ? `: ${formatWithUnit(ex.duration, dUnit)}` : ''}{ex.qualifier && !hasDuration ? ` ${ex.qualifier}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <input
                    type="number"
                    placeholder="Weight (lbs)"
                    value={getTrack(si, 'weight')}
                    onChange={(e) => onUpdateTracking(blockIndex, exIndex, si, 'weight', e.target.value)}
                    style={{ ...s.condInput, flex: 1, marginBottom: 0, ...lockStyle }}
                    readOnly={inputLocked}
                  />
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
              </div>
            );
          })}
          {ex.rest && <div style={s.detailRow}>Rest: {ex.rest}</div>}
          {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
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
          {ex.rest && <div style={s.detailRow}>Rest: {ex.rest}</div>}
          {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
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
                />
              </div>
            );
          })}
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
                repsPlaceholder="Reps"
                onUpdate={onUpdateTracking}
                disabled={inputLocked}
              />
            </div>
          ))}
          {renderMarkButton()}
          {renderRecSection()}
        </>
      );
    }

    // Regular strength
    const sets = typeof ex.sets === 'number' ? ex.sets : (ex.setsCount || parseInt(ex.sets) || 1);
    return (
      <>
        <div style={s.targetText}>
          {sets} sets x {ex.reps || '?'} reps
        </div>
        {ex.weight && <div style={s.detailRow}>Weight: {ex.weight}{ex.qualifier ? ` ${ex.qualifier}` : ''}</div>}
        {ex.rest && <div style={s.detailRow}>Rest: {ex.rest}</div>}
        {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
        {Array.from({ length: sets }).map((_, si) => (
          <div key={si}>
            <div style={s.setLabel}>Set {si + 1}</div>
            <TrackingInputs
              blockIndex={blockIndex}
              exIndex={exIndex}
              setIndex={si}
              weightValue={getTrack(si, 'weight')}
              repsValue={getTrack(si, 'reps')}
              weightPlaceholder="Weight (lbs)"
              repsPlaceholder="Reps"
              onUpdate={onUpdateTracking}
              disabled={inputLocked}
            />
          </div>
        ))}
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

  // Cardio: treadmill, bike, rowing - just duration and optional distance
  const renderCardio = () => {
    const dUnit = getUnitLabel(ex.durationUnit, 'min');
    const distUnit = getUnitLabel(ex.distanceUnit, 'mi');
    const spdUnit = getUnitLabel(ex.speedUnit, 'mph');

    const details = [
      { label: 'Duration', val: formatWithUnit(ex.duration, dUnit) },
      { label: 'Distance', val: formatWithUnit(ex.distance, distUnit) },
      { label: 'Speed', val: formatWithUnit(ex.speed, spdUnit) },
      { label: 'Incline', val: ex.incline },
      { label: 'Intensity', val: ex.intensity },
    ].filter((d) => d.val);

    return (
      <>
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

    // Show preset values as info pills
    const details = [
      { label: 'Reps', val: ex.reps },
      { label: 'Speed', val: formatWithUnit(ex.speed, spdUnit) },
      { label: 'Incline', val: ex.incline },
      { label: 'Rest', val: ex.rest },
    ].filter((d) => d.val);

    // Check if this is a cardio-type conditioning exercise (has duration or distance)
    const hasCardioFields = ex.duration || ex.distance;

    return (
      <>
        {details.length > 0 && (
          <div style={s.pillGrid}>
            {details.map((d, i) => (
              <span key={i} style={s.pill}>
                {d.label}: {d.val}
              </span>
            ))}
          </div>
        )}
        {/* Show preset duration/distance as reference */}
        {(ex.duration || ex.distance) && (
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Target: {formatWithUnit(ex.duration, dUnit) || ''} {ex.distance ? `/ ${formatWithUnit(ex.distance, distUnit)}` : ''}
          </div>
        )}
        {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
        {ex.description && (
          <div style={{ ...s.detailRow, fontStyle: 'italic', marginBottom: '10px' }}>
            {ex.description}
          </div>
        )}
        {/* Editable duration/distance inputs for cardio-type conditioning (rowing, ski erg, bike, etc.) */}
        {hasCardioFields && (
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
    const hasSets = ex.sets && (typeof ex.sets === 'number' ? ex.sets > 0 : true);
    const hasReps = ex.reps;
    const hasDuration = ex.duration;
    const setsCount = typeof ex.sets === 'number' ? ex.sets : 1;
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
                  placeholder={String(ex.reps).replace(/[^\d]/g, '') || '10'}
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
            Target: {ex.sets ? `${ex.sets} sets` : ''} {ex.reps ? `× ${ex.reps}` : ''} {hasDuration && !hasReps ? `× ${formatWithUnit(ex.duration, dUnit)}` : ''}
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
            {exIndex + 1}. {ex.name}
            {ex.qualifier && <span style={{ fontSize: '12px', color: '#888', fontWeight: '400' }}> ({ex.qualifier})</span>}
          </span>
          {ex.youtube && (
            <button
              style={{ ...s.videoBtn, ...(showVideo ? s.videoBtnActive : {}) }}
              onClick={(e) => { e.stopPropagation(); setShowVideo(v => !v); }}
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

      {showVideo && ex.youtube && (
        <div style={{ padding: '0 14px 10px' }}>
          <div style={s.videoContainer}>
            <iframe
              src={`${ex.youtube}?preload=metadata`}
              style={s.videoIframe}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {!collapsed && (
        <div style={s.body}>
          {isStrength && renderStrength()}
          {isCardio && renderCardio()}
          {isMovement && renderMovement()}
          {isCircuit && renderCircuit()}
          {isWarmup && renderWarmup()}
          {isGeneric && renderWarmup()}
        </div>
      )}
    </div>
  );
}
