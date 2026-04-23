// CastTVDisplay.jsx
// "/cast" route — shown on the user's smart TV browser. On mount it asks the
// backend for a fresh 4-digit pair code, displays that code HUGE, and polls
// every 2s for the phone to push a workout. Once bound, it swaps to a
// full-screen workout view with inline autoplaying videos per exercise.

import React, { useEffect, useState, useRef } from 'react';

const API_BASE = 'https://app.bestrongagain.com/api/cast';
const WORKOUT_API = window.gwtConfig?.apiBase || 'https://app.bestrongagain.com/api/workout/';

// ── Styles (inline for zero-CSS-conflict) ──
const s = {
  pairWrap: {
    minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    color: '#fff', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '2vh 3vw',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  brand: {
    fontSize: 'clamp(18px, 2vw, 32px)', fontWeight: 800, letterSpacing: '4px',
    color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: '2vh',
  },
  prompt: {
    fontSize: 'clamp(28px, 3.5vw, 56px)', fontWeight: 900, textAlign: 'center',
    background: 'linear-gradient(135deg, #ffd200, #ff9a3c)',
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
    marginBottom: '4vh', lineHeight: 1.1,
  },
  codeWrap: {
    display: 'flex', gap: '2vw', marginBottom: '4vh',
  },
  codeDigit: {
    fontSize: 'clamp(120px, 16vw, 240px)', fontWeight: 900, color: '#fff',
    background: 'rgba(255,255,255,0.08)', border: '3px solid rgba(255,255,255,0.2)',
    borderRadius: '16px', padding: '0.5vh 3vw', minWidth: '12vw', textAlign: 'center',
    fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,210,0,0.05)',
    lineHeight: 1,
  },
  hint: {
    fontSize: 'clamp(18px, 1.8vw, 28px)', color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 1.5, maxWidth: '80vw',
  },
  hintStrong: { color: '#ffd200', fontWeight: 700 },
  footer: {
    position: 'fixed', bottom: '2vh', left: 0, right: 0, textAlign: 'center',
    fontSize: '12px', letterSpacing: 1, color: 'rgba(255,255,255,0.3)',
  },
  spinner: {
    width: 18, height: 18, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#ff9a3c',
    animation: 'bsa-spin 0.9s linear infinite',
    display: 'inline-block', marginRight: 8, verticalAlign: 'middle',
  },

  // Workout view styles — the OUTER shell is 100vh with overflow hidden,
  // and a scrollable inner container handles all scrolling. This matches
  // TVScreen.jsx (the /tv URL) which scrolls reliably on Amazon Silk even
  // though programmatic window.scrollTo does not. See comment in the
  // `nav_direction` effect below.
  wkShell: {
    height: '100vh', width: '100vw', overflow: 'hidden',
    background: '#0f0c29', color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  wkScroller: {
    height: '100vh', overflowY: 'auto', overflowX: 'hidden',
    padding: '2vh 3vw 75vh',
    WebkitOverflowScrolling: 'touch',
  },
  wkHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: '1.5vh', borderBottom: '2px solid rgba(255,255,255,0.15)',
    marginBottom: '2vh', flexWrap: 'wrap', gap: '10px',
  },
  wkTitle: {
    fontSize: 'clamp(22px, 2.5vw, 40px)', fontWeight: 900, letterSpacing: '0.3px',
  },
  wkMeta: { fontSize: 'clamp(14px, 1.3vw, 22px)', color: 'rgba(255,255,255,0.6)' },
  blockCard: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px', padding: '2vh 2vw', marginBottom: '2vh',
    transition: 'background 250ms ease, box-shadow 250ms ease, transform 250ms ease, border-color 250ms ease',
  },
  blockCardActive: {
    background: 'linear-gradient(135deg, rgba(255,210,0,0.18), rgba(255,154,60,0.12))',
    borderColor: 'rgba(255,210,0,0.55)',
    boxShadow: '0 0 0 2px rgba(255,210,0,0.45), 0 12px 40px rgba(0,0,0,0.35)',
    transform: 'scale(1.01)',
  },
  blockType: {
    fontSize: 'clamp(14px, 1.2vw, 20px)', fontWeight: 800, color: '#ffd200',
    textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1vh',
  },
  // BIG-TEXT list (no video thumbnails — phone is the remote, videos go full-screen on demand)
  exRow: {
    display: 'flex', gap: '3vw', alignItems: 'baseline', flexWrap: 'wrap',
    padding: '2vh 0', borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  exRowFirst: { borderTop: 'none' },
  exName: { fontSize: 'clamp(26px, 3vw, 48px)', fontWeight: 800, lineHeight: 1.15, flex: 1 },
  exDetail: { fontSize: 'clamp(24px, 2.6vw, 42px)', color: '#ffd200', fontWeight: 800, flex: '0 0 auto', textAlign: 'right', whiteSpace: 'nowrap' },
  exNotes: { fontSize: 'clamp(16px, 1.4vw, 22px)', color: 'rgba(255,255,255,0.55)', marginTop: '0.6vh', lineHeight: 1.35, width: '100%' },

  // FULL-SCREEN video overlay (shown when phone beams a specific exercise)
  videoOverlay: {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: '#000', display: 'flex', flexDirection: 'column',
  },
  videoHeader: {
    padding: '2vh 3vw', background: 'linear-gradient(180deg, rgba(0,0,0,0.85), rgba(0,0,0,0))',
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
  },
  videoTitle: {
    fontSize: 'clamp(32px, 3.2vw, 52px)', fontWeight: 900, color: '#fff', lineHeight: 1.1,
    textShadow: '0 2px 10px rgba(0,0,0,0.6)',
  },
  videoDetail: {
    fontSize: 'clamp(22px, 2.2vw, 36px)', color: '#ffd200', fontWeight: 800,
    marginTop: '0.5vh', textShadow: '0 2px 8px rgba(0,0,0,0.6)',
  },
  videoHint: {
    position: 'absolute', bottom: '2vh', left: 0, right: 0, textAlign: 'center',
    color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(14px, 1.3vw, 22px)',
    letterSpacing: 1, zIndex: 2, textShadow: '0 2px 6px rgba(0,0,0,0.8)',
  },
  videoIframe: {
    position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0,
  },
};

// One-time inject of keyframes
if (typeof document !== 'undefined' && !document.getElementById('bsa-cast-kf')) {
  const el = document.createElement('style');
  el.id = 'bsa-cast-kf';
  el.textContent = '@keyframes bsa-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(el);
}

// ── Formatter that mirrors the fix in TVScreen/TVStatic — avoid "60s each side min" ──
function formatValue(value, unit, fallback) {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value).trim();
  if (/[a-zA-Z]/.test(str)) return str;
  return `${str} ${unit || fallback}`;
}
function formatSetsReps(ex) {
  const sets = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 0);
  const reps = ex.reps || (Array.isArray(ex.sets) && ex.sets[0]?.reps) || '';
  const duration = formatValue(ex.duration, ex.durationUnit, 'min');
  const distance = formatValue(ex.distance, ex.distanceUnit, 'mi');
  const qualifier = ex.qualifier || '';
  let detail = '';
  if (reps) detail = sets > 0 ? `${sets} × ${reps}` : `× ${reps}`;
  else if (duration) detail = sets > 0 ? `${sets} × ${duration}` : duration;
  else if (distance) detail = sets > 0 ? `${sets} × ${distance}` : distance;
  return qualifier && detail ? `${detail} ${qualifier}` : (detail || qualifier);
}

// Big-text-only row — no video thumbnails. Phone beams videos full-screen via /play.
function ExerciseRow({ ex, first }) {
  const detail = formatSetsReps(ex);
  return (
    <div style={{ ...s.exRow, ...(first ? s.exRowFirst : {}) }}>
      <div style={s.exName}>{ex.name}</div>
      {detail && <div style={s.exDetail}>{detail}</div>}
      {ex.notes && <div style={s.exNotes}>{ex.notes}</div>}
    </div>
  );
}

// Full-screen video overlay when the phone has beamed a specific exercise.
function FullScreenExerciseVideo({ ex }) {
  const detail = formatSetsReps(ex);
  const url = ex.youtube
    ? `${ex.youtube}?autoplay=true&muted=true&controls=true&preload=auto`
    : null;
  return (
    <div style={s.videoOverlay}>
      {url && (
        <iframe
          src={url}
          style={s.videoIframe}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          title={ex.name}
        />
      )}
      <div style={s.videoHeader}>
        <div style={s.videoTitle}>{ex.name}</div>
        {detail && <div style={s.videoDetail}>{detail}</div>}
      </div>
      <div style={s.videoHint}>Tap 📹 on your phone again to return</div>
    </div>
  );
}

export default function CastTVDisplay() {
  const [pairCode, setPairCode] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const pairCodeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(API_BASE + '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const d = await r.json();
        if (!d.success) throw new Error(d.message || 'Could not get a pairing code');
        if (cancelled) return;
        setPairCode(d.pair_code);
        pairCodeRef.current = d.pair_code;
        pollRef.current = setInterval(async () => {
          try {
            const pr = await fetch(`${API_BASE}/poll/${d.pair_code}`);
            const pd = await pr.json();
            if (pd.bound) {
              clearInterval(pollRef.current);
              setSession(pd);
            } else if (pd.expired) {
              clearInterval(pollRef.current);
              setError('Pairing code expired — refresh this page to get a new one.');
            }
          } catch {}
        }, 2000);
      } catch (e) {
        setError(e.message || 'Network error');
      }
    })();
    return () => { cancelled = true; if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (session) return <CastedWorkout session={session} pairCode={pairCode} />;

  return (
    <div style={s.pairWrap}>
      <div style={s.brand}>Be Strong Again</div>
      <div style={s.prompt}>Cast your workout to this TV</div>
      {pairCode ? (
        <>
          <div style={s.codeWrap} aria-label={`Pairing code ${pairCode.split('').join(' ')}`}>
            {pairCode.split('').map((d, i) => <div key={i} style={s.codeDigit}>{d}</div>)}
          </div>
          <div style={s.hint}>
            On your phone, open the Workout Tracker → tap <span style={s.hintStrong}>Cast to TV</span> → enter the code above.
          </div>
        </>
      ) : (
        <div style={s.hint}><span style={s.spinner}></span>Getting a pairing code…</div>
      )}
      {error && <div style={{ ...s.hint, color: '#ffb4b4', marginTop: '3vh' }}>{error}</div>}
      <div style={s.footer}>bestrongagain.netlify.app/cast</div>
    </div>
  );
}

// ── Loads the program and renders today's workout full-screen ──
function CastedWorkout({ session, pairCode }) {
  const [program, setProgram] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    // If program_data was pushed directly (richer), use it. Otherwise fall back to load-program.php.
    if (session.program_data) {
      setProgram(session.program_data);
      return;
    }
    if (!session.access_code) { setErr('No workout found'); return; }
    (async () => {
      try {
        const r = await fetch(WORKOUT_API + 'load-program.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: session.access_code,
            email: session.user_email || 'cast-viewer@bestrongagain.com',
            name: session.user_name || 'Cast Viewer',
          }),
        });
        const d = await r.json();
        if (d?.success && d.data?.program) setProgram(d.data.program);
        else setErr('Workout not found');
      } catch {
        setErr('Network error loading workout');
      }
    })();
  }, [session]);

  // Poll every 1s for nav events + playing_exercise (phone-as-remote).
  const [playingExercise, setPlayingExercise] = useState(null);
  const lastNavUpdatedRef = useRef(null);
  const scrollerRef = useRef(null);
  useEffect(() => {
    if (!program || !pairCode) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(`${API_BASE}/poll/${pairCode}`);
        const d = await r.json();
        if (cancelled) return;
        if (d.expired) { window.location.reload(); return; }
        // Full-screen video override (phone taps 📹 on an exercise)
        const nextPlaying = d.playing_exercise || null;
        setPlayingExercise((prev) => {
          // Only re-set if content changed (so React doesn't churn the iframe)
          const prevName = prev?.name || null;
          const nextName = nextPlaying?.name || null;
          if (prevName !== nextName) return nextPlaying;
          return prev;
        });
        // Phone ▲▼ → scrollBy on the inner container. Amazon Silk ignores
        // programmatic window.scrollTo/scrollBy, but it DOES respect scroll
        // calls on a plain div with overflow:auto (same trick used by
        // TVScreen.jsx which also ships over Silk).
        if (!nextPlaying && d.nav_updated_at && d.nav_updated_at !== lastNavUpdatedRef.current) {
          lastNavUpdatedRef.current = d.nav_updated_at;
          const dir = d.nav_direction === 'prev' ? -1 : 1;
          const step = Math.round((scrollerRef.current?.clientHeight || window.innerHeight || 720) * 0.75);
          if (scrollerRef.current && typeof scrollerRef.current.scrollBy === 'function') {
            try { scrollerRef.current.scrollBy({ top: step * dir, behavior: 'smooth' }); } catch {}
          } else if (scrollerRef.current) {
            scrollerRef.current.scrollTop += step * dir;
          }
        }
      } catch {}
    };
    const iv = setInterval(tick, 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [program, pairCode]);

  const wk = session.week || 1;
  const day = session.day || 1;
  // Prefer the keyed allWorkouts lookup (it honors the week/day the phone
  // pushed), and only fall back to `program.blocks` when no map is returned
  // — `program.blocks` from load-program.php reflects the *server-side*
  // current day, which isn't necessarily the day the user is casting.
  const allMap = program?.allWorkouts || program?.program_data?.allWorkouts;
  const blocks = (allMap && allMap[`${wk}-${day}`])
    || program?.blocks
    || [];

  if (err) return <div style={s.pairWrap}><div style={s.hint}>{err}</div></div>;
  if (!program) return <div style={s.pairWrap}><div style={s.hint}><span style={s.spinner}></span>Loading your workout…</div></div>;

  return (
    <>
      <div style={s.wkShell}>
        <div ref={scrollerRef} style={s.wkScroller}>
          <div style={s.wkHeader}>
            <div style={s.wkTitle}>{program.name || program.programName || 'Your Workout'}</div>
            <div style={s.wkMeta}>
              Week {wk} · Day {day}{session.user_name ? ` · ${session.user_name}` : ''}
            </div>
          </div>
          {blocks.length === 0 && <div style={s.hint}>No exercises found for this day.</div>}
          {blocks.map((block, bi) => (
            <div key={block.id || bi} style={s.blockCard}>
              <div style={s.blockType}>
                {(block.type || 'Block').replace(/-/g, ' ')}
                {block.circuitType ? ` · ${block.circuitType}` : ''}
              </div>
              {(block.exercises || []).map((ex, ei) => (
                <ExerciseRow key={ei} ex={ex} first={ei === 0} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {playingExercise && <FullScreenExerciseVideo ex={playingExercise} />}
    </>
  );
}
