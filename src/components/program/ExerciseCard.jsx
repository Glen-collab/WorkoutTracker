import React, { useState, useRef } from 'react';
import { get1RM, calculateWeight } from '../../utils/trackerHelpers';
import TrackingInputs from './TrackingInputs';
import { getMotivationalMessage } from '../../data/exerciseMotivation';

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
      ex.isPercentageBased = true;
      // Keep sets count as number
      ex.setsCount = ex.sets.length;
      ex.sets = ex.sets.length;
    }
    return ex;
  })();
  // Use normalizedEx for rendering
  const ex = normalizedEx;

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

  // Percentage-based strength (use normalized ex)
  const oneRM = isStrength && ex.isPercentageBased ? get1RM(ex.name, maxes, ex.baseMax) : 0;
  const hasPercentages = ex.isPercentageBased && ex.percentages?.length > 0;

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
              }}
              onClick={() => handleRec(dir)}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderStrength = () => {
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
          {ex.percentages.map((pct, si) => (
            <div key={si}>
              <div style={s.setLabel}>
                Set {si + 1}: {calculateWeight(oneRM, pct)} lbs ({pct}% of 1RM) x{' '}
                {ex.repsPerSet?.[si] || ex.reps || '?'} reps
              </div>
              <TrackingInputs
                blockIndex={blockIndex}
                exIndex={exIndex}
                setIndex={si}
                weightValue={getTrack(si, 'weight')}
                repsValue={getTrack(si, 'reps')}
                weightPlaceholder={`${calculateWeight(oneRM, pct)} lbs${ex.qualifier ? ' ' + ex.qualifier : ''}`}
                repsPlaceholder={`${ex.repsPerSet?.[si] || ex.reps || ''} reps`}
                onUpdate={onUpdateTracking}
              />
            </div>
          ))}
          <button style={s.markBtn} onClick={handleMark}>
            {'\u2713'} Mark Complete
          </button>
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
              />
            </div>
          ))}
          <button style={s.markBtn} onClick={handleMark}>
            {'\u2713'} Mark Complete
          </button>
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
            />
          </div>
        ))}
        <button style={s.markBtn} onClick={handleMark}>
          {'\u2713'} Mark Complete
        </button>
        {renderRecSection()}
      </>
    );
  };

  // Cardio: treadmill, bike, rowing - just duration and optional distance
  const renderCardio = () => {
    const details = [
      { label: 'Duration', val: ex.duration },
      { label: 'Distance', val: ex.distance },
      { label: 'Speed', val: ex.speed },
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
            placeholder="Duration (min)"
            value={getTrack(null, 'duration')}
            onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'duration', e.target.value)}
            style={{ ...s.condInput, flex: 1, marginBottom: 0 }}
          />
          <input
            type="text"
            placeholder="Distance (mi)"
            value={getTrack(null, 'distance')}
            onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'distance', e.target.value)}
            style={{ ...s.condInput, flex: 1, marginBottom: 0 }}
          />
        </div>
        <button style={s.markBtn} onClick={handleMark}>
          {'\u2713'} Mark Complete
        </button>
      </>
    );
  };

  // Movement/Conditioning: med ball, agility, plyos, rowing, ski erg - reps or duration based
  const renderMovement = () => {
    // Show preset values as info pills
    const details = [
      { label: 'Reps', val: ex.reps },
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
            Target: {ex.duration ? `${ex.duration}` : ''} {ex.distance ? `/ ${ex.distance}` : ''}
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
              placeholder="Duration (min)"
              value={getTrack(null, 'duration')}
              onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'duration', e.target.value)}
              style={{ ...s.condInput, flex: 1, marginBottom: 0 }}
            />
            <input
              type="text"
              placeholder="Distance (mi/m)"
              value={getTrack(null, 'distance')}
              onChange={(e) => onUpdateTracking(blockIndex, exIndex, null, 'distance', e.target.value)}
              style={{ ...s.condInput, flex: 1, marginBottom: 0 }}
            />
          </div>
        )}
        <button style={s.markBtn} onClick={handleMark}>
          {'\u2713'} Mark Complete
        </button>
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
      <button style={{ ...s.markBtn, marginTop: '12px' }} onClick={handleMark}>
        {'\u2713'} Mark Complete
      </button>
    </>
  );

  // Warmup/Cooldown/Mobility/Core: foam rolling, stretches, bird dogs, crunches - editable inputs
  const renderWarmup = () => {
    const hasSets = ex.sets && (typeof ex.sets === 'number' ? ex.sets > 0 : true);
    const hasReps = ex.reps;
    const hasDuration = ex.duration;
    const setsCount = typeof ex.sets === 'number' ? ex.sets : 1;

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
                  style={{ width: '50px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', textAlign: 'center' }}
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
                  style={{ width: '50px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', textAlign: 'center' }}
                />
              </div>
            )}
            {hasDuration && !hasReps && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Duration:</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{ex.duration}</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            Target: {ex.sets ? `${ex.sets} sets` : ''} {ex.reps ? `× ${ex.reps}` : ''} {hasDuration && !hasReps ? `× ${ex.duration}` : ''}
          </div>
        </div>
        {ex.notes && <div style={s.notesCard}>{ex.notes}</div>}
        {ex.description && (
          <div style={{ ...s.detailRow, fontStyle: 'italic', marginBottom: '10px' }}>
            {ex.description}
          </div>
        )}
        <button style={s.markBtn} onClick={handleMark}>
          {'\u2713'} Mark Complete
        </button>
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
