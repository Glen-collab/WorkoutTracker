import React, { useState, useEffect } from 'react';
import { getMetricInfo } from '../../data/metricGlossary';

// Bottom sheet that explains one stat in plain English. Opens from any tappable
// stat tile, graph tab or the ACWR pill.
//
// Why a sheet and not a tooltip: the stat tiles sit inside cards near the screen
// edge on a phone, and these explanations run longer than a bubble can hold. A
// sheet anchored to the bottom is always reachable with a thumb, can scroll, and
// can never be clipped by a parent's overflow. (The old ACWR `title=` tooltip
// was invisible on mobile — no hover, no long-press. Nobody on a phone ever saw it.)
//
// Two layers: the short line is what everyone reads; "Read more" is opt-in so the
// beginner is not buried and the curious client still gets the full why.

export default function MetricSheet({ infoKey, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const info = getMetricInfo(infoKey);

  // Collapse the long version whenever a different stat is opened, so each one
  // starts at the short answer.
  useEffect(() => { setExpanded(false); }, [infoKey]);

  // Escape to close (desktop / kiosk keyboards).
  useEffect(() => {
    if (!info) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [info, onClose]);

  if (!info) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 10000, animation: 'fadeIn 0.15s ease-out',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={info.title}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10001,
          width: '100%', maxWidth: '520px', margin: '0 auto',
          background: '#fff', borderRadius: '18px 18px 0 0',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
          maxHeight: '82vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: '18px 18px calc(22px + env(safe-area-inset-bottom, 0px))',
          animation: 'slideUp 0.22s ease-out',
        }}
      >
        {/* grab handle — signals "swipe/tap to dismiss" without needing a label */}
        <div style={{ width: '38px', height: '4px', borderRadius: '2px', background: '#d8dbe6', margin: '0 auto 14px' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '22px', lineHeight: 1.2 }}>{info.emoji}</span>
          <h3 style={{ margin: 0, flex: 1, fontSize: '17px', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.3 }}>
            {info.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none', background: '#f0f2f8', color: '#5a6280', borderRadius: '50%',
              width: '30px', height: '30px', fontSize: '17px', fontWeight: 700,
              cursor: 'pointer', lineHeight: '30px', padding: 0, flexShrink: 0,
            }}
          >×</button>
        </div>

        <p style={{ margin: '0 0 14px', fontSize: '14.5px', lineHeight: 1.55, color: '#333' }}>
          {info.short}
        </p>

        {info.more?.length > 0 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{
              border: 'none', background: '#e8ecff', color: '#4554c9',
              borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px',
              fontWeight: 700, cursor: 'pointer', width: '100%',
            }}
          >...read more</button>
        )}

        {expanded && (
          <div style={{ borderTop: '1px solid #eceef5', paddingTop: '12px' }}>
            {info.more.map((para, i) => (
              <p key={i} style={{ margin: '0 0 10px', fontSize: '13.5px', lineHeight: 1.6, color: '#4a4f66' }}>
                {para}
              </p>
            ))}
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none', background: '#667eea', color: '#fff', borderRadius: '10px',
                padding: '11px 14px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', width: '100%', marginTop: '4px',
              }}
            >Got it</button>
          </div>
        )}
      </div>
    </>
  );
}

// Small "ⓘ" glyph for the corner of a stat tile. Purely a signal that the tile
// is tappable — the tile itself carries the click, so this stays pointer-events
// free and never steals the tap or needs its own hit target.
export function InfoDot({ dark = false }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute', top: '5px', right: '7px', fontSize: '11px',
        fontWeight: 700, lineHeight: 1, pointerEvents: 'none',
        color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.6)',
      }}
    >ⓘ</span>
  );
}
