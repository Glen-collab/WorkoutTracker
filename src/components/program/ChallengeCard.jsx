import React, { useState, useEffect, useCallback } from 'react';

/**
 * ChallengeCard — shows the active gym challenge at the bottom of the workout.
 * Uses public (no-JWT) endpoints keyed by email.
 *
 * GET  /api/challenges/active-public?email=<email>
 * POST /api/challenges/submit-public  { email, challenge_id, value, notes }
 */

const API_BASE = 'https://app.bestrongagain.com';

export default function ChallengeCard({ userEmail }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitValue, setSubmitValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null); // { type: 'success'|'error', text }
  const [expanded, setExpanded] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);

  const fetchChallenge = useCallback(async () => {
    if (!userEmail) { setLoading(false); return; }
    try {
      const res = await fetch(
        `${API_BASE}/api/challenges/active-public?email=${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      if (data.success && data.active) {
        setChallenge(data.active);
      } else {
        setChallenge(null);
      }
    } catch {
      setChallenge(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { fetchChallenge(); }, [fetchChallenge]);

  useEffect(() => {
    if (!challenge?.id) return;
    const key = `gwt_challenge_seen_${challenge.id}`;
    if (!localStorage.getItem(key)) {
      setShowAnnounce(true);
    }
  }, [challenge?.id]);

  const handleSubmit = async () => {
    const num = parseFloat(submitValue);
    if (isNaN(num) || num <= 0) {
      setSubmitMsg({ type: 'error', text: 'Enter a valid number.' });
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/challenges/submit-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          challenge_id: challenge.id,
          value: num,
          notes: '',
        }),
      });
      if (!res.ok) throw new Error('submit failed');
      const data = await res.json();
      if (data.success) {
        setSubmitMsg({ type: 'success', text: 'Result submitted!' });
        setSubmitValue('');
        // Refresh standings after a brief moment so the server can settle
        setTimeout(() => fetchChallenge(), 600);
      } else {
        setSubmitMsg({ type: 'error', text: data.message || 'Submit failed.' });
      }
    } catch {
      setSubmitMsg({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render anything while loading or if no active challenge
  if (loading || !challenge) return null;

  const {
    title,
    description,
    unit,
    lower_is_better: lowerIsBetter,
    days_left: daysLeft,
    standings = [],
    my_rank: myRank,
    my_score: myScore,
    total_participants: totalParticipants,
  } = challenge;

  const top5 = standings.slice(0, 5);

  const dismissAnnounce = () => {
    setShowAnnounce(false);
    setExpanded(true);
    try { localStorage.setItem(`gwt_challenge_seen_${challenge.id}`, 'true'); } catch {}
  };

  return (
    <>
    {showAnnounce && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', zIndex: 9998,
      }} onClick={dismissAnnounce}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '20px', maxWidth: '400px', width: '100%',
          overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
            padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏆</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a2e' }}>New Challenge!</div>
          </div>
          <div style={{ padding: '24px 20px', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>{title}</div>
            {description && (
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: '0 0 16px' }}>{description}</p>
            )}
            <div style={{
              display: 'inline-flex', gap: '16px', background: 'rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '12px 20px', marginBottom: '20px',
            }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#fbbf24' }}>{daysLeft}</div>
                <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6 }}>DAYS</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>{unit}</div>
                <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6 }}>{lowerIsBetter ? 'LOWEST WINS' : 'HIGHEST WINS'}</div>
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '12px',
              padding: '14px 16px', marginBottom: '20px', textAlign: 'left',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>How it works</div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: '0 0 6px' }}>
                📍 Submit your score at the <b>bottom of your workout</b> in the Challenge section.
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: '0 0 6px' }}>
                🔄 Enter as many times as you want — your <b>best score counts</b>.
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>
                🌎 You're competing against <b>everyone on the app</b>. Let's see what you've got!
              </p>
            </div>
            <button
              onClick={dismissAnnounce}
              style={{
                width: '100%', padding: '14px', border: 'none', borderRadius: '14px',
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                color: '#1a1a2e', fontSize: '16px', fontWeight: 800, cursor: 'pointer',
              }}
            >
              Let's Go!
            </button>
          </div>
        </div>
      </div>
    )}
    <div style={styles.card}>
      {/* Header */}
      <div
        style={styles.header}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={styles.headerLeft}>
          <span style={styles.trophyIcon}>{'🏆'}</span>
          <div>
            <div style={styles.title}>{title}</div>
            <div style={styles.subtitle}>Gym Challenge</div>
          </div>
        </div>
        <div style={styles.badge}>
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
        </div>
      </div>

      {/* Collapsed summary — show rank if they have one */}
      {!expanded && myRank != null && (
        <div style={styles.collapsedRank}>
          You are #{myRank} of {totalParticipants} &mdash; {myScore} {unit}
        </div>
      )}

      {/* Expand chevron hint */}
      <div
        style={styles.expandHint}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '▲ Collapse' : '▼ Tap to expand'}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={styles.body}>
          {/* Description */}
          <div style={styles.description}>{description}</div>

          {/* My standing */}
          {myRank != null && (
            <div style={styles.myStanding}>
              <span style={styles.myStandingLabel}>Your Rank</span>
              <span style={styles.myStandingValue}>
                #{myRank} of {totalParticipants}
              </span>
              <span style={styles.myStandingScore}>
                Best: {myScore} {unit}
              </span>
            </div>
          )}

          {/* Leaderboard */}
          {top5.length > 0 && (
            <div style={styles.leaderboard}>
              <div style={styles.lbHeader}>Top 5</div>
              {top5.map((entry, i) => {
                const isMe =
                  myRank != null && entry.rank === myRank;
                return (
                  <div
                    key={i}
                    style={{
                      ...styles.lbRow,
                      ...(isMe ? styles.lbRowMe : {}),
                    }}
                  >
                    <span style={styles.lbRank}>
                      {entry.rank === 1
                        ? '🥇'
                        : entry.rank === 2
                        ? '🥈'
                        : entry.rank === 3
                        ? '🥉'
                        : `#${entry.rank}`}
                    </span>
                    <span style={styles.lbName}>{entry.first_name}</span>
                    <span style={styles.lbScore}>
                      {entry.score} {unit}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Submit section */}
          <div style={styles.submitSection}>
            <div style={styles.submitLabel}>Submit Your Result</div>
            <div style={styles.submitRow}>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                placeholder="0.0"
                value={submitValue}
                onChange={(e) => setSubmitValue(e.target.value)}
                style={styles.submitInput}
              />
              <span style={styles.unitLabel}>{unit}</span>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  ...styles.submitBtn,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? 'Sending...' : 'Submit'}
              </button>
            </div>
            {submitMsg && (
              <div
                style={{
                  ...styles.submitMsg,
                  color:
                    submitMsg.type === 'success' ? '#4caf50' : '#ff6b6b',
                }}
              >
                {submitMsg.text}
              </div>
            )}
          </div>

          {/* Direction hint */}
          <div style={styles.directionHint}>
            {lowerIsBetter
              ? '⬇️ Lower is better'
              : '⬆️ Higher is better'}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

/* ── Inline styles ────────────────────────────────────────────────── */

const styles = {
  card: {
    background: 'linear-gradient(135deg, #2d1b69, #1a1040)',
    border: '1px solid rgba(168, 130, 255, 0.3)',
    borderRadius: '14px',
    overflow: 'hidden',
    marginBottom: '16px',
    boxShadow: '0 4px 24px rgba(100, 60, 200, 0.25)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 6px',
    cursor: 'pointer',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  trophyIcon: {
    fontSize: '28px',
  },
  title: {
    color: '#fff',
    fontWeight: 700,
    fontSize: '15px',
    lineHeight: '1.2',
  },
  subtitle: {
    color: 'rgba(168, 130, 255, 0.8)',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '2px',
  },
  badge: {
    background: 'linear-gradient(135deg, #f5a623, #f7c948)',
    color: '#1a1040',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  },
  collapsedRank: {
    padding: '0 16px 4px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
  },
  expandHint: {
    textAlign: 'center',
    color: 'rgba(168, 130, 255, 0.6)',
    fontSize: '11px',
    padding: '6px 0 10px',
    cursor: 'pointer',
  },
  body: {
    padding: '0 16px 16px',
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    lineHeight: '1.5',
    marginBottom: '14px',
  },
  myStanding: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(168, 130, 255, 0.15)',
    border: '1px solid rgba(168, 130, 255, 0.25)',
    borderRadius: '10px',
    padding: '10px 12px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },
  myStandingLabel: {
    color: 'rgba(168, 130, 255, 0.8)',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  myStandingValue: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 700,
  },
  myStandingScore: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    marginLeft: 'auto',
  },
  leaderboard: {
    marginBottom: '14px',
  },
  lbHeader: {
    color: 'rgba(168, 130, 255, 0.7)',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  lbRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '7px 10px',
    borderRadius: '8px',
    marginBottom: '3px',
    background: 'rgba(255,255,255,0.04)',
  },
  lbRowMe: {
    background: 'rgba(168, 130, 255, 0.12)',
    border: '1px solid rgba(168, 130, 255, 0.25)',
  },
  lbRank: {
    width: '30px',
    fontSize: '14px',
    textAlign: 'center',
    flexShrink: 0,
  },
  lbName: {
    flex: 1,
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
  },
  lbScore: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    fontWeight: 600,
    textAlign: 'right',
  },
  submitSection: {
    marginBottom: '10px',
  },
  submitLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  submitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  submitInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(168, 130, 255, 0.3)',
    background: 'rgba(0,0,0,0.3)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    outline: 'none',
    minWidth: 0,
  },
  unitLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
    fontWeight: 600,
    flexShrink: 0,
  },
  submitBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #f5a623, #f7c948)',
    color: '#1a1040',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  submitMsg: {
    fontSize: '12px',
    marginTop: '6px',
    fontWeight: 600,
  },
  directionHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
  },
};
