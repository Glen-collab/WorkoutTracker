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
  const who = (clientName && clientName.trim()) ? clientName.trim() : 'this client';
  return [
    `You are Coach Glen reviewing your own training notes at the end of a program block for ${who}${programName ? ` (their "${programName}" program)` : ''}.`,
    `IMPORTANT: the client is ${who} — most likely an adult general-fitness client (could be a youth athlete, but do NOT assume "athlete"). Refer to them by their name (first name in prose is fine) or he/she/they. NEVER use the program name${programName ? ` ("${programName}")` : ''} as if it were the person — that is the program label, not who you trained.`,
    'Below are your raw session notes from the whole block, logged day by day.',
    '',
    'SESSION NOTES:',
    '"""',
    notesText,
    '"""',
    '',
    'Write a BLOCK SUMMARY using these exact section headers:',
    '  1. OVERVIEW — 2-4 sentences on how the block went overall.',
    '  2. PROGRESS & WINS — what improved, PRs, movements that clicked (group by exercise/theme where useful).',
    '  3. AREAS FOR IMPROVEMENT — weaknesses, pain/compensation, mobility limits, things to watch.',
    '  4. NEXT BLOCK PRIORITIES — 3-5 concrete priorities for the next block, grounded in these notes.',
    "  5. COACH'S NOTE — a short human closing paragraph on the big-picture takeaway (effort, coachability, trajectory).",
    '',
    'VOICE — write it BOTH ways at once, the way a sharp coach explains things:',
    '  - Lead each point with the precise, slightly technical coaching language — keep the real terminology (posterior chain, scapular control, knee valgus, hip hinge, etc.).',
    '  - Then add a short plain-language explanation in parentheses right after, e.g. "(Simply put, his glutes aren\'t doing enough yet, so his hamstrings pick up the slack.)"',
    '  - The plain version is so the client (or their family) can follow it — clear and human, but NEVER dumbed-down or condescending. Do not talk down to anyone.',
    '',
    'Stay specific to what is actually in the notes — do NOT invent numbers or details that are not there. Output ONLY the summary.',
  ].join('\n');
}

// A clinician-facing handoff — for when the client has a PT or doctor
// appointment. Same running notes (which already fold in Glen's own logged
// observations), but reframed for a medical provider: movement/load tolerance,
// pain/symptom triggers seen in training, and the coach's professional eye.
// Explicitly NOT a diagnosis — training observations for the clinician's review.
function buildPtSummaryPrompt(clientName, programName, notesText) {
  const who = (clientName && clientName.trim()) ? clientName.trim() : 'this client';
  return [
    `You are Coach Glen, a strength & conditioning coach, writing a concise handoff for ${who}'s physical therapist or physician ahead of an appointment.`,
    `The reader is a CLINICIAN (PT / doctor). ${who} is your training client. Below are your day-by-day session notes from their training, which INCLUDE your own coaching observations.`,
    '',
    'SESSION NOTES:',
    '"""',
    notesText,
    '"""',
    '',
    'Write a PT / DOCTOR SUMMARY using these exact section headers:',
    '  1. TRAINING CONTEXT — who they are, what they train, how long/how often (only from the notes).',
    '  2. MOVEMENT & LOAD TOLERANCE — what movements/loads/positions they handle well, and which ones they cannot yet load or have to regress.',
    '  3. PAIN / SYMPTOMS OBSERVED IN TRAINING — any pain, discomfort, flare-ups, or guarding noted, WITH what movement/position triggered it and how it was managed. If none noted, say so.',
    "  4. COACH'S OBSERVATIONS — your professional read: asymmetries, compensations, mobility/stability limits, patterns you see (this is the value only a coach can add).",
    '  5. FOR YOUR ASSESSMENT — 2-4 specific things you would like the PT/doctor to evaluate or advise on, grounded in the notes.',
    '',
    'VOICE & RULES:',
    '  - Professional, factual, and CONCISE — a clinician reading between patients. Real terminology (posterior chain, scapular control, valgus, dorsiflexion, etc.) is expected and welcome; no need to over-explain for this reader.',
    '  - Report ONLY what is in the notes — do NOT invent symptoms, dates, or numbers.',
    '  - You are a coach, NOT a medical provider: describe observations, do NOT diagnose or prescribe treatment. Frame section 5 as questions/requests, not orders.',
    '  - End with one line: "These are training observations from a strength coach, shared to support your assessment — not a medical evaluation."',
    '  - Output ONLY the summary.',
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

  // AI summary state — 'kind' tracks which summary is showing (block vs PT).
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryErr, setSummaryErr] = useState('');
  const [summaryKind, setSummaryKind] = useState(''); // 'block' | 'pt'

  // Show the block-summary button once they're in the last week (or if the
  // program length is unknown). The PT summary is available ANY time.
  const isLastWeek = !totalWeeks || (currentWeek && currentWeek >= totalWeeks);

  const runSummaryOfKind = async (kind) => {
    setSummarizing(true);
    setSummaryErr('');
    setSummary('');
    setSummaryKind(kind);
    try {
      const notesText = scratchpadToText(entries);
      const message = kind === 'pt'
        ? buildPtSummaryPrompt(clientName, programName, notesText)
        : buildProgramSummaryPrompt(clientName, programName, notesText);
      const res = await fetch(`${CHAT_API_BASE}/api/embed-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
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
  const runSummary = () => runSummaryOfKind('block');
  const runPtSummary = () => runSummaryOfKind('pt');

  const copySummary = () => {
    if (summary) navigator.clipboard?.writeText(summary).catch(() => {});
  };

  // Re-read whenever we switch client/program/day (e.g. opening a new session).
  // Keyed by userEmail too so each client on a shared program code gets THEIR
  // own pad (not the whole group's).
  useEffect(() => {
    setEntries(readScratchpad(accessCode, programName, userEmail));
    setEditingIdx(-1);
  }, [accessCode, programName, userEmail, currentDay, currentWeek]);

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
        const local = readScratchpad(accessCode, programName, userEmail);
        const seen = new Set(local.map((e) => `${e.week}-${e.day}`));
        const additions = res.data.filter((e) => !seen.has(`${e.week}-${e.day}`));
        if (!additions.length) return;
        const merged = [...local, ...additions].sort(
          (a, b) => (a.week - b.week) || (a.day - b.day)
        );
        writeScratchpad(accessCode, programName, userEmail, merged);
        setEntries(merged);
      } catch { /* backfill is best-effort */ }
    })();
    return () => { cancelled = true; };
  }, [accessCode, programName, userEmail, getSessionNotes]);

  const persist = (next) => {
    setEntries(next);
    writeScratchpad(accessCode, programName, userEmail, next);
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

      {/* AI summaries live OUTSIDE the scrollable notes body so the generated
          result shows full-size instead of clipped below the 280px fold.
          PT/Doctor recap is available ANY time; the block recap on the last week. */}
      {open && entries.length > 0 && (
        <div style={s.summaryOuter}>
          <button style={s.ptBtn} onClick={runPtSummary} disabled={summarizing}>
            {summarizing && summaryKind === 'pt' ? '🩺 Writing the PT / Doctor summary…' : '🩺 Summary for PT / Doctor'}
          </button>
          {isLastWeek && (
            <button style={{ ...s.summaryBtn, marginTop: 8 }} onClick={runSummary} disabled={summarizing}>
              {summarizing && summaryKind === 'block' ? '🧠 Summarizing the program…' : '🧠 Summarize this program for the next one'}
            </button>
          )}
          {summaryErr && <div style={s.summaryErr}>{summaryErr}</div>}
          {summary && (
            <div style={{ marginTop: 8 }}>
              <div style={s.summaryTag}>{summaryKind === 'pt' ? '🩺 PT / Doctor summary' : '🧠 Block summary'} — edit before you send</div>
              <textarea
                style={{ ...s.textarea, minHeight: 180 }}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={12}
              />
              <div style={s.editRow}>
                <button style={{ ...s.miniBtn, ...s.ghost }} onClick={copySummary}>Copy</button>
                <button style={{ ...s.miniBtn, ...s.primary }} onClick={() => runSummaryOfKind(summaryKind)} disabled={summarizing}>Regenerate</button>
              </div>
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
  summaryOuter: { padding: '12px', borderTop: '1px solid #efeafa' },
  summaryBtn: { width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' },
  ptBtn: { width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#0d9488,#0891b2)', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' },
  summaryTag: { fontSize: 11, fontWeight: 800, color: '#6d5fb3', marginBottom: 5, letterSpacing: 0.3 },
  summaryErr: { marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5 },
};
