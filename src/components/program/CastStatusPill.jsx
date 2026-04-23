// CastStatusPill.jsx
// Floating indicator shown whenever the tracker is actively casting to a TV.
// Bottom-right corner. Shows the code + a Stop button.

import React from 'react';

const s = {
  pill: {
    position: 'fixed', bottom: 16, right: 16, zIndex: 9998,
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px 8px 14px', borderRadius: 999,
    background: 'linear-gradient(135deg, #ff9a3c, #ffd200)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
    color: '#1a1a2e', fontSize: 13, fontWeight: 700,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    maxWidth: 'calc(100vw - 32px)',
  },
  code: {
    fontFamily: 'ui-monospace, Consolas, monospace', letterSpacing: 2,
    background: 'rgba(0,0,0,0.12)', padding: '2px 8px', borderRadius: 6,
  },
  stop: {
    padding: '5px 10px', border: 'none', borderRadius: 999,
    background: 'rgba(0,0,0,0.75)', color: '#fff',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  live: {
    width: 9, height: 9, borderRadius: '50%',
    background: '#b91c1c', marginRight: 2,
    animation: 'bsa-cast-pulse 1.4s ease-in-out infinite',
  },
};

if (typeof document !== 'undefined' && !document.getElementById('bsa-cast-pill-kf')) {
  const el = document.createElement('style');
  el.id = 'bsa-cast-pill-kf';
  el.textContent = '@keyframes bsa-cast-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }';
  document.head.appendChild(el);
}

export default function CastStatusPill({ pairCode, onStop }) {
  if (!pairCode) return null;
  return (
    <div style={s.pill}>
      <span style={s.live}></span>
      <span>Casting</span>
      <span style={s.code}>{pairCode}</span>
      <button style={s.stop} onClick={onStop}>Stop</button>
    </div>
  );
}
