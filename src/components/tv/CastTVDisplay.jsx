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

  // Two-day whiteboard layout — gym-wall view with two columns side by
  // side. Matches the sizing of TVStatic.jsx (the Pi-kiosk view) so a
  // TV-across-the-room user can read it clearly. Each column scrolls
  // independently but the ▲▼ remote scrolls both in unison.
  twoDayShell: {
    height: '100vh', width: '100vw',
    background: '#0f0c29', color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  twoDayHeader: {
    padding: '8px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0, gap: 12, flexWrap: 'wrap',
  },
  twoDayProgramTitle: {
    fontSize: 'clamp(24px, 3vw, 56px)', fontWeight: 800, margin: 0, color: '#fff',
  },
  twoDayProgramMeta: {
    color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px, 1.3vw, 22px)',
  },
  twoDayBrandLogo: {
    height: 'clamp(32px, 3.5vh, 56px)', width: 'auto', objectFit: 'contain',
    borderRadius: '6px', flexShrink: 0,
  },
  twoDayCols: {
    flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '12px', padding: '8px 12px 12px',
    minHeight: 0,
  },
  twoDayCol: {
    minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    display: 'flex', flexDirection: 'column',
    WebkitOverflowScrolling: 'touch',
  },
  twoDayColHeader: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: '12px 18px', fontSize: 'clamp(20px, 2vw, 36px)', fontWeight: 800,
    color: '#fff', textAlign: 'center', flexShrink: 0, letterSpacing: '0.3px',
  },
  twoDayColBody: {
    overflowY: 'auto', overflowX: 'hidden', flex: 1,
    padding: '4px 0 40vh',  // bottom padding so last section can scroll into view
  },
  twoDayBlockDivider: {
    height: '1px', background: 'rgba(255,255,255,0.4)', margin: '6px 12px', flexShrink: 0,
  },
  twoDayCircuitTag: {
    padding: '4px 16px', flexShrink: 0,
  },
  twoDayCircuitBadge: {
    display: 'inline-block',
    background: 'rgba(255,193,7,0.25)', color: '#ffd54f', borderRadius: '6px',
    padding: '3px 10px', fontSize: 'clamp(12px, 1vw, 18px)',
    fontWeight: 700, letterSpacing: '0.5px',
  },
  twoDayExRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '9px 20px 9px 30px',
    fontSize: 'clamp(18px, 1.75vw, 32px)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    flexShrink: 0, gap: '12px',
  },
  twoDayExName: { color: '#fff', fontWeight: 500, flex: 1 },
  twoDayExDetail: {
    color: 'rgba(255,255,255,0.7)', fontWeight: 700,
    whiteSpace: 'nowrap', textAlign: 'right',
  },
  twoDayColEmpty: {
    padding: '24px 18px', color: 'rgba(255,255,255,0.55)',
    fontSize: 'clamp(16px, 1.5vw, 26px)', lineHeight: 1.4,
    textAlign: 'center',
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
// Rowing / running / ski erg in the builder usually don't set distanceUnit
// explicitly — the tracker falls back to 'm' for Conditioning blocks. Use
// the same heuristic DailyTonnage.jsx does: a big number (>=100) without a
// unit is meters, anything smaller is miles. Prevents "400 mi" showing on
// the TV when the builder said "400 m".
function distanceFallback(raw) {
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 100 ? 'm' : 'mi';
}
function formatSetsReps(ex) {
  const sets = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 0);
  const reps = ex.reps || (Array.isArray(ex.sets) && ex.sets[0]?.reps) || '';
  const duration = formatValue(ex.duration, ex.durationUnit, 'min');
  const distance = formatValue(ex.distance, ex.distanceUnit, distanceFallback(ex.distance));
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
    // Fast path: paint the pushed program_data immediately so the TV doesn't
    // sit on a spinner while the backend fetch is in flight.
    if (session.program_data) setProgram(session.program_data);

    // Always also fetch from load-program.php — the phone only pushes the
    // *current* day's blocks, and the two-day whiteboard needs allWorkouts
    // for day+1. Merging the two gives fast first paint plus the full map.
    if (!session.access_code) {
      if (!session.program_data) setErr('No workout found');
      return;
    }
    (async () => {
      try {
        const r = await fetch(WORKOUT_API + 'load-program.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: session.access_code,
            email: session.user_email || 'cast-viewer@bestrongagain.com',
            name: session.user_name || 'Cast Viewer',
            requested_week: session.week,
            requested_day: session.day,
          }),
        });
        const d = await r.json();
        if (d?.success && d.data?.program) {
          // Merge the server's full program (with allWorkouts) on top of
          // whatever the phone pushed — server wins on anything it has.
          setProgram((prev) => ({ ...(prev || {}), ...d.data.program }));
        } else if (!session.program_data) {
          setErr('Workout not found');
        }
      } catch {
        if (!session.program_data) setErr('Network error loading workout');
      }
    })();
  }, [session]);

  // Poll every 1s for nav events + playing_exercise + layout (phone-as-remote).
  const [playingExercise, setPlayingExercise] = useState(null);
  const [layout, setLayoutState] = useState(session.layout || 'one_day');
  const [brand, setBrand] = useState(session.brand || null);
  const lastNavUpdatedRef = useRef(null);
  const scrollerRef = useRef(null);       // one_day scroller
  const leftColRef  = useRef(null);       // two_day left column
  const rightColRef = useRef(null);       // two_day right column
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
        // Layout flip (phone toggled one_day ↔ two_day mid-cast)
        if (d.layout && d.layout !== layout) setLayoutState(d.layout);
        // Brand — set once, keep only if changed so we don't thrash React
        if (d.brand) {
          setBrand((prev) => {
            const same = prev
              && prev.primary === d.brand.primary
              && prev.accent === d.brand.accent
              && prev.gym_name === d.brand.gym_name
              && prev.logo_data === d.brand.logo_data;
            return same ? prev : d.brand;
          });
        }
        // Phone ▲▼ → scrollBy on the active container(s). Amazon Silk
        // ignores programmatic window.scrollTo/scrollBy, but it DOES
        // respect scroll calls on a plain div with overflow:auto (same
        // trick used by TVScreen.jsx which also ships over Silk). In
        // two-day mode we scroll BOTH columns so they stay aligned.
        if (!nextPlaying && d.nav_updated_at && d.nav_updated_at !== lastNavUpdatedRef.current) {
          lastNavUpdatedRef.current = d.nav_updated_at;
          const dir = d.nav_direction === 'prev' ? -1 : 1;
          const targets = [scrollerRef.current, leftColRef.current, rightColRef.current].filter(Boolean);
          targets.forEach(el => {
            const step = Math.round((el.clientHeight || window.innerHeight || 720) * 0.75);
            if (typeof el.scrollBy === 'function') {
              try { el.scrollBy({ top: step * dir, behavior: 'smooth' }); } catch {}
            } else {
              el.scrollTop += step * dir;
            }
          });
        }
      } catch {}
    };
    const iv = setInterval(tick, 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [program, pairCode, layout]);

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

  // Two-day whiteboard: right column is *always* day + 1 in the same week.
  // If that key doesn't exist (we've rolled past the end of the program's
  // week), fall back to "{week+1}-1" so a 4-day-program casting Day 4
  // still shows a sensible next-day. Empty → the column renders a
  // "No workout for Day X" placeholder.
  const dayB = day + 1;
  const keyNextSameWeek = `${wk}-${dayB}`;
  const keyNextWeekDay1 = `${wk + 1}-1`;
  const blocksB = (allMap && (allMap[keyNextSameWeek] || allMap[keyNextWeekDay1])) || [];
  const dayBLabel = (allMap && allMap[keyNextSameWeek]) ? `Day ${dayB}` : `Week ${wk + 1} · Day 1`;

  if (err) return <div style={s.pairWrap}><div style={s.hint}>{err}</div></div>;
  if (!program) return <div style={s.pairWrap}><div style={s.hint}><span style={s.spinner}></span>Loading your workout…</div></div>;

  // Two-day whiteboard — gym wall view, two columns side by side.
  // Sizing mirrors TVStatic.jsx so reading from across the room works.
  if (layout === 'two_day') {
    const brandPrimary = brand?.primary || '#667eea';
    const brandAccent  = brand?.accent  || '#764ba2';
    const brandGym     = brand?.gym_name;
    const brandLogo    = brand?.logo_data;
    const colHeaderBg  = `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})`;
    return (
      <>
        <div style={s.twoDayShell}>
          <div style={s.twoDayHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              {brandLogo && <img src={brandLogo} alt="" style={s.twoDayBrandLogo} />}
              <h1 style={s.twoDayProgramTitle}>
                {brandGym || program.name || program.programName || 'Your Workout'}
              </h1>
            </div>
            <div style={s.twoDayProgramMeta}>
              {brandGym && (program.name || program.programName)
                ? <span>{program.name || program.programName} · </span>
                : null}
              Week {wk}{session.user_name ? ` · ${session.user_name}` : ''}
            </div>
          </div>
          <div style={s.twoDayCols}>
            <TwoDayColumn
              label={`Day ${day}`}
              blocks={blocks}
              colRef={leftColRef}
              headerBg={colHeaderBg}
            />
            <TwoDayColumn
              label={dayBLabel}
              blocks={blocksB}
              colRef={rightColRef}
              emptyMsg={`No workout built yet for ${dayBLabel}`}
              headerBg={colHeaderBg}
            />
          </div>
        </div>
        {playingExercise && <FullScreenExerciseVideo ex={playingExercise} />}
      </>
    );
  }

  // Default: one-day big-text view (phone-mirror mode).
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

// One column of the two-day whiteboard. Gradient header bar + thin
// dividers between blocks + dense exercise rows — matches TVStatic's
// kiosk sizing so the TV is legible from across the gym. The ref is on
// the scrollable body so the remote's ▲▼ can scroll this column.
function TwoDayColumn({ label, blocks, colRef, emptyMsg, headerBg }) {
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;
  const headerStyle = headerBg ? { ...s.twoDayColHeader, background: headerBg } : s.twoDayColHeader;
  return (
    <div style={s.twoDayCol}>
      <div style={headerStyle}>{label}</div>
      <div ref={colRef} style={s.twoDayColBody}>
        {!hasBlocks && (
          <div style={s.twoDayColEmpty}>{emptyMsg || 'No exercises found for this day.'}</div>
        )}
        {hasBlocks && blocks.map((block, bi) => (
          <React.Fragment key={block.id || bi}>
            {bi > 0 && <div style={s.twoDayBlockDivider} />}
            {block.circuitType && (
              <div style={s.twoDayCircuitTag}>
                <span style={s.twoDayCircuitBadge}>{block.circuitType}</span>
              </div>
            )}
            {(block.exercises || []).map((ex, ei) => {
              const detail = formatSetsReps(ex);
              return (
                <div key={ei} style={s.twoDayExRow}>
                  <span style={s.twoDayExName}>{ex.name}</span>
                  {detail && <span style={s.twoDayExDetail}>{detail}</span>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
