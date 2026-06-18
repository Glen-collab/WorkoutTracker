// OneOnOnePickerScreen — the trainer's "digital clipboard" entry.
//
// Launched from the Coach Dashboard's "1-on-1 Training" button as
//   ?mode=1on1&coach=<referral_code>
//
// Default view shows only the coach's CURATED FOLDER (the handful they actually
// train), pinned + grouped — not everyone who's ever logged. Search pulls up any
// client; picking one offers to keep them in the folder. New clients pair to a
// program and auto-pin. Groups (2-4) are saved and each member keeps their own
// program. The client never signs in here; their email is the join.

import React, { useEffect, useMemo, useState, useCallback } from 'react';

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
    color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '8px', fontWeight: 700,
  },
  title: {
    fontSize: '26px', fontWeight: 900, textAlign: 'center', marginBottom: '4px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
  },
  sub: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '18px', lineHeight: 1.4 },
  fieldLabel: {
    fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
    color: 'rgba(255,255,255,0.65)', marginBottom: '6px',
  },
  groupLabel: {
    fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
    color: '#fbbf24', margin: '14px 2px 6px',
  },
  search: {
    width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '10px',
    fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box', outline: 'none',
  },
  list: {
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
    background: 'rgba(0,0,0,0.2)', overflow: 'hidden',
  },
  row: {
    padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer', fontSize: '16px', fontWeight: 600,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
  },
  rowMeta: { fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 },
  empty: { padding: '18px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' },
  status: { padding: '14px', textAlign: 'center', color: 'rgba(255,255,255,0.7)' },
  errorBox: {
    background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)',
    borderRadius: '10px', padding: '12px 14px', color: '#fecaca', fontSize: '13px', marginBottom: '14px',
  },
  rowBtns: { display: 'flex', gap: '8px', marginTop: '14px' },
  ghostBtn: {
    flex: 1, padding: '13px', background: 'rgba(255,255,255,0.08)',
    border: '1px dashed rgba(255,255,255,0.3)', borderRadius: '10px',
    color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
  },
  primaryBtn: {
    width: '100%', marginTop: '8px', padding: '14px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none',
    borderRadius: '10px', color: '#fff', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
  },
  linkBtn: {
    width: '100%', marginTop: '12px', padding: '8px', background: 'none', border: 'none',
    color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50,
  },
  modal: {
    width: '100%', maxWidth: '380px', background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '22px', color: '#fff',
  },
};

export default function OneOnOnePickerScreen({ onPick }) {
  const coachCode = useMemo(
    () => (new URLSearchParams(window.location.search).get('coach') || '').trim().toUpperCase(),
    []
  );

  const [folder, setFolder] = useState(null);   // pinned clients (with .group)
  const [allClients, setAllClients] = useState(null); // search source (lazy)
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');

  // new-client pairing
  const [adding, setAdding] = useState(false);
  const [programs, setPrograms] = useState(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newProgram, setNewProgram] = useState('');
  const [sendInvite, setSendInvite] = useState(true);

  // group-create mode
  const [groupMode, setGroupMode] = useState(false);
  const [selected, setSelected] = useState({}); // email -> true

  // "keep in folder?" prompt for a client picked via search
  const [pendingPin, setPendingPin] = useState(null);
  // Edit mode: tap "Remove" to un-pin a client who's done with 1-on-1.
  const [editMode, setEditMode] = useState(false);

  const loadFolder = useCallback(async () => {
    if (!coachCode) { setErr('Missing coach code in the link.'); setFolder([]); return; }
    try {
      const r = await fetch(`${KIOSK_BASE}oneonone-folder?coach=${encodeURIComponent(coachCode)}`);
      const d = await r.json();
      if (!r.ok) { setErr(d.error || 'Failed to load clients'); setFolder([]); }
      else setFolder(d.clients || []);
    } catch (e) { setErr(e.message || 'Network error'); setFolder([]); }
  }, [coachCode]);

  useEffect(() => { loadFolder(); }, [loadFolder]);

  // Un-pin a client from the 1-on-1 folder (when they're done training here).
  const removeFromFolder = async (c) => {
    if (!window.confirm(`Remove ${c.name} from your 1-on-1 folder?`)) return;
    try {
      await fetch(`${KIOSK_BASE}oneonone-folder/remove`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach: coachCode, email: c.email }),
      });
      await loadFolder();
    } catch (e) { setErr(e.message || 'Failed to remove'); }
  };

  // Lazily fetch the full roster the first time the coach searches.
  const ensureAllClients = useCallback(async () => {
    if (allClients !== null) return;
    try {
      const r = await fetch(`${KIOSK_BASE}coach-clients?coach=${encodeURIComponent(coachCode)}`);
      const d = await r.json();
      setAllClients(r.ok ? (d.clients || []) : []);
    } catch { setAllClients([]); }
  }, [allClients, coachCode]);

  const folderEmails = useMemo(
    () => new Set((folder || []).map((c) => (c.email || '').toLowerCase())),
    [folder]
  );

  // Groups + ungrouped, derived from the folder.
  const groups = useMemo(() => {
    const map = new Map();
    (folder || []).forEach((c) => { if (c.group) { if (!map.has(c.group)) map.set(c.group, []); map.get(c.group).push(c); } });
    return [...map.entries()];
  }, [folder]);
  const ungrouped = useMemo(() => (folder || []).filter((c) => !c.group), [folder]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return (allClients || []).filter((c) =>
      (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
    );
  }, [allClients, search]);

  const load = (c, isReturning = true) =>
    onPick({ name: c.name, email: c.email, code: c.access_code, week: c.week, day: c.day }, isReturning);

  const pickFromSearch = (c) => {
    if (folderEmails.has((c.email || '').toLowerCase())) { load(c); return; }
    setPendingPin(c);   // offer to keep them in the folder
  };

  const confirmPin = async (keep) => {
    const c = pendingPin;
    setPendingPin(null);
    if (keep) {
      try {
        await fetch(`${KIOSK_BASE}oneonone-folder/add`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coach: coachCode, email: c.email, name: c.name, access_code: c.access_code }),
        });
      } catch { /* best-effort */ }
    }
    load(c);
  };

  const toggleSel = (email) => setSelected((s) => ({ ...s, [email]: !s[email] }));

  const createGroup = async () => {
    const emails = Object.keys(selected).filter((e) => selected[e]);
    if (emails.length < 2) { setErr('Pick at least 2 clients for a group.'); return; }
    const name = (window.prompt('Name this group (e.g. "Tue 6am"):') || '').trim();
    if (!name) return;
    try {
      await fetch(`${KIOSK_BASE}oneonone-group`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach: coachCode, group_name: name, emails }),
      });
    } catch { /* best-effort */ }
    setGroupMode(false); setSelected({}); setErr('');
    loadFolder();
  };

  const ensurePrograms = useCallback(async () => {
    if (programs !== null) return;
    try {
      const r = await fetch(`${KIOSK_BASE}coach-programs?coach=${encodeURIComponent(coachCode)}`);
      const d = await r.json();
      setPrograms(r.ok ? (d.programs || []) : []);
    } catch { setPrograms([]); }
  }, [programs, coachCode]);

  const openAddNew = async () => {
    setAdding(true); setErr('');
    ensurePrograms();
  };

  // ── Switch an INDIVIDUAL client to a different program (Edit mode → ⚙ Program) ──
  const [switchClient, setSwitchClient] = useState(null);  // the client being switched
  const [switchProgram, setSwitchProgram] = useState('');

  const openSwitch = (c) => { setSwitchClient(c); setSwitchProgram(c.access_code || ''); setErr(''); ensurePrograms(); };
  const launchSwitch = async () => {
    if (!switchProgram) { setErr('Pick a program.'); return; }
    const c = switchClient;
    // Re-pin with the new access_code (upserts on coach+email → swaps program).
    try {
      await fetch(`${KIOSK_BASE}oneonone-folder/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach: coachCode, email: c.email, name: c.name, access_code: switchProgram }),
      });
    } catch { /* best-effort — still start the session */ }
    setSwitchClient(null); setEditMode(false);
    onPick({ name: c.name, email: c.email, code: switchProgram }, false);  // start the new program fresh
  };

  // ── Group session: run ONE workout for a whole group, log once, email all ──
  const [groupSession, setGroupSession] = useState(null);  // { name, members }
  const [groupProgram, setGroupProgram] = useState('');

  // The group's program = the access_code ALL members share (they're put on it
  // together). Null = not set yet / mismatched → prompt to pick.
  const groupCodeOf = (members) => {
    const codes = (members || []).map((m) => (m.access_code || '').trim());
    if (codes.length && codes.every((c) => c && c === codes[0])) return codes[0];
    return null;
  };
  const memberList = (members) => members.map((m) => ({ name: m.name, email: m.email }));

  // Load the group's shared workout directly (no picker) — log once, email all.
  const trainGroup = (name, members, code) =>
    onPick({ name, email: members[0].email, code, groupMembers: memberList(members) }, false);

  // Open the program picker to assign / change the group's workout.
  const startGroup = (name, members) => {
    setGroupSession({ name, members });
    setGroupProgram(groupCodeOf(members) || '');
    setErr('');
    ensurePrograms();
  };

  const launchGroup = async () => {
    if (!groupProgram) { setErr('Pick a program for the group.'); return; }
    const members = memberList(groupSession.members);
    const name = groupSession.name;
    const code = groupProgram;
    // Persist: put the WHOLE group on this program so it sticks like an
    // individual (every member is on it; loads directly next time).
    try {
      await fetch(`${KIOSK_BASE}oneonone-group/set-program`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach: coachCode, group_name: name, access_code: code }),
      });
    } catch { /* best-effort — still run this session */ }
    // Give each member their OWN dashboard — same magic-link welcome an
    // individual client gets when paired. So group folks aren't second-class.
    members.forEach((m) => {
      if (!m.email) return;
      fetch(`${KIOSK_BASE}invite-client`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach: coachCode, email: m.email, name: m.name }),
      }).catch(() => {});
    });
    setGroupSession(null);
    trainGroup(name, members, code);
  };

  // Load program names once so a group row can show "· Strong Again".
  useEffect(() => { ensurePrograms(); }, [ensurePrograms]);
  const programNameByCode = useMemo(() => {
    const m = {};
    (programs || []).forEach((p) => { m[p.access_code] = p.name; });
    return m;
  }, [programs]);

  const submitNew = async () => {
    const name = newName.trim();
    const email = newEmail.trim().toLowerCase();
    if (!name) { setErr('Enter the client’s name.'); return; }
    if (!email || !email.includes('@')) { setErr('Enter a valid client email.'); return; }
    if (!newProgram) { setErr('Pick which program this client is on.'); return; }
    // New 1-on-1 clients auto-pin to the folder.
    try {
      await fetch(`${KIOSK_BASE}oneonone-folder/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach: coachCode, email, name, access_code: newProgram }),
      });
    } catch { /* best-effort */ }
    if (sendInvite) {
      fetch(`${KIOSK_BASE}invite-client`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach: coachCode, email, name }),
      }).catch(() => {});
    }
    onPick({ name, email, code: newProgram }, false);
  };

  const ClientRow = ({ c, onClick, right, onRemove, onSwitch }) => (
    <div onClick={onClick} style={styles.row}>
      <span>{c.name}</span>
      {(onRemove || onSwitch) ? (
        <span style={{ display: 'flex', gap: '6px' }}>
          {onSwitch && (
            <button
              onClick={(e) => { e.stopPropagation(); onSwitch(c); }}
              style={{ background: 'rgba(245,158,11,0.18)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.45)', borderRadius: '8px', padding: '5px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >⚙ Program</button>
          )}
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(c); }}
              style={{ background: 'rgba(239,68,68,0.18)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.45)', borderRadius: '8px', padding: '5px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >Remove</button>
          )}
        </span>
      ) : (
        <span style={styles.rowMeta}>
          {right != null ? right : `${c.access_code || ''}${c.week ? ` · W${c.week}` : ''}${c.day ? `D${c.day}` : ''}`}
        </span>
      )}
    </div>
  );

  // ── New-client form ──
  if (adding) {
    return (
      <div style={styles.page}><div style={styles.card}>
        <div style={styles.brand}>Be Strong Again</div>
        <h1 style={styles.title}>1-on-1 Training</h1>
        {err && <div style={styles.errorBox}>{err}</div>}
        <p style={styles.sub}>Pair a new client to one of your programs.</p>
        <div style={styles.fieldLabel}>Client name</div>
        <input style={styles.search} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Debbie" autoFocus />
        <div style={styles.fieldLabel}>Client email (their dashboard login)</div>
        <input style={styles.search} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="debbie@example.com" />
        <div style={styles.fieldLabel}>Program</div>
        {programs === null ? <div style={styles.status}>Loading programs…</div> : (
          <select style={styles.search} value={newProgram} onChange={(e) => setNewProgram(e.target.value)}>
            <option value="">Select a program…</option>
            {programs.map((p) => <option key={p.access_code} value={p.access_code}>{p.name} ({p.access_code})</option>)}
          </select>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 2px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
          <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} />
          Email this client a link to their dashboard
        </label>
        <button style={styles.primaryBtn} onClick={submitNew}>Start workout</button>
        <button style={styles.linkBtn} onClick={() => { setAdding(false); setErr(''); }}>← Back to client list</button>
      </div></div>
    );
  }

  return (
    <div style={styles.page}><div style={styles.card}>
      <div style={styles.brand}>Be Strong Again</div>
      <h1 style={styles.title}>1-on-1 Training</h1>
      {err && <div style={styles.errorBox}>{err}</div>}

      {groupMode ? (
        <>
          <p style={styles.sub}>Check 2–4 clients, then create the group.</p>
          <div style={styles.list}>
            {ungrouped.concat(folder.filter((c) => c.group)).length === 0
              ? <div style={styles.empty}>Pin some clients first.</div>
              : (folder || []).map((c) => (
                <label key={c.email} style={{ ...styles.row, cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" checked={!!selected[c.email]} onChange={() => toggleSel(c.email)} />
                    {c.name}
                  </span>
                  <span style={styles.rowMeta}>{c.group || ''}</span>
                </label>
              ))}
          </div>
          <button style={styles.primaryBtn} onClick={createGroup}>Create group</button>
          <button style={styles.linkBtn} onClick={() => { setGroupMode(false); setSelected({}); setErr(''); }}>← Cancel</button>
        </>
      ) : (
        <>
          <p style={styles.sub}>Tap a client to open their workout and log it.</p>
          <input
            style={styles.search}
            value={search}
            onChange={(e) => { setSearch(e.target.value); ensureAllClients(); }}
            placeholder="Search all clients…"
          />

          {search.trim() ? (
            <div style={styles.list}>
              {allClients === null ? <div style={styles.status}>Loading…</div>
                : searchResults.length === 0 ? <div style={styles.empty}>No match.</div>
                : searchResults.map((c) => (
                  <ClientRow key={`${c.email}-${c.access_code}`} c={c} onClick={() => pickFromSearch(c)}
                    right={folderEmails.has((c.email || '').toLowerCase()) ? '★ in folder' : undefined} />
                ))}
            </div>
          ) : folder === null ? (
            <div style={styles.status}>Loading…</div>
          ) : (folder.length === 0) ? (
            <div style={styles.empty}>No clients pinned yet. Search above or add a new client below.</div>
          ) : (
            <>
              {groups.map(([name, members]) => {
                const gcode = groupCodeOf(members);
                const gLabel = gcode ? (programNameByCode[gcode] || gcode) : null;
                return (
                <div key={name}>
                  <div style={{ ...styles.groupLabel, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span>
                      👥 {name}
                      {gLabel && <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}> · {gLabel}</span>}
                    </span>
                    {members.length >= 2 && (
                      editMode
                        ? <button
                            onClick={() => startGroup(name, members)}
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', letterSpacing: 0 }}
                          >⚙ Workout</button>
                        : <button
                            onClick={() => (gcode ? trainGroup(name, members, gcode) : startGroup(name, members))}
                            style={{ background: 'rgba(245,158,11,0.18)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.45)', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', letterSpacing: 0 }}
                          >▶ Train together</button>
                    )}
                  </div>
                  <div style={styles.list}>
                    {members.map((c) => <ClientRow key={c.email} c={c} onClick={editMode ? undefined : () => load(c)} onRemove={editMode ? removeFromFolder : undefined} />)}
                  </div>
                </div>
                );
              })}
              {ungrouped.length > 0 && (
                <>
                  {groups.length > 0 && <div style={styles.groupLabel}>Clients</div>}
                  <div style={styles.list}>
                    {ungrouped.map((c) => <ClientRow key={c.email} c={c} onClick={editMode ? undefined : () => load(c)} onRemove={editMode ? removeFromFolder : undefined} onSwitch={editMode ? openSwitch : undefined} />)}
                  </div>
                </>
              )}
            </>
          )}

          <div style={styles.rowBtns}>
            <button style={styles.ghostBtn} onClick={openAddNew}>+ New client</button>
            {(folder || []).length >= 2 && !editMode && (
              <button style={styles.ghostBtn} onClick={() => { setGroupMode(true); setSearch(''); }}>Make a group</button>
            )}
            {(folder || []).length > 0 && (
              <button style={styles.ghostBtn} onClick={() => setEditMode((v) => !v)}>{editMode ? '✓ Done' : '✏️ Edit'}</button>
            )}
          </div>
          {editMode && <p style={{ ...styles.sub, color: '#fcd34d', marginTop: '10px' }}>Tap “⚙ Program” to switch a client to a different program, or “Remove” to unpin them (they keep their program).</p>}
        </>
      )}

      {groupSession && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px' }}>👥 {groupSession.name}</div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, marginBottom: '14px' }}>
              {groupSession.members.map((m) => m.name).join(', ')} — put the group on one program. They’ll all be on it (like an individual), it loads straight to this workout next time, and logging emails everyone.
            </p>
            <div style={styles.fieldLabel}>Group’s program</div>
            {programs === null ? <div style={styles.status}>Loading programs…</div> : (
              <select style={styles.search} value={groupProgram} onChange={(e) => setGroupProgram(e.target.value)}>
                <option value="">Select a program…</option>
                {programs.map((p) => <option key={p.access_code} value={p.access_code}>{p.name} ({p.access_code})</option>)}
              </select>
            )}
            <button style={styles.primaryBtn} onClick={launchGroup}>Start group workout</button>
            <button style={styles.linkBtn} onClick={() => { setGroupSession(null); setErr(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {switchClient && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px' }}>Change {switchClient.name}’s program</div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, marginBottom: '14px' }}>
              Pick a new program for {switchClient.name}. They start it at Week 1, Day 1, and it loads straight to this workout next time.
            </p>
            <div style={styles.fieldLabel}>Program</div>
            {programs === null ? <div style={styles.status}>Loading programs…</div> : (
              <select style={styles.search} value={switchProgram} onChange={(e) => setSwitchProgram(e.target.value)}>
                <option value="">Select a program…</option>
                {programs.map((p) => <option key={p.access_code} value={p.access_code}>{p.name} ({p.access_code})</option>)}
              </select>
            )}
            <button style={styles.primaryBtn} onClick={launchSwitch}>Set program &amp; start workout</button>
            <button style={styles.linkBtn} onClick={() => { setSwitchClient(null); setErr(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {pendingPin && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '8px' }}>Keep {pendingPin.name} in your folder?</div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, marginBottom: '18px' }}>
              They’ll stay pinned at the top of your 1-on-1 list for quick access.
            </p>
            <button style={styles.primaryBtn} onClick={() => confirmPin(true)}>Keep &amp; start workout</button>
            <button style={styles.linkBtn} onClick={() => confirmPin(false)}>Just start, don’t pin</button>
          </div>
        </div>
      )}
    </div></div>
  );
}
