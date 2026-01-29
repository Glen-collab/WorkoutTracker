import React, { useState } from 'react';
import { getBlockTypeName, getBlockIcon, getCircuitTypeName } from '../../utils/trackerHelpers';
import ExerciseCard from './ExerciseCard';

const s = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    marginBottom: '14px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  headerExpanded: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    padding: '14px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCollapsed: {
    background: 'linear-gradient(135deg, #b8c6ff, #c9a0dc)',
    color: '#fff',
    padding: '14px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    fontSize: '15px',
  },
  badge: {
    background: 'rgba(255,255,255,0.25)',
    borderRadius: '12px',
    padding: '2px 10px',
    fontSize: '12px',
    fontWeight: '600',
  },
  arrow: { fontSize: '14px', fontWeight: '700' },
  body: { padding: '14px 16px' },
  themeCard: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '12px',
    whiteSpace: 'pre-wrap',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  circuitConfig: {
    background: '#f3e5f5',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6a1b9a',
  },
  notesCard: {
    background: '#fffde7',
    borderLeft: '4px solid #fbc02d',
    borderRadius: '6px',
    padding: '10px 14px',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#555',
  },
  clientNotes: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '60px',
    boxSizing: 'border-box',
    resize: 'vertical',
    marginTop: '10px',
  },
  clientNotesLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#777',
    marginTop: '12px',
  },
};

function getCircuitConfigText(block) {
  const name = getCircuitTypeName(block.circuitType);
  if (block.circuitType === 'amrap') return `${name} - ${block.circuitDuration || '?'} min`;
  if (block.circuitType === 'fortime') return `${name} - ${block.circuitRounds || '?'} rounds`;
  if (block.circuitType === 'emom') return `${name} - ${block.circuitDuration || '?'} min`;
  if (block.circuitType === 'tabata') return `${name} - ${block.circuitDuration || '?'} min`;
  if (block.circuitType === 'rounds') return `${name} - ${block.circuitRounds || '?'} rounds`;
  return name;
}

export default function BlockCard({
  block,
  blockIndex,
  maxes,
  userName,
  savedBlockData,
  previousWeekBlock,
  trackingData,
  onUpdateTracking,
  onMarkComplete,
  onSetRecommendation,
  recommendations,
}) {
  const [expanded, setExpanded] = useState(false);
  const isTheme = block.type === 'theme';

  return (
    <div style={s.card}>
      <div
        style={expanded ? s.headerExpanded : s.headerCollapsed}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={s.headerLeft}>
          <span>{getBlockIcon(block.type)}</span>
          <span>{getBlockTypeName(block.type)}</span>
          {block.exercises?.length > 0 && (
            <span style={s.badge}>{block.exercises.length}</span>
          )}
        </div>
        <span style={s.arrow}>{expanded ? '\u25BC' : '\u25B6'}</span>
      </div>

      {expanded && (
        <div style={s.body}>
          {isTheme && block.themeText && (
            <div style={s.themeCard}>{block.themeText}</div>
          )}

          {block.circuitType && (
            <div style={s.circuitConfig}>{getCircuitConfigText(block)}</div>
          )}

          {block.notes && <div style={s.notesCard}>{block.notes}</div>}

          {block.exercises?.map((exercise, exIndex) => (
            <ExerciseCard
              key={exIndex}
              exercise={exercise}
              blockIndex={blockIndex}
              exIndex={exIndex}
              blockType={block.type}
              maxes={maxes}
              userName={userName}
              savedExerciseData={savedBlockData?.exercises?.[exIndex]}
              previousRecommendation={
                previousWeekBlock?.exercises?.[exIndex]?.recommendation
              }
              trackingData={trackingData}
              onUpdateTracking={onUpdateTracking}
              onMarkComplete={onMarkComplete}
              onSetRecommendation={onSetRecommendation}
            />
          ))}

          <div style={s.clientNotesLabel}>Notes for this block:</div>
          <textarea
            id={`block-notes-${blockIndex}`}
            style={s.clientNotes}
            placeholder="Add your notes here..."
            value={trackingData?.[`block-notes-${blockIndex}`] || ''}
            onChange={(e) =>
              onUpdateTracking(blockIndex, null, null, `block-notes-${blockIndex}`, e.target.value)
            }
          />
        </div>
      )}
    </div>
  );
}
