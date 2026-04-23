// CastStatusPill.jsx
// Floating indicator shown whenever the tracker is actively casting to a TV.
// Bottom-right corner. Shows the code, up/down nav arrows (jump exercise-by-
// exercise on the TV), and a Stop button. Arrows are on the LEFT side of the
// pill with clear space before Stop so fat-thumb taps don't kill the cast.

import React from 'react';

const s = {
  pill: {
    position: 'fixed', bottom: 16, right: 16, zIndex: 9998,
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 8px 6px 8px', borderRadius: 999,
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
  arrowBtn: {
    width: 44, height: 44, border: 'none', borderRadius: '50%',
    background: 'rgba(0,0,0,0.18)', color: '#1a1a2e',
    fontSize: 22, fontWeight: 900, cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1,
    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)',
  },
  stop: {
    marginLeft: 14,
    padding: '8px 14px', border: 'none', borderRadius: 999,
    background: 'rgba(0,0,0,0.75)', color: '#fff',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  live: {
    width: 9, height: 9, borderRadius: '50%',
    background: '#b91c1c', marginLeft: 2,
    animation: 'bsa-cast-pulse 1.4s ease-in-out infinite',
  },
};

if (typeof document !== 'undefined' && !document.getElementById('bsa-cast-pill-kf')) {
  const el = document.createElement('style');
  el.id = 'bsa-cast-pill-kf';
  el.textContent = '@keyframes bsa-cast-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }';
  document.head.appendChild(el);
}

export default function CastStatusPill({ pairCode, onStop, onNav, onLayout }) {
  const [layout, setLayoutLocal] = React.useState(() => {
    try { return sessionStorage.getItem('bsa_cast_layout') || 'one_day'; }
    catch { return 'one_day'; }
  });
  if (!pairCode) return null;
  // ▲▼ scroll the TV page/section. Applies to both one-day and two-day
  // layouts — in two-day mode the TV scrolls both columns in sync.
  const nudge = (dir) => {
    try { onNav && onNav(dir > 0 ? 'next' : 'prev'); } catch {}
  };
  const flip = () => {
    const next = layout === 'two_day' ? 'one_day' : 'two_day';
    setLayoutLocal(next);
    try { sessionStorage.setItem('bsa_cast_layout', next); } catch {}
    try { onLayout && onLayout(next); } catch {}
  };
  const layoutTitle = layout === 'two_day'
    ? 'Two-day whiteboard (tap to switch to single-day)'
    : 'Single-day view (tap to switch to two-day whiteboard)';
  return (
    <div style={s.pill}>
      <button style={{ ...s.arrowBtn, marginRight: 6 }} onClick={() => nudge(-1)} title="Previous section on TV" aria-label="Previous section on TV">▲</button>
      <button style={{ ...s.arrowBtn, marginRight: 6 }} onClick={() => nudge(1)}  title="Next section on TV" aria-label="Next section on TV">▼</button>
      <button
        style={{ ...s.arrowBtn, marginRight: 6, fontSize: 16 }}
        onClick={flip}
        title={layoutTitle}
        aria-label={layoutTitle}
      >
        {layout === 'two_day' ? '⊟' : '⊡'}
      </button>
      <span style={s.live}></span>
      <span>Cast</span>
      <span style={s.code}>{pairCode}</span>
      <button style={s.stop} onClick={onStop}>Stop</button>
    </div>
  );
}
