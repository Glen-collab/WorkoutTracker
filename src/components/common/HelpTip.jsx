import React, { useState } from 'react';

// Friendly, tappable "?" help badge. Explains jargon (like "1RM") in plain
// English. Pulses for first-time users until they tap any tip once (remembered
// per device), then settles down. A blue "?" reads as "tap me for help" — not
// an error like a red badge would. Pulse keyframe `gwtHelpPulse` lives in
// index.css. stopPropagation keeps taps from toggling a parent collapse header.
const SEEN_KEY = 'gwt_form_help_seen';

export default function HelpTip({ text }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => {
    try { return !!localStorage.getItem(SEEN_KEY); } catch { return true; }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    setOpen((o) => !o);
    if (!seen) {
      try { localStorage.setItem(SEEN_KEY, 'true'); } catch { /* ignore */ }
      setSeen(true);
    }
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: '6px' }}>
      <button
        type="button"
        aria-label="What's this?"
        onClick={handleClick}
        style={{
          width: '20px', height: '20px', borderRadius: '50%', border: 'none', padding: 0,
          background: open ? '#667eea' : '#e8ecff', color: open ? '#fff' : '#4554c9',
          fontWeight: 800, fontSize: '13px', lineHeight: '20px', cursor: 'pointer',
          animation: !seen && !open ? 'gwtHelpPulse 1.5s ease-in-out infinite' : 'none',
        }}
      >?</button>
      {open && (
        <span
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          style={{
            position: 'absolute', top: '26px', left: '50%', transform: 'translateX(-50%)',
            width: '230px', maxWidth: '70vw', background: '#1a1a2e', color: '#fff',
            fontSize: '12.5px', lineHeight: 1.5, fontWeight: 500, padding: '10px 12px',
            borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)', zIndex: 30, textAlign: 'left',
            whiteSpace: 'normal',
          }}
        >{text}</span>
      )}
    </span>
  );
}
