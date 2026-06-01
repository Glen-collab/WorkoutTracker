// OneOnOnePickerScreen — the trainer's "digital clipboard" entry.
//
// Launched from the Coach Dashboard's "1-on-1 Training" button as
//   ?mode=1on1&coach=<referral_code>
//
// The coach (on their own iPad) taps a client and that client's OWN program
// opens in the normal tracker so the coach logs weights set-by-set, exactly
// like the paper sheet. Two paths:
//   • Existing clients  — anyone with a saved position under this coach's
//                         programs; tap to resume at their current week/day.
//   • + New client      — pick one of the coach's programs, enter the client's
//                         name + email; loading creates their position so they
//                         appear in the list next time.
//
// The client never signs in here. Their email is the join: it's what we log
// against AND what their magic-link member dashboard reads. So we always
// carry the exact email forward — never retyped for an existing client.

import React, { useEffect, useMemo, useState } from 'react';

const KIOSK_BASE = 'https://app.bestrongagain.com/api/kiosk/';

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
    borderRadius: '16px', padding: '24px 22px', color: '#fff',
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
  fieldLabel: {
    fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '1px', color: 'rgba(255,255,255,0.65)', marginBottom: '6px',
  },
  search: {
    width: '100%', padding: '12px 14px',
    background: 'rgba(0,0,0,0.3)', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '10px',
    fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box', outline: 'none',
  },
  list: {
    maxHeight: '46vh', overflowY: 'auto',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
    background: 'rgba(0,0,0,0.2)',
  },
  row: {
    padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer', fontSize: '16px', fontWeight: 600, transition: 'background 100ms',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
  },
  rowHover: { background: 'rgba(255,255,255,0.06)' },
  rowMeta: { fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 },
  empty: { padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' },
  status: { padding: '14px', textAlign: 'center', color: 'rgba(255,255,255,0.7)' },
  errorBox: {
    background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)',
    borderRadius: '10px', padding: '12px 14px', color: '#fecaca', fontSize: '13px',
    marginBottom: '14px',
  },
  newBtn: {
    width: '100%', marginTop: '14px', padding: '14px',
    background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.3)',
    borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  },
  primaryBtn: {
    width: '100%', marginTop: '6px', padding: '14px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none',
    borderRadius: '10px', color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
  },
  linkBtn: {
    width: '100%', marginTop: '12px', padding: '8px', background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline',
  },
};

export default function OneOnOnePickerScreen({ onPick }) {
  const coachCode = useMemo(
    () => (new URLSearchParams(window.location.search).get('coach') || '').trim().toUpperCase(),
    []
  );

  const [clients, setClients] = useState(null);
  const [search, setSearch] = useState('');
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [err, setErr] = useState('');

  // New-client pairing state
  const [adding, setAdding] = useState(false);
  const [programs, setPrograms] = useState(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newProgram, setNewProgram] = useState('');

  useEffect(() => {
    if (!coachCode) { setErr('Missing coach code in the link.'); setClients([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${KIOSK_BASE}coach-clients?coach=${encodeURIComponent(coachCode)}`);
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) { setErr(d.error || 'Failed to load clients'); setClients([]); }
        else setClients(d.clients || []);
      } catch (e) {
        if (!cancelled) { setErr(e.message || 'Network error'); setClients([]); }
      }
    })();
    return () => { cancelled = true; };
  }, [coachCode]);

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  const pickExisting = (c) => {
    // Resume at the client's saved position; carry their exact email forward.
    onPick({ name: c.name, email: c.email, code: c.access_code, week: c.week, day: c.day }, true);
  };

  const openAddNew = async () => {
    setAdding(true);
    setErr('');
    if (programs === null) {
      try {
        const r = await fetch(`${KIOSK_BASE}coach-programs?coach=${encodeURIComponent(coachCode)}`);
        const d = await r.json();
        if (!r.ok) { setErr(d.error || 'Failed to load programs'); setPrograms([]); }
        else setPrograms(d.programs || []);
      } catch (e) {
        setErr(e.message || 'Network error'); setPrograms([]);
      }
    }
  };

  const submitNew = () => {
    const name = newName.trim();
    const email = newEmail.trim().toLowerCase();
    if (!name) { setErr('Enter the client’s name.'); return; }
    if (!email || !email.includes('@')) { setErr('Enter a valid client email.'); return; }
    if (!newProgram) { setErr('Pick which program this client is on.'); return; }
    // First load creates their position; they'll appear in the list next time.
    onPick({ name, email, code: newProgram }, false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>Be Strong Again</div>
        <h1 style={styles.title}>1-on-1 Training</h1>

        {err && <div style={styles.errorBox}>{err}</div>}

        {!adding ? (
          <>
            <p style={styles.sub}>Tap a client to open their workout and log it.</p>
            <div style={styles.fieldLabel}>Search</div>
            <input
              style={styles.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a name…"
              autoFocus
            />
            <div style={styles.list}>
              {clients === null ? (
                <div style={styles.status}>Loading…</div>
              ) : filtered.length === 0 ? (
                <div style={styles.empty}>
                  {clients.length === 0
                    ? 'No 1-on-1 clients yet. Add your first one below.'
                    : 'No match.'}
                </div>
              ) : (
                filtered.map((c, i) => (
                  <div
                    key={`${c.email}-${c.access_code}`}
                    onClick={() => pickExisting(c)}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(-1)}
                    style={{ ...styles.row, ...(hoverIdx === i ? styles.rowHover : {}) }}
                  >
                    <span>{c.name}</span>
                    <span style={styles.rowMeta}>
                      {c.access_code}{c.week ? ` · W${c.week}` : ''}{c.day ? `D${c.day}` : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
            <button style={styles.newBtn} onClick={openAddNew}>+ New client</button>
          </>
        ) : (
          <>
            <p style={styles.sub}>Pair a new client to one of your programs.</p>
            <div style={styles.fieldLabel}>Client name</div>
            <input
              style={styles.search}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Debbie"
              autoFocus
            />
            <div style={styles.fieldLabel}>Client email (their dashboard login)</div>
            <input
              style={styles.search}
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="debbie@example.com"
            />
            <div style={styles.fieldLabel}>Program</div>
            {programs === null ? (
              <div style={styles.status}>Loading programs…</div>
            ) : (
              <select
                style={styles.search}
                value={newProgram}
                onChange={(e) => setNewProgram(e.target.value)}
              >
                <option value="">Select a program…</option>
                {programs.map((p) => (
                  <option key={p.access_code} value={p.access_code}>
                    {p.name} ({p.access_code})
                  </option>
                ))}
              </select>
            )}
            <button style={styles.primaryBtn} onClick={submitNew}>Start workout</button>
            <button style={styles.linkBtn} onClick={() => { setAdding(false); setErr(''); }}>
              ← Back to client list
            </button>
          </>
        )}
      </div>
    </div>
  );
}
