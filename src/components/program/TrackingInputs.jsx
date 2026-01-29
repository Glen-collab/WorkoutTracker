import React from 'react';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '2px solid #e0e0e0',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s',
};

export default function TrackingInputs({
  blockIndex,
  exIndex,
  setIndex,
  weightValue,
  repsValue,
  weightPlaceholder,
  repsPlaceholder,
  onUpdate,
  style,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        ...style,
      }}
    >
      <input
        type="text"
        className="gwt-tracking-input"
        placeholder={weightPlaceholder || 'Weight (lbs)'}
        value={weightValue || ''}
        onChange={(e) =>
          onUpdate(blockIndex, exIndex, setIndex, 'weight', e.target.value)
        }
        style={inputStyle}
      />
      <input
        type="text"
        className="gwt-tracking-input"
        placeholder={repsPlaceholder || 'Reps'}
        value={repsValue || ''}
        onChange={(e) =>
          onUpdate(blockIndex, exIndex, setIndex, 'reps', e.target.value)
        }
        style={inputStyle}
      />
    </div>
  );
}
