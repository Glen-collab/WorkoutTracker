// MagicLinkConsume.jsx
// Landing page for the magic-link emails. Extracts ?token= from the URL,
// exchanges it for a JWT via /api/auth/magic-link/consume, stores it, and
// redirects back to the tracker with FriendChat available.

import React, { useEffect, useState } from 'react';

const API = 'https://app.bestrongagain.com/api/auth';

const s = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  card: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16, padding: '28px 24px', maxWidth: 420, width: '100%', textAlign: 'center',
  },
  title: {
    fontSize: 22, fontWeight: 900, lineHeight: 1.2,
    background: 'linear-gradient(135deg,#ffd200,#ff9a3c)',
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
    marginBottom: 12,
  },
  body: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 20 },
  btn: {
    background: 'linear-gradient(135deg,#ff9a3c,#ffd200)', color: '#1a1a2e',
    border: 'none', padding: '12px 22px', borderRadius: 10, fontWeight: 800, cursor: 'pointer',
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#ff9a3c',
    animation: 'bsa-ml-spin 0.9s linear infinite',
    margin: '0 auto 20px',
  },
};

if (typeof document !== 'undefined' && !document.getElementById('bsa-ml-kf')) {
  const el = document.createElement('style');
  el.id = 'bsa-ml-kf';
  el.textContent = '@keyframes bsa-ml-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(el);
}

export default function MagicLinkConsume() {
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setState({ loading: false, error: 'No sign-in token in URL.' }); return; }
    (async () => {
      try {
        const r = await fetch(API + '/magic-link/consume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const d = await r.json();
        if (!r.ok || !d.success) throw new Error(d.error || 'Sign-in failed');
        localStorage.setItem('bsa_token', d.token);
        localStorage.setItem('bsa_user', JSON.stringify(d.user));
        // Redirect to tracker root — FriendChat will pick up the token.
        setTimeout(() => { window.location.replace('/'); }, 500);
      } catch (e) {
        setState({ loading: false, error: e.message || 'Sign-in failed' });
      }
    })();
  }, []);

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        {state.loading ? (
          <>
            <div style={s.spinner}></div>
            <div style={s.title}>Signing you in…</div>
            <div style={s.body}>You'll land on your workouts in a second.</div>
          </>
        ) : (
          <>
            <div style={s.title}>That link didn't work</div>
            <div style={s.body}>{state.error}<br/>Request a new link from the chat window.</div>
            <a href="/" style={{ ...s.btn, display: 'inline-block', textDecoration: 'none' }}>Back to tracker</a>
          </>
        )}
      </div>
    </div>
  );
}
