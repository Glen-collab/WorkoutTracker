import { useState } from 'react';

// Tiny self-contained button that lives in the ProgramHeader. On click it
// asks the platform "is this email a paying member?" — if yes, opens the
// real dashboard; if no, shows an upsell modal that pitches the $20/mo plan.
// Either way it's a soft funnel into the paid tier.

const PLATFORM_BASE = 'https://app.bestrongagain.com';
const API = PLATFORM_BASE + '/api';

const s = {
  btn: {
    padding: '7px 12px',
    borderRadius: '20px',
    border: 'none',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
  },
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
    zIndex: 9998,
  },
  modal: {
    background: '#fff',
    borderRadius: '20px',
    maxWidth: '420px',
    width: '100%',
    overflow: 'hidden',
    boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
  },
  header: {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    color: '#fff',
    padding: '24px 22px 20px',
    textAlign: 'center',
  },
  hTitle: { fontSize: '20px', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 },
  hSub: { fontSize: '13px', opacity: 0.85, margin: 0 },
  body: { padding: '18px 22px 22px' },
  bullets: { listStyle: 'none', padding: 0, margin: '0 0 18px' },
  bullet: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    fontSize: '14px', color: '#1a1a2e', padding: '4px 0',
    lineHeight: 1.4,
  },
  check: { color: '#15803d', fontWeight: 800, fontSize: '15px', flexShrink: 0 },
  primaryBtn: {
    display: 'block', width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: '#fff',
    border: 'none', borderRadius: '12px',
    fontSize: '15px', fontWeight: 800,
    cursor: 'pointer',
    textDecoration: 'none', textAlign: 'center',
    boxShadow: '0 6px 14px rgba(22,163,74,0.3)',
  },
  secondaryBtn: {
    display: 'block', width: '100%',
    padding: '11px',
    background: '#fff',
    color: '#15803d',
    border: '2px solid #16a34a',
    borderRadius: '12px',
    fontSize: '14px', fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
    textDecoration: 'none', textAlign: 'center',
  },
  closeX: {
    position: 'absolute', top: '12px', right: '14px',
    background: 'rgba(255,255,255,0.15)', color: '#fff',
    border: 'none', borderRadius: '50%',
    width: '28px', height: '28px',
    fontSize: '14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

export default function DashboardButton({ userEmail }) {
  const [busy, setBusy] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [tier, setTier] = useState(null); // 'tracker' = $5.99 gym tracker; null = free trial

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    let isMember = false;
    let userTier = null;
    try {
      const res = await fetch(`${API}/auth/check-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail || '' }),
      });
      if (res.ok) {
        const data = await res.json();
        isMember = !!data.is_member;
        userTier = data.tier || null;
      }
    } catch { /* network blip — fall through to upsell, no big deal */ }
    setBusy(false);

    if (isMember) {
      // Full members (basic/coached/elite + staff): open the real dashboard.
      // New tab so the tracker workout stays open.
      window.open(`${PLATFORM_BASE}/member`, '_blank', 'noopener');
    } else {
      // Free trial OR $5.99 tracker-only → upsell, copy tailored by tier.
      setTier(userTier);
      setShowUpsell(true);
    }
  };

  // $5.99 tracker-only subscribers vs free-trial users get different framing.
  const isTracker = tier === 'tracker';
  const planLabel = isTracker ? 'the Gym Workout Tracker' : 'the Free Tracker';

  return (
    <>
      <button onClick={handleClick} disabled={busy} style={s.btn}>
        <span>📊</span>
        <span>{busy ? '…' : 'Dashboard'}</span>
      </button>

      {showUpsell && (
        <div style={s.backdrop} onClick={() => setShowUpsell(false)}>
          <div style={{ ...s.modal, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowUpsell(false)} style={s.closeX}>×</button>
            <div style={s.header}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', opacity: 0.8, marginBottom: '6px', textTransform: 'uppercase' }}>
                You're on {planLabel}
              </div>
              <h2 style={s.hTitle}>Unlock your dashboard + Coach's notes.</h2>
              <p style={s.hSub}>
                {isTracker
                  ? 'Your $5.99 tracker logs your workouts. A membership adds the full dashboard and notes from Coach Glen.'
                  : 'Upgrade to a membership to see your dashboard and notes from Coach Glen.'}
              </p>
            </div>
            <div style={s.body}>
              <ul style={s.bullets}>
                <li style={s.bullet}><span style={s.check}>✓</span><span>Personalized weekly and monthly summaries from Coach Glen</span></li>
                <li style={s.bullet}><span style={s.check}>✓</span><span>Lifetime tonnage with milestone unlocks ("you've lifted a tank")</span></li>
                <li style={s.bullet}><span style={s.check}>✓</span><span>Weekly tonnage, calories, and cardio charts</span></li>
                <li style={s.bullet}><span style={s.check}>✓</span><span>Bodyweight trend line — smoothed, not noisy</span></li>
                <li style={s.bullet}><span style={s.check}>✓</span><span>Manage your subscription anytime — cancel in one tap</span></li>
              </ul>

              {isTracker ? (
                <a
                  href={`${PLATFORM_BASE}/login`}
                  target="_blank" rel="noopener noreferrer"
                  style={s.primaryBtn}
                >
                  Log in to upgrade →
                </a>
              ) : (
                <>
                  <a
                    href={`${PLATFORM_BASE}/register?tier=basic${userEmail ? '&email=' + encodeURIComponent(userEmail) : ''}`}
                    target="_blank" rel="noopener noreferrer"
                    style={s.primaryBtn}
                  >
                    Become a Member — $20/mo
                  </a>
                  <a
                    href={`${PLATFORM_BASE}/login`}
                    target="_blank" rel="noopener noreferrer"
                    style={s.secondaryBtn}
                  >
                    Already a member? Log in →
                  </a>
                </>
              )}

              <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', margin: '12px 0 0' }}>
                Keep getting Strong Again. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
