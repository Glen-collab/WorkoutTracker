import { useMemo, useState, useEffect } from 'react';

// 1-on-1 ONLY: shown when the trainer taps "Log Workout". Previews the session
// the coach just logged for the client, pre-fills a notes box with the coach's
// per-exercise notes as bullets (editable + add your own), then logs — with an
// optional "email the client this recap" button. Never shown to normal clients.

const setsCountOf = (ex) =>
  typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 1);

// Build [{ name, summary, note }] for every exercise that has any logged work
// or a coach note. summary = "135×8, 155×5" from tracked weight/reps.
function buildItems(program, trackingData) {
  const td = trackingData || {};
  const items = [];
  (program?.blocks || []).forEach((block, bi) => {
    (block.exercises || []).forEach((ex, ei) => {
      const n = setsCountOf(ex);
      const parts = [];
      for (let si = 0; si < n; si++) {
        const w = td[`${bi}-${ei}-${si}-weight`];
        const r = td[`${bi}-${ei}-${si}-reps`];
        if (w || r) parts.push(w && r ? `${w}×${r}` : (w || `${r} reps`));
      }
      const note = (td[`${bi}-${ei}-null-note`] || '').trim();
      const dur = td[`${bi}-${ei}-0-duration`];
      const dist = td[`${bi}-${ei}-0-distance`];
      let summary = parts.join(', ');
      if (!summary && (dur || dist)) summary = [dist && `${dist}`, dur && `${dur}`].filter(Boolean).join(' · ');
      if (summary || note) items.push({ name: ex.name || 'Exercise', summary, note });
    });
  });
  return items;
}

export default function SessionRecapModal({
  isOpen, onClose, program, trackingData, week, day,
  clientName, programName, onConfirm, busy,
}) {
  const items = useMemo(() => buildItems(program, trackingData), [program, trackingData]);

  // Pre-fill the notes box with the coach's per-exercise notes as bullets.
  const prefill = useMemo(
    () => items.filter((i) => i.note).map((i) => `• ${i.name}: ${i.note}`).join('\n'),
    [items]
  );
  const [notes, setNotes] = useState(prefill);
  useEffect(() => { if (isOpen) setNotes(prefill); }, [isOpen, prefill]);

  if (!isOpen) return null;

  // Items for preview/email carry name + summary only (the notes live in the
  // editable box so the coach controls exactly what's sent).
  const emailItems = items.map((i) => ({ name: i.name, summary: i.summary }));
  const who = clientName || 'your client';

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.title}>Session Recap</div>
          <div style={s.sub}>{programName ? `${programName} · ` : ''}W{week} D{day}</div>
          <button style={s.x} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>
          <div style={s.sectionLabel}>What {who} did</div>
          <div style={s.itemList}>
            {emailItems.length === 0 && <div style={s.empty}>No logged sets yet.</div>}
            {emailItems.map((it, i) => (
              <div key={i} style={s.item}>
                <span style={s.itemName}>{it.name}</span>
                <span style={s.itemSummary}>{it.summary || '—'}</span>
              </div>
            ))}
          </div>

          <div style={s.sectionLabel}>Notes {prefill ? '(your exercise notes, edit or add more)' : ''}</div>
          <textarea
            style={s.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="• Back Squat: great depth, add 10 lbs next week&#10;Add anything else here…"
            rows={6}
          />
        </div>

        <div style={s.footer}>
          <button style={{ ...s.btn, ...s.btnGhost }} disabled={busy} onClick={() => onConfirm(notes, false, emailItems)}>
            Log only
          </button>
          <button style={{ ...s.btn, ...s.btnPrimary, ...(busy ? s.btnBusy : {}) }} disabled={busy} onClick={() => onConfirm(notes, true, emailItems)}>
            {busy ? 'Sending…' : `Log + Email ${who.split(' ')[0]}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 14 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header: { position: 'relative', background: 'linear-gradient(135deg,#667eea,#764ba2)', padding: '16px 18px' },
  title: { color: '#fff', fontSize: 18, fontWeight: 800 },
  sub: { color: '#e0e7ff', fontSize: 12.5, marginTop: 2 },
  x: { position: 'absolute', top: 12, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 15 },
  body: { padding: '16px 18px', overflowY: 'auto' },
  sectionLabel: { fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9ca3af', margin: '4px 0 8px' },
  itemList: { border: '1px solid #eef0f4', borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
  itemName: { fontWeight: 600, color: '#1a1a2e' },
  itemSummary: { color: '#555', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' },
  empty: { padding: 14, color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  textarea: { width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5, outline: 'none', resize: 'vertical' },
  footer: { display: 'flex', gap: 10, padding: '14px 18px', borderTop: '1px solid #f0f0f0' },
  btn: { flex: 1, padding: '13px', borderRadius: 10, border: 'none', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' },
  btnGhost: { background: '#f3f4f6', color: '#374151' },
  btnPrimary: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' },
  btnBusy: { opacity: 0.7, cursor: 'wait' },
};
