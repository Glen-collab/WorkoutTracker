import React, { useState } from 'react';

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

// Pull the prescribed rep count out of a placeholder like "15 reps", "8-10",
// "x12". We grab the first number so tapping +/- starts from what was
// programmed (got all → leave it; missed two → tap minus twice).
function parsePrescribedReps(placeholder) {
  if (!placeholder) return null;
  const m = String(placeholder).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

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
  disabled,
  prefillReps,
}) {
  const finalStyle = disabled
    ? { ...inputStyle, background: '#f5f5f5', color: '#999', cursor: 'not-allowed' }
    : inputStyle;

  const prescribed = parsePrescribedReps(repsPlaceholder);

  // 1-on-1 mode: show the prescribed reps already filled in the box (got all =
  // leave it; missed some = step down). Tracked once the coach touches it.
  // `touched` lets them clear it back to empty without it re-appearing.
  const [touched, setTouched] = useState(false);
  const hasRepsValue = repsValue !== '' && repsValue != null;
  const showPrefill = prefillReps && !touched && !hasRepsValue && prescribed != null;
  const repsDisplay = hasRepsValue ? repsValue : (showPrefill ? String(prescribed) : '');

  // Step reps up/down.
  //  - Box already has a number → ±1 from it.
  //  - Prefill showing the prescribed value → ±1 from prescribed (+ → 11, − → 9).
  //  - Empty, no prefill → "+" accepts prescribed (got all), "−" starts one
  //    below it — so an empty box never jumps to 1.
  const stepReps = (delta) => {
    if (disabled) return;
    setTouched(true);
    const current = parseInt(repsValue, 10);
    let next;
    if (!Number.isNaN(current)) {
      next = Math.max(0, current + delta);
    } else if (showPrefill) {
      next = Math.max(0, prescribed + delta);
    } else {
      const base = prescribed != null ? prescribed : 0;
      next = delta > 0 ? base : Math.max(0, base + delta);
    }
    onUpdate(blockIndex, exIndex, setIndex, 'reps', String(next));
  };

  const stepBtnStyle = {
    flex: '0 0 auto',
    width: '38px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    background: disabled ? '#f5f5f5' : '#fff',
    color: disabled ? '#bbb' : '#444',
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'manipulation',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
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
        // Re-fire on click-off / return so the set-1 weight (a number OR "bwt")
        // reliably fills the remaining sets on iPad, where the per-keystroke
        // autofill can miss. Type it once, tap away, the rest fill in.
        onBlur={(e) =>
          onUpdate(blockIndex, exIndex, setIndex, 'weight', e.target.value)
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        style={finalStyle}
        readOnly={disabled}
      />
      {/* Reps: tap −/+ to step from the prescribed value instead of typing */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
        <button
          type="button"
          aria-label="One less rep"
          onClick={() => stepReps(-1)}
          disabled={disabled}
          style={stepBtnStyle}
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          className="gwt-tracking-input"
          placeholder={repsPlaceholder || 'Reps'}
          value={repsDisplay}
          onChange={(e) => {
            setTouched(true);
            onUpdate(blockIndex, exIndex, setIndex, 'reps', e.target.value);
          }}
          style={{ ...finalStyle, textAlign: 'center', minWidth: 0, ...(showPrefill ? { color: '#9aa0ab' } : null) }}
          readOnly={disabled}
        />
        <button
          type="button"
          aria-label="One more rep"
          onClick={() => stepReps(1)}
          disabled={disabled}
          style={stepBtnStyle}
        >
          +
        </button>
      </div>
    </div>
  );
}
