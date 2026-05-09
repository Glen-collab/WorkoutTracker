// KioskPickerScreen — replaces AccessScreen when ?kiosk=1 is in the URL.
// Used on a gym tablet (or coach's phone) where multiple members log into
// the same workout day in sequence. Each member picks their name from a
// dropdown of clients under this coach, taps Start, logs their workout,
// returns to the picker.
//
// URL shape from the RemoteControl page's "View Workout" button:
//   ?kiosk=1&coach=<referral_code>&code=<program_code>&week=N&day=M

import React, { useEffect, useMemo, useState } from 'react';

const MEDIA_BASE = 'https://app.bestrongagain.com/api/kiosk/';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '32px 16px',
  },
  card: {
    width: '100%', maxWidth: '520px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '16px',
    padding: '24px 22px',
    color: '#fff',
    boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
  },
  brand: {
    fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px',
    color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '8px',
    fontWeight: 700,
  },
  title: {
    fontSize: '26px', fontWeight: 900, textAlign: 'center', marginBottom: '4px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
  },
  sub: {
    fontSize: '14px', color: 'rgba(255,255,255,0.7)', textAlign: 'center',
    marginBottom: '20px', lineHeight: 1.4,
  },
  contextBox: {
    background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', padding: '10px 12px', marginBottom: '18px',
    fontSize: '13px', color: 'rgba(255,255,255,0.7)',
    display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px',
  },
  contextLabel: { color: 'rgba(255,255,255,0.45)' },
  fieldLabel: {
    fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '1px', color: 'rgba(255,255,255,0.65)', marginBottom: '6px',
  },
  search: {
    width: '100%', padding: '12px 14px',
    background: 'rgba(0,0,0,0.3)', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '10px',
    fontSize: '15px', marginBottom: '12px',
    boxSizing: 'border-box', outline: 'none',
  },
  list: {
    maxHeight: '50vh', overflowY: 'auto',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
    background: 'rgba(0,0,0,0.2)',
  },
  row: {
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    fontSize: '16px', fontWeight: 600,
    transition: 'background 100ms',
  },
  rowHover: { background: 'rgba(255,255,255,0.06)' },
  empty: { padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' },
  status: { padding: '14px', textAlign: 'center', color: 'rgba(255,255,255,0.7)' },
  errorBox: {
    background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)',
    borderRadius: '10px', padding: '12px 14px', color: '#fecaca', fontSize: '13px',
    marginBottom: '14px',
  },
};

export default function KioskPickerScreen({ onPick }) {
  const params = new URLSearchParams(window.location.search);
  const coachCode = (params.get('coach') || '').trim().toUpperCase();
  const accessCode = (params.get('code') || '').trim();
  const week = (params.get('week') || '').trim();
  const day = (params.get('day') || '').trim();

  const [members, setMembers] = useState(null);
  const [search, setSearch] = useState('');
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${MEDIA_BASE}members?coach=${encodeURIComponent(coachCode)}`);
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setErr(d.error || 'Failed to load members');
          setMembers([]);
        } else {
          setMembers(d.members || []);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e.message || 'Network error');
          setMembers([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [coachCode]);

  const filtered = useMemo(() => {
    if (!members) return [];
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      (m.display_name || '').toLowerCase().includes(q)
      || (m.email || '').toLowerCase().includes(q)
      || (m.first_name || '').toLowerCase().includes(q)
    );
  }, [members, search]);

  const handlePick = (m) => {
    if (!m || !accessCode) return;
    onPick({
      name:  m.first_name || m.display_name || '',
      email: m.email,
      code:  accessCode,
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>Be Strong Again</div>
        <h1 style={styles.title}>Tap Your Name</h1>
        <p style={styles.sub}>Then your weights save to your data row.</p>

        {(week || day) && (
          <div style={styles.contextBox}>
            <span><span style={styles.contextLabel}>Workout:</span> Week {week || 1}, Day {day || 1}</span>
            <span><span style={styles.contextLabel}>Code</span> {accessCode}</span>
          </div>
        )}

        {err && <div style={styles.errorBox}>{err}</div>}

        <div style={styles.fieldLabel}>Search</div>
        <input
          style={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type a name…"
          autoFocus
        />

        <div style={styles.list}>
          {members === null ? (
            <div style={styles.status}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>
              {members.length === 0
                ? 'No members signed up yet under this coach.'
                : 'No match.'}
            </div>
          ) : (
            filtered.map((m, i) => (
              <div
                key={m.id}
                onClick={() => handlePick(m)}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(-1)}
                style={{ ...styles.row, ...(hoverIdx === i ? styles.rowHover : {}) }}
              >
                {m.display_name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
