import React, { useEffect, useState } from 'react';
import { readScratchpad, writeScratchpad } from '../../utils/scratchpad';

// Running coach scratch pad at the top of the 1-on-1 view. Shows every stamped
// note logged for this program so far (piles up day to day). Auto-fed when the
// trainer logs out a session; each entry is also editable here, and a quick
// "add a note" appends one for today.

export default function ScratchPadCard({ accessCode, programName, currentWeek, currentDay }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(true);
  const [editingIdx, setEditingIdx] = useState(-1);
  const [draft, setDraft] = useState('');

  // Re-read whenever we switch client/program/day (e.g. opening a new session).
  useEffect(() => {
    setEntries(readScratchpad(accessCode, programName));
    setEditingIdx(-1);
  }, [accessCode, programName, currentDay, currentWeek]);

  const persist = (next) => {
    setEntries(next);
    writeScratchpad(accessCode, programName, next);
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setDraft(entries[idx]?.text || '');
  };

  const saveEdit = () => {
    const text = draft.trim();
    const next = entries.slice();
    if (!text) {
      next.splice(editingIdx, 1);            // cleared → drop the entry
    } else {
      next[editingIdx] = { ...next[editingIdx], text };
    }
    persist(next);
    setEditingIdx(-1);
    setDraft('');
  };

  const addToday = () => {
    // Reuse today's entry if it already exists, else create a fresh one.
    const existing = entries.findIndex((e) => e.week === currentWeek && e.day === currentDay);
    if (existing >= 0) {
      startEdit(existing);
      return;
    }
    let stamp = '';
    try { stamp = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }); } catch {}
    const next = [...entries, { week: currentWeek, day: currentDay, date: stamp, text: '' }];
    persist(next);
    setEditingIdx(next.length - 1);
    setDraft('');
  };

  return (
    <div style={s.card}>
      <button style={s.header} onClick={() => setOpen((o) => !o)}>
        <span style={s.title}>📝 Session Notes <span style={s.titleSub}>(running — this program)</span></span>
        <span style={s.caret}>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div style={s.body}>
          {entries.length === 0 && editingIdx < 0 && (
            <div style={s.empty}>
              Notes you log each session pile up here for the whole program — like one running sheet of scratch paper.
            </div>
          )}

          {entries.map((e, idx) => (
            <div key={idx} style={s.entry}>
              <div style={s.stamp}>— Wk{e.week} Day{e.day}{e.date ? ` (${e.date})` : ''} —</div>
              {editingIdx === idx ? (
                <div>
                  <textarea
                    style={s.textarea}
                    value={draft}
                    onChange={(ev) => setDraft(ev.target.value)}
                    rows={4}
                    autoFocus
                    placeholder="Worked R shoulder, kept press light…"
                  />
                  <div style={s.editRow}>
                    <button style={{ ...s.miniBtn, ...s.ghost }} onClick={() => { setEditingIdx(-1); setDraft(''); }}>Cancel</button>
                    <button style={{ ...s.miniBtn, ...s.primary }} onClick={saveEdit}>Save</button>
                  </div>
                </div>
              ) : (
                <div style={s.entryText} onClick={() => startEdit(idx)}>
                  {e.text}
                  <span style={s.editHint}> ✏️</span>
                </div>
              )}
            </div>
          ))}

          {editingIdx < 0 && (
            <button style={s.addBtn} onClick={addToday}>＋ Add a note for today</button>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  card: { background: 'rgba(255,255,255,0.96)', border: '1px solid #e7e3f5', borderRadius: 12, marginBottom: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  header: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none', padding: '11px 14px', cursor: 'pointer' },
  title: { color: '#fff', fontWeight: 800, fontSize: 14 },
  titleSub: { color: '#dfe3ff', fontWeight: 600, fontSize: 11 },
  caret: { color: '#fff', fontSize: 14 },
  body: { padding: '10px 12px', maxHeight: 280, overflowY: 'auto' },
  empty: { color: '#9aa0ab', fontSize: 13, lineHeight: 1.5, padding: '6px 2px 10px' },
  entry: { padding: '6px 0', borderBottom: '1px solid #f1eefb' },
  stamp: { fontSize: 11, fontWeight: 800, color: '#7c6fb0', letterSpacing: 0.3, marginBottom: 3 },
  entryText: { fontSize: 13.5, color: '#2a2a3a', lineHeight: 1.5, whiteSpace: 'pre-wrap', cursor: 'text' },
  editHint: { color: '#b9b3d6', fontSize: 12 },
  textarea: { width: '100%', boxSizing: 'border-box', border: '1.5px solid #d9d3f0', borderRadius: 8, padding: 9, fontSize: 13.5, fontFamily: 'inherit', lineHeight: 1.5, outline: 'none', resize: 'vertical' },
  editRow: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 },
  miniBtn: { padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  ghost: { background: '#f1f0f6', color: '#555' },
  primary: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' },
  addBtn: { marginTop: 8, width: '100%', padding: '9px', borderRadius: 8, border: '1.5px dashed #c7c0e6', background: '#faf9ff', color: '#6d5fb3', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
};
