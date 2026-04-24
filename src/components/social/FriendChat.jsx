// FriendChat.jsx — Floating chat bubble in the upper-right of the tracker.
// Friend-only DMs. Consent required on first use. Polls every 30s for unread.
//
// State machine:
//   1. Token missing        → sign-in form  (stores JWT in localStorage)
//   2. Token + no consent   → disclosure + Agree button
//   3. Consent accepted     → friends list + threads

import { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://app.bestrongagain.com/api';

function authFetch(path, opts = {}) {
  const token = localStorage.getItem('bsa_token');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(API + path, { ...opts, headers }).then(async (r) => {
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
    if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
    return data;
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function FriendChat() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bsa_user') || 'null'); } catch { return null; }
  });
  const [consented, setConsented] = useState(false);
  const [unread, setUnread] = useState(0);
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [composeText, setComposeText] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [authError, setAuthError] = useState(null);
  const [magicSent, setMagicSent] = useState(false);
  const [magicSending, setMagicSending] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addStatus, setAddStatus] = useState(null);
  const pollRef = useRef(null);
  const threadPollRef = useRef(null);
  const scrollRef = useRef(null);

  const hasToken = !!localStorage.getItem('bsa_token');

  // Poll unread count globally when logged in
  const pollUnread = useCallback(async () => {
    if (!hasToken) { setUnread(0); return; }
    try {
      const r = await authFetch('/social/messages/unread-count');
      setUnread(r.unread || 0);
    } catch { /* offline or invalid token — silent */ }
  }, [hasToken]);

  useEffect(() => {
    pollUnread();
    pollRef.current = setInterval(pollUnread, 30_000);
    return () => clearInterval(pollRef.current);
  }, [pollUnread]);

  // On open or re-open, check consent + load friends
  useEffect(() => {
    if (!open || !hasToken) return;
    (async () => {
      try {
        const c = await authFetch('/social/consent/status');
        setConsented(!!c.accepted);
        if (c.accepted) {
          const f = await authFetch('/social/friends/list');
          setFriends(f.friends || []);
          setIncoming(f.incoming || []);
        }
      } catch (e) {
        if (String(e.message).toLowerCase().includes('auth')) {
          localStorage.removeItem('bsa_token');
          localStorage.removeItem('bsa_user');
          setMe(null);
        }
      }
    })();
  }, [open, hasToken]);

  // Poll the open thread every 5s for new messages
  useEffect(() => {
    if (!activeFriend || !open) return;
    const fetchThread = async () => {
      try {
        const r = await authFetch(`/social/messages/thread/${activeFriend.id}`);
        setMessages(r.messages || []);
        // Mark as read
        await authFetch('/social/messages/mark-read', {
          method: 'POST',
          body: JSON.stringify({ friend_id: activeFriend.id }),
        });
        pollUnread();
      } catch { /* silent */ }
    };
    fetchThread();
    threadPollRef.current = setInterval(fetchThread, 5_000);
    return () => clearInterval(threadPollRef.current);
  }, [activeFriend, open, pollUnread]);

  // Auto-scroll thread to bottom on new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const email = (loginEmail || '').trim().toLowerCase();
    if (!email.includes('@')) { setAuthError('Enter a valid email'); return; }
    setMagicSending(true);
    try {
      const res = await fetch(API + '/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not send link');
      setMagicSent(true);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setMagicSending(false);
    }
  };

  const acceptConsent = async () => {
    try {
      await authFetch('/social/consent/accept', { method: 'POST' });
      setConsented(true);
      const f = await authFetch('/social/friends/list');
      setFriends(f.friends || []);
      setIncoming(f.incoming || []);
    } catch (e) { alert(e.message); }
  };

  const sendMessage = async () => {
    const body = composeText.trim();
    if (!body || !activeFriend) return;
    try {
      await authFetch('/social/messages/send', {
        method: 'POST',
        body: JSON.stringify({ to_user_id: activeFriend.id, body }),
      });
      setComposeText('');
      // Refresh immediately
      const r = await authFetch(`/social/messages/thread/${activeFriend.id}`);
      setMessages(r.messages || []);
    } catch (e) { alert(e.message); }
  };

  const addFriend = async () => {
    const email = addEmail.trim().toLowerCase();
    if (!email.includes('@')) { setAddStatus({ ok: false, msg: 'Enter a valid email' }); return; }
    try {
      await authFetch('/social/friends/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setAddStatus({ ok: true, msg: `Request sent to ${email}` });
      setAddEmail('');
      const f = await authFetch('/social/friends/list');
      setFriends(f.friends || []);
    } catch (e) { setAddStatus({ ok: false, msg: e.message }); }
  };

  const respond = async (friendship_id, action) => {
    try {
      await authFetch('/social/friends/respond', {
        method: 'POST',
        body: JSON.stringify({ friendship_id, action }),
      });
      const f = await authFetch('/social/friends/list');
      setFriends(f.friends || []);
      setIncoming(f.incoming || []);
    } catch (e) { alert(e.message); }
  };

  const logout = () => {
    localStorage.removeItem('bsa_token');
    localStorage.removeItem('bsa_user');
    setMe(null);
    setFriends([]);
    setIncoming([]);
    setActiveFriend(null);
    setMessages([]);
  };

  // ── Render ──────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        aria-label="Friends chat"
        onClick={() => setOpen(true)}
        style={s.bubble}
      >
        {/* White chat-bubble glyph with a thin dark stroke so it stays
            visible on bright backgrounds where the fill would vanish. */}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H12l-4.2 3.5a.6.6 0 0 1-1-.46V16H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
            fill="#fff"
            stroke="#1a1a2e"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
        {unread > 0 && (
          <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
    );
  }

  return (
    <div style={s.panel}>
      <div style={s.panelHeader}>
        <div style={{ fontWeight: 700 }}>Friends</div>
        <button onClick={() => { setOpen(false); setActiveFriend(null); }} style={s.closeBtn}>✕</button>
      </div>

      {!hasToken ? (
        <div style={s.panelBody}>
          {magicSent ? (
            <>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f5132', marginBottom: '10px' }}>
                Check your email ✉️
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#333' }}>
                We sent a link to:<br/>
                <code style={{ background: '#f0f0f0', padding: '3px 8px', borderRadius: '4px', fontSize: '13px', wordBreak: 'break-all' }}>{loginEmail.trim().toLowerCase()}</code>
              </p>
              <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#333', marginTop: '12px' }}>
                Open your email. Tap the big <strong>Sign In</strong> button. You're done.
              </p>
              <p style={{ fontSize: '13px', lineHeight: '1.45', color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 10px', marginTop: '10px' }}>
                <strong>Don't see it?</strong> Check your spam or junk folder — the link sometimes lands there.
              </p>
              <p style={{ ...s.muted, fontSize: '12px', marginTop: '10px' }}>
                Link works for 10 minutes. Open it on this same phone.
              </p>
              <button
                style={{ ...s.primaryBtn, background: '#e5e7eb', color: '#333', marginTop: '14px' }}
                onClick={() => { setMagicSent(false); setLoginEmail(''); }}
              >
                Wrong email? Start over
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
                Step 1 — sign you in
              </div>
              <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.5', marginBottom: '10px' }}>
                Type <strong>YOUR</strong> email. (Not your friend's.) We'll email you a link to tap.
              </p>
              <form onSubmit={handleMagicLink}>
                <input style={s.input} type="email" placeholder="your own email here" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoFocus autoComplete="email" />
                {authError && <div style={s.errorBox}>{authError}</div>}
                <button type="submit" style={s.primaryBtn} disabled={magicSending}>
                  {magicSending ? 'Sending…' : 'Email me my link'}
                </button>
              </form>
              <p style={{ ...s.muted, fontSize: '12px', marginTop: '12px', lineHeight: '1.5' }}>
                No password. No payment. New here? We'll make you an account.
              </p>
            </>
          )}
        </div>
      ) : !consented ? (
        <div style={s.panelBody}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>
            One last thing
          </div>
          <div style={{ fontSize: '14px', lineHeight: '1.55', color: '#333', background: '#f8f9fa', padding: '14px', borderRadius: '8px', margin: '4px 0 12px' }}>
            A coach may read your chats to keep things safe.<br/>
            Be kind. Only message friends.
          </div>
          <button style={s.primaryBtn} onClick={acceptConsent}>Got it — let me chat</button>
        </div>
      ) : activeFriend ? (
        // THREAD VIEW
        <>
          <div style={s.threadHeader}>
            <button onClick={() => { setActiveFriend(null); setMessages([]); }} style={s.backBtn}>←</button>
            <div style={{ fontWeight: 700 }}>{activeFriend.first_name} {activeFriend.last_name}</div>
          </div>
          <div style={s.thread} ref={scrollRef}>
            {messages.length === 0 ? (
              <div style={{ ...s.muted, textAlign: 'center', padding: '20px' }}>Say something 💪</div>
            ) : messages.map((m) => {
              const mine = me && m.from_user_id === me.id;
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '6px' }}>
                  <div style={{
                    ...s.bubble_msg,
                    background: mine ? 'linear-gradient(135deg, #B37602, #8a5b00)' : '#f0f0f0',
                    color: mine ? '#fff' : '#222',
                    borderBottomRightRadius: mine ? '4px' : '14px',
                    borderBottomLeftRadius: mine ? '14px' : '4px',
                  }}>
                    {m.body}
                    <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '3px', textAlign: 'right' }}>{timeAgo(m.sent_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={s.composer}>
            <input
              type="text"
              style={s.composeInput}
              placeholder="Message…"
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              maxLength={2000}
            />
            <button onClick={sendMessage} style={s.sendBtn} disabled={!composeText.trim()}>➤</button>
          </div>
        </>
      ) : (
        // FRIENDS LIST VIEW
        <div style={s.panelBody}>
          {incoming.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={s.sectionLabel}>Friend Requests</div>
              {incoming.map((f) => (
                <div key={f.friendship_id} style={s.friendRow}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{f.first_name} {f.last_name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{f.email}</div>
                  </div>
                  <div>
                    <button onClick={() => respond(f.friendship_id, 'accept')} style={{ ...s.smallBtn, background: '#16a34a', color: '#fff', marginRight: '4px' }}>Accept</button>
                    <button onClick={() => respond(f.friendship_id, 'decline')} style={{ ...s.smallBtn, background: '#e5e7eb', color: '#333' }}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={s.sectionLabel}>Step 2 — Add a friend</div>
          <p style={{ fontSize: '13px', color: '#555', margin: '2px 0 8px', lineHeight: 1.4 }}>
            Type <strong>your friend's</strong> email. They'll get a message. They say yes or no.
          </p>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
            <input style={{ ...s.input, margin: 0 }} type="email" placeholder="your friend's email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
            <button onClick={addFriend} style={s.primaryBtn_sm}>Send</button>
          </div>
          {addStatus && (
            <div style={{ fontSize: '12px', color: addStatus.ok ? '#16a34a' : '#991b1b', marginBottom: '12px' }}>{addStatus.msg}</div>
          )}

          <div style={{ ...s.sectionLabel, marginTop: '12px' }}>Your friends ({friends.length})</div>
          {friends.length === 0 ? (
            <div style={{ ...s.muted, textAlign: 'center', padding: '16px 0' }}>No friends yet. Add one above 👆</div>
          ) : friends.map((f) => (
            <button key={f.id} onClick={() => setActiveFriend(f)} style={s.friendBtn}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>{f.first_name} {f.last_name}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{f.email}</div>
                </div>
                {f.unread > 0 && (
                  <span style={s.unreadChip}>{f.unread}</span>
                )}
              </div>
            </button>
          ))}

          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <button onClick={logout} style={{ ...s.smallBtn, background: 'transparent', color: '#888' }}>Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const s = {
  bubble: {
    // Sit well below the program header so the "📺 Cast to TV" pill is never
    // covered. Keep it reachable on all screen sizes without going bottom-right
    // (that corner is owned by the Cast status pill when active).
    //
    // Glassy "water drop" look — translucent fisheye dome. Radial gradient
    // fakes the highlight of a bubble; backdrop-filter blurs whatever is
    // behind it so you get that see-through glass effect.
    position: 'fixed', top: '88px', right: '14px', zIndex: 999,
    width: '54px', height: '54px', borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 38%, rgba(255,255,255,0.05) 70%, rgba(0,0,0,0.12) 100%)',
    backdropFilter: 'blur(14px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(14px) saturate(1.6)',
    color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 18px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -6px 12px rgba(0,0,0,0.12)',
    padding: 0,
  },
  badge: {
    position: 'absolute', top: '-4px', right: '-4px',
    background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: '700',
    padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center',
    border: '2px solid #fff',
  },
  panel: {
    position: 'fixed', top: '88px', right: '14px', zIndex: 999,
    width: '360px', maxWidth: 'calc(100vw - 28px)',
    height: '520px', maxHeight: 'calc(100vh - 28px)',
    background: '#fff', borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  panelHeader: {
    padding: '14px 16px', background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' },
  panelBody: { padding: '14px 16px', flex: 1, overflow: 'auto' },
  muted: { fontSize: '13px', color: '#666', marginBottom: '8px' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
    border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
    marginBottom: '8px', outline: 'none',
  },
  primaryBtn: {
    width: '100%', padding: '10px', border: 'none', borderRadius: '8px',
    background: 'linear-gradient(135deg, #B37602, #8a5b00)', color: '#fff',
    fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  primaryBtn_sm: {
    padding: '10px 14px', border: 'none', borderRadius: '8px',
    background: 'linear-gradient(135deg, #B37602, #8a5b00)', color: '#fff',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  smallBtn: { padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  errorBox: { background: '#fee2e2', color: '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '6px' },
  sectionLabel: { fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  friendRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f3f3' },
  friendBtn: {
    width: '100%', textAlign: 'left', padding: '10px 12px', border: '1px solid #e5e7eb',
    background: '#fff', borderRadius: '10px', cursor: 'pointer', marginBottom: '6px',
  },
  unreadChip: {
    background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: '700',
    padding: '2px 8px', borderRadius: '10px', minWidth: '20px', textAlign: 'center',
  },
  threadHeader: {
    padding: '10px 14px', borderBottom: '1px solid #f0f0f0',
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  backBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' },
  thread: { flex: 1, overflow: 'auto', padding: '12px 14px', background: '#fafbfd' },
  bubble_msg: {
    maxWidth: '76%', padding: '8px 12px', borderRadius: '14px',
    fontSize: '13px', lineHeight: '1.4', wordBreak: 'break-word',
  },
  composer: {
    padding: '10px', borderTop: '1px solid #f0f0f0',
    display: 'flex', gap: '6px', alignItems: 'center',
  },
  composeInput: {
    flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '20px',
    fontSize: '14px', outline: 'none',
  },
  sendBtn: {
    width: '38px', height: '38px', borderRadius: '50%', border: 'none',
    background: 'linear-gradient(135deg, #B37602, #8a5b00)', color: '#fff',
    fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  link: { color: '#B37602', textDecoration: 'underline' },
};
