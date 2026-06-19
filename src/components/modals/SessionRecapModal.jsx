import { useMemo, useState, useEffect, useRef } from 'react';

// Resize/compress a photo client-side before it rides along in the email — keeps
// attachments small (phone shots are huge). Returns a JPEG data URL.
function resizePhoto(file, maxDim = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width >= height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

// Collect per-block notes ("Notes for this block") so they show in the recap
// too — they were getting dropped before (only exercise notes were pulled).
function buildBlockNotes(program, trackingData) {
  const td = trackingData || {};
  const out = [];
  (program?.blocks || []).forEach((block, bi) => {
    const note = (td[`block-notes-${bi}`] || '').trim();
    if (note) {
      const label = block.name || block.type || `Block ${bi + 1}`;
      out.push(`• ${label}: ${note}`);
    }
  });
  return out;
}

export default function SessionRecapModal({
  isOpen, onClose, program, trackingData, week, day,
  clientName, programName, onConfirm, busy, groupMembers,
}) {
  const isGroup = Array.isArray(groupMembers) && groupMembers.length > 0;
  const items = useMemo(() => buildItems(program, trackingData), [program, trackingData]);

  // Pre-fill the notes box with block notes + the coach's per-exercise notes.
  const prefill = useMemo(
    () => [
      ...buildBlockNotes(program, trackingData),
      ...items.filter((i) => i.note).map((i) => `• ${i.name}: ${i.note}`),
    ].join('\n'),
    [items, program, trackingData]
  );
  const [notes, setNotes] = useState(prefill);
  const [photos, setPhotos] = useState([]);   // resized JPEG data URLs
  const [memberNotes, setMemberNotes] = useState({});   // email -> private note (group only)
  const fileRef = useRef(null);
  useEffect(() => { if (isOpen) { setNotes(prefill); setPhotos([]); setMemberNotes({}); } }, [isOpen, prefill]);

  const onPickPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      if (photos.length >= 6) break;
      try { const url = await resizePhoto(f); setPhotos((p) => (p.length >= 6 ? p : [...p, url])); } catch { /* skip */ }
    }
  };

  if (!isOpen) return null;

  // Items for preview/email carry name + summary only (the notes live in the
  // editable box so the coach controls exactly what's sent).
  const emailItems = items.map((i) => ({ name: i.name, summary: i.summary }));
  const who = clientName || 'your client';

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.title}>{isGroup ? 'Group Session Recap' : 'Session Recap'}</div>
          <div style={s.sub}>{programName ? `${programName} · ` : ''}W{week} D{day}</div>
          <button style={s.x} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>
          {isGroup && (
            <div style={s.groupNote}>
              👥 Each of the {groupMembers.length} gets the <b>shared note</b> below <b>plus only their own</b> private note — nobody sees anyone else's.
            </div>
          )}
          <div style={s.sectionLabel}>{isGroup ? 'Shared note — goes to everyone (the workout)' : `Notes ${prefill ? '(your exercise notes, edit or add more)' : ''}`}</div>
          <textarea
            style={s.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="• Back Squat: great depth, add 10 lbs next week&#10;Add anything else here…"
            rows={isGroup ? 4 : 6}
          />

          {isGroup && (
            <>
              <div style={{ ...s.sectionLabel, marginTop: 16 }}>🔒 Individual notes — private to each person</div>
              {groupMembers.map((m, i) => (
                <div key={m.email || i} style={{ marginBottom: 10 }}>
                  <div style={s.memberName}>✍️ {m.name || m.email}</div>
                  <textarea
                    style={s.textarea}
                    value={memberNotes[m.email] || ''}
                    onChange={(e) => setMemberNotes((p) => ({ ...p, [m.email]: e.target.value }))}
                    placeholder={`A personal note just for ${(m.name || '').split(' ')[0] || 'them'}…`}
                    rows={2}
                  />
                </div>
              ))}
            </>
          )}

          <div style={s.sectionLabel}>Reference photos (optional, emailed only)</div>
          <div style={s.photoRow}>
            {photos.map((src, i) => (
              <div key={i} style={s.thumbWrap}>
                <img src={src} alt={`ref ${i + 1}`} style={s.thumb} />
                <button style={s.thumbX} onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}>✕</button>
              </div>
            ))}
            {photos.length < 6 && (
              <button style={s.addPhoto} onClick={() => fileRef.current?.click()}>＋<div style={{ fontSize: 10, marginTop: 2 }}>Photo</div></button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onPickPhotos} />
          </div>
        </div>

        <div style={s.footer}>
          <button style={{ ...s.btn, ...s.btnGhost }} disabled={busy} onClick={() => onConfirm(notes, false, emailItems, photos, memberNotes)}>
            Log only
          </button>
          <button style={{ ...s.btn, ...s.btnPrimary, ...(busy ? s.btnBusy : {}) }} disabled={busy} onClick={() => onConfirm(notes, true, emailItems, photos, memberNotes)}>
            {busy ? 'Sending…' : isGroup ? `Log + Email each (${groupMembers.length})` : `Log + Email ${who.split(' ')[0]}`}
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
  groupNote: { background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#3730a3', lineHeight: 1.45, marginBottom: 14 },
  itemList: { border: '1px solid #eef0f4', borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
  itemName: { fontWeight: 600, color: '#1a1a2e' },
  itemSummary: { color: '#555', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' },
  empty: { padding: 14, color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  textarea: { width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5, outline: 'none', resize: 'vertical' },
  memberName: { fontSize: 13, fontWeight: 700, color: '#4338ca', margin: '0 0 4px 2px' },
  photoRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  thumbWrap: { position: 'relative', width: 64, height: 64 },
  thumb: { width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' },
  thumbX: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', fontSize: 11, cursor: 'pointer', lineHeight: '20px', padding: 0 },
  addPhoto: { width: 64, height: 64, borderRadius: 8, border: '1.5px dashed #c7cdd6', background: '#f9fafb', color: '#667eea', fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  footer: { display: 'flex', gap: 10, padding: '14px 18px', borderTop: '1px solid #f0f0f0' },
  btn: { flex: 1, padding: '13px', borderRadius: 10, border: 'none', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' },
  btnGhost: { background: '#f3f4f6', color: '#374151' },
  btnPrimary: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' },
  btnBusy: { opacity: 0.7, cursor: 'wait' },
};
