// CastButton.jsx
// "📺 Cast to TV" pill that opens a modal asking for the 4-digit pair code shown
// on the user's smart TV browser at bestrongagain.netlify.app/cast.
// On submit, POSTs the current workout context to /api/cast/push so the TV
// page (which has been polling) picks it up within 2 seconds.

import React, { useState } from 'react';

const CAST_API = 'https://app.bestrongagain.com/api/cast';

const s = {
  btn: {
    padding: '8px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #ff9a3c, #ffd200)', color: '#1a1a2e',
    fontSize: '13px', fontWeight: 800, letterSpacing: '0.3px',
    boxShadow: '0 2px 8px rgba(255,154,60,0.3)',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 14, padding: '22px 20px',
    width: '100%', maxWidth: 380, boxShadow: '0 16px 60px rgba(0,0,0,0.4)',
  },
  title: { fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 },
  sub: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.45 },
  url: {
    fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12,
    background: '#f0f4ff', color: '#1a1a2e', padding: '6px 10px',
    borderRadius: 6, display: 'inline-block', marginTop: 4,
  },
  codeInput: {
    width: '100%', padding: '14px', fontSize: 28, fontWeight: 900,
    textAlign: 'center', letterSpacing: 12, fontFamily: 'ui-monospace, Consolas, monospace',
    border: '2px solid #d1d5db', borderRadius: 10, marginBottom: 14,
    boxSizing: 'border-box',
  },
  row: { display: 'flex', gap: 10 },
  primary: {
    flex: 1, padding: 12, border: 'none', borderRadius: 10,
    background: 'linear-gradient(135deg, #ff9a3c, #ffd200)', color: '#1a1a2e',
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
  },
  cancel: {
    flex: '0 0 90px', padding: 12, border: '1.5px solid #d1d5db', borderRadius: 10,
    background: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  status: {
    marginTop: 12, padding: '10px 12px', borderRadius: 8, fontSize: 13, lineHeight: 1.4,
  },
  ok: { background: '#ecfdf5', color: '#065f46' },
  err: { background: '#fef2f2', color: '#b91c1c' },
};

export default function CastButton({
  program,        // workout program object (must have .accessCode or .access_code)
  userEmail,
  userName,
  currentWeek,
  currentDay,
  maxes,
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setCode(''); setStatus(null); setBusy(false); };
  const close = () => { setOpen(false); reset(); };

  const send = async () => {
    if (!/^\d{4}$/.test(code)) {
      setStatus({ ok: false, msg: 'Enter the 4-digit code shown on your TV.' });
      return;
    }
    const access = program?.accessCode || program?.access_code;
    if (!access) {
      setStatus({ ok: false, msg: 'No active workout to cast.' });
      return;
    }
    setBusy(true); setStatus(null);
    try {
      const r = await fetch(CAST_API + '/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair_code: code,
          access_code: access,
          user_email: userEmail || '',
          user_name: userName || '',
          week: currentWeek || 1,
          day: currentDay || 1,
          main_maxes: maxes || {},
        }),
      });
      const d = await r.json();
      if (d.success) {
        setStatus({ ok: true, msg: 'Sent! Your TV should switch within 2 seconds.' });
        setTimeout(close, 1800);
      } else {
        setStatus({ ok: false, msg: d.message || 'Could not cast. Try a fresh code.' });
      }
    } catch (e) {
      setStatus({ ok: false, msg: 'Network error.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button style={s.btn} onClick={() => setOpen(true)} title="Cast this workout to your TV">
        📺 Cast to TV
      </button>
      {open && (
        <div style={s.overlay} onClick={close}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.title}>Cast to your TV</div>
            <div style={s.sub}>
              On your smart TV's browser, open <span style={s.url}>bestrongagain.netlify.app/cast</span> — you'll see a 4-digit code. Type it below.
            </div>
            <input
              style={s.codeInput}
              type="tel"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              placeholder="0000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            <div style={s.row}>
              <button style={s.cancel} onClick={close} disabled={busy}>Cancel</button>
              <button style={s.primary} onClick={send} disabled={busy}>
                {busy ? 'Sending…' : 'Cast'}
              </button>
            </div>
            {status && (
              <div style={{ ...s.status, ...(status.ok ? s.ok : s.err) }}>{status.msg}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
