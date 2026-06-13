import React, { useEffect, useState } from 'react';
import { readScratchpad, writeScratchpad, scratchpadToText } from '../../utils/scratchpad';

// Public chatbot endpoint that proxies to Claude (same one the trainer
// dashboard's AI Coach Summary uses). Browser-callable, no auth.
const CHAT_API_BASE =
  (typeof window !== 'undefined' && window.gwtConfig?.chatApiBase) ||
  'https://chat.bestrongagain.com';

// At the end of a program, summarize the whole running sheet of notes into a
// coach-facing recap that informs building the next block. Reuses the monthly
// report's clinical/sectioned tone, but the INPUT is raw coach notes (not
// volume numbers), and the OUTPUT is for the coach's own planning.
function buildProgramSummaryPrompt(clientName, programName, notesText) {
  return [
    `You are Coach Glen reviewing your own training notes at the end of a program block for ${clientName || 'your client'}${programName ? ` ("${programName}")` : ''}.`,
    'Below are your raw session notes from the whole program, logged day by day.',
    '',
    'SESSION NOTES:',
    '"""',
    notesText,
    '"""',
    '',
    'TASK: Summarize the findings so you can build the next program. Write:',
    '  1. OVERVIEW — 2-3 sentences on how the block went overall.',
    '  2. PROGRESS & WINS — what improved, PRs, movements that clicked.',
    '  3. ISSUES & LIMITATIONS — pain, mobility restrictions, exercises to avoid or regress, anything to watch.',
    '  4. FOCUS NEXT PROGRAM — 3-5 concrete priorities for the next block, grounded in these notes.',
    'Stay specific to what is actually in the notes — do NOT invent numbers or details that are not there. This is for the coach\'s own planning, so be direct and practical. Output ONLY the summary.',
  ].join('\n');
}

// Running coach scratch pad at the top of the 1-on-1 view. Shows every stamped
// note logged for this program so far (piles up day to day). Auto-fed when the
// trainer logs out a session; each entry is also editable here, and a quick
// "add a note" appends one for today.

export default function ScratchPadCard({ accessCode, programName, currentWeek, currentDay, totalWeeks, clientName, userEmail, getSessionNotes }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(true);
  const [editingIdx, setEditingIdx] = useState(-1);
  const [draft, setDraft] = useState('');

  // Program-end AI summary state
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryErr, setSummaryErr] = useState('');

  // Show the summarize button once they're in the last week (or if the program
  // length is unknown). Glen hits it when the client's done — even if they
  // didn't train every day of that last week.
  const isLastWeek = !totalWeeks || (currentWeek && currentWeek >= totalWeeks);

  const runSummary = async () => {
    setSummarizing(true);
    setSummaryErr('');
    setSummary('');
    try {
      const notesText = scratchpadToText(entries);
      const res = await fetch(`${CHAT_API_BASE}/api/embed-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: buildProgramSummaryPrompt(clientName, programName, notesText),
          // 'trainer_dashboard' routes to the chatbot's clean generate_summary()
          // path (bypasses the sales-funnel system prompt + compliance audit),
          // so the recap comes out direct instead of as a sales chat.
          context: { source: 'trainer_dashboard', user_first_name: (clientName || '').split(' ')[0] || '' },
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      setSummary(json.response || '(no response)');
    } catch (e) {
      setSummaryErr(e.message || 'Could not generate the summary.');
    } finally {
      setSummarizing(false);
    }
  };

  const copySummary = () => {
    if (summary) navigator.clipboard?.writeText(summary).catch(() => {});
  };

  // Re-read whenever we switch client/program/day (e.g. opening a new session).
  useEffect(() => {
    setEntries(readScratchpad(accessCode, programName));
    setEditingIdx(-1);
  }, [accessCode, programName, currentDay, currentWeek]);

  // Back-fill from already-logged notes: pull the block + exercise notes the
  // coach has logged for this client's program and drop any day not already on
  // the sheet onto its correct week/day. Local edits are never clobbered.
  useEffect(() => {
    if (!getSessionNotes || !accessCode || !userEmail) return;
    let cancelled = false;
    (async () => {
      try {
        // Filter by access code only (unique per program) — robust to the
        // coach renaming the program title later.
        const res = await getSessionNotes({
          access_code: accessCode,
          user_email: userEmail,
        });
        if (cancelled || !res?.success || !Array.isArray(res.data) || !res.data.length) return;
        const local = readScratchpad(accessCode, programName);
        const seen = new Set(local.map((e) => `${e.week}-${e.day}`));
        const additions = res.data.filter((e) => !seen.has(`${e.week}-${e.day}`));
        if (!additions.length) return;
        const merged = [...local, ...additions].sort(
          (a, b) => (a.week - b.week) || (a.day - b.day)
        );
        writeScratchpad(accessCode, programName, merged);
        setEntries(merged);
      } catch { /* backfill is best-effort */ }
    })();
    return () => { cancelled = true; };
  }, [accessCode, programName, userEmail, getSessionNotes]);

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

          {/* Program-end AI summary — appears on the last week. Hit it when the
              client wraps the block; it reads the whole sheet and recaps the
              findings to inform the next program. */}
          {isLastWeek && entries.length > 0 && (
            <div style={s.summaryWrap}>
              <button style={s.summaryBtn} onClick={runSummary} disabled={summarizing}>
                {summarizing ? '🧠 Summarizing the program…' : '🧠 Summarize this program for the next one'}
              </button>
              {summaryErr && <div style={s.summaryErr}>{summaryErr}</div>}
              {summary && (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    style={{ ...s.textarea, minHeight: 180 }}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={10}
                  />
                  <div style={s.editRow}>
                    <button style={{ ...s.miniBtn, ...s.ghost }} onClick={copySummary}>Copy</button>
                    <button style={{ ...s.miniBtn, ...s.primary }} onClick={runSummary} disabled={summarizing}>Regenerate</button>
                  </div>
                </div>
              )}
            </div>
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
  summaryWrap: { marginTop: 12, paddingTop: 12, borderTop: '1px solid #efeafa' },
  summaryBtn: { width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' },
  summaryErr: { marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5 },
};
