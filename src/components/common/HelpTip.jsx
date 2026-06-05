import React, { useState, useRef } from 'react';

// Friendly, tappable "?" help badge. Explains jargon (like "1RM") in plain
// English. Pulses for first-time users until they tap any tip once (remembered
// per device), then settles down. A blue "?" reads as "tap me for help" — not
// an error like a red badge would. Pulse keyframe `gwtHelpPulse` lives in
// index.css. stopPropagation keeps taps from toggling a parent collapse header.
//
// The bubble is position:fixed and horizontally centered in the viewport, so it
// can NEVER run off the screen edge (the old absolute/centered-on-badge version
// overflowed when the badge sat near the right edge on phones).
const SEEN_KEY = 'gwt_form_help_seen';

export default function HelpTip({ text }) {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const [seen, setSeen] = useState(() => {
    try { return !!localStorage.getItem(SEEN_KEY); } catch { return true; }
  });

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setTop(r.bottom + 8);
    }
    setOpen((o) => !o);
    if (!seen) {
      try { localStorage.setItem(SEEN_KEY, 'true'); } catch { /* ignore */ }
      setSeen(true);
    }
  };

  const close = (e) => { e.stopPropagation(); setOpen(false); };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: '6px' }}>
      <button
        ref={btnRef}
        type="button"
        aria-label="What's this?"
        onClick={toggle}
        style={{
          width: '20px', height: '20px', borderRadius: '50%', border: 'none', padding: 0,
          background: open ? '#667eea' : '#e8ecff', color: open ? '#fff' : '#4554c9',
          fontWeight: 800, fontSize: '13px', lineHeight: '20px', cursor: 'pointer',
          animation: !seen && !open ? 'gwtHelpPulse 1.5s ease-in-out infinite' : 'none',
        }}
      >?</button>
      {open && (
        <>
          {/* tap anywhere to dismiss */}
          <span onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <span
            onClick={close}
            style={{
              position: 'fixed', top: `${top}px`, left: '50%', transform: 'translateX(-50%)',
              width: 'min(320px, calc(100vw - 24px))', background: '#1a1a2e', color: '#fff',
              fontSize: '12.5px', lineHeight: 1.5, fontWeight: 500, padding: '10px 12px',
              borderRadius: '10px', boxShadow: '0 10px 28px rgba(0,0,0,0.4)', zIndex: 9999,
              textAlign: 'left', whiteSpace: 'normal',
            }}
          >{text}</span>
        </>
      )}
    </span>
  );
}
