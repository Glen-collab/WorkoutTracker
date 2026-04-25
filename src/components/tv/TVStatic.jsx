import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// ── Unit-safe formatter ──
// Some older programs stored units inside the value field ("60s each side",
// "100 M", "2min", "10 reps"). Blindly appending durationUnit produced garbage
// like "60s each side min" on screen. Rule: if the value already contains any
// letter, trust the user and display as-is — otherwise append the unit arg.
function formatValueWithUnit(value, unit, fallback) {
  if (value === null || value === undefined || value === '') return '';
  const s = String(value).trim();
  if (/[a-zA-Z]/.test(s)) return s;
  return `${s} ${unit || fallback}`;
}
import { QRCodeSVG } from 'qrcode.react';
import { getBlockTypeName, getBlockIcon, get1RM, calculateWeight } from '../../utils/trackerHelpers';
import { applyExerciseDefaults } from '../../data/exerciseDefaults';

const API_BASE = 'https://app.bestrongagain.com/api/workout/';

// ── Helper: format sets/reps for an exercise ──
function formatExercise(exercise) {
  const ex = applyExerciseDefaults(exercise);
  const sets = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 0);
  // Check all places reps could be stored
  const reps = ex.repsPerSet?.[0] || ex.reps
    || (Array.isArray(ex.sets) && ex.sets.length > 0 && typeof ex.sets[0] === 'object' ? (ex.sets[0].reps || ex.sets[0].targetReps || '') : '')
    || '';
  const duration = formatValueWithUnit(ex.duration, ex.durationUnit, 'min');
  const distance = formatValueWithUnit(ex.distance, ex.distanceUnit, 'mi');
  const qualifier = ex.qualifier || '';

  let detail = '';
  if (sets > 0 && reps) detail = `${sets}x${reps}`;
  else if (reps) detail = `x${reps}`;
  else if (sets > 0 && duration) detail = `${sets}x ${duration}`;
  else if (duration) detail = duration;
  else if (distance) detail = distance;

  if (qualifier && detail) detail += ` ${qualifier}`;
  else if (qualifier) detail = qualifier;

  return { name: ex.name, detail, notes: ex.notes || '' };
}

// ── Code Entry ──
function StaticCodeEntry({ onLoad }) {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!code || code.length !== 4) { setError('Enter a 4-digit access code'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_BASE + 'load-program.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email: email || 'tv-display@bestrongagain.com' }),
      });
      const data = await res.json();
      if (data.success && data.data?.program) {
        onLoad({ code, data: data.data });
      } else {
        setError('Invalid code.');
      }
    } catch {
      setError('Network error.');
    }
    setLoading(false);
  };

  return (
    <div style={s.landing}>
      <div style={s.landingCard}>
        <h1 style={s.landingTitle}>Static TV Display</h1>
        <p style={s.landingSubtitle}>Enter access code to show workout</p>
        <input
          type="text" inputMode="numeric" maxLength={4} placeholder="Code"
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={s.codeInput} autoFocus
        />
        <input
          type="email" placeholder="Email (optional)" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ ...s.codeInput, fontSize: '20px', letterSpacing: 'normal' }}
        />
        {error && <div style={{ color: '#ef5350', fontSize: '16px', marginBottom: '12px' }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={s.connectBtn}>
          {loading ? 'Loading...' : 'Display Workout'}
        </button>
      </div>
    </div>
  );
}

// ── Single Day Column ──
// fontScale > 1 zooms everything (text, spacing, icons) proportionally — used for
// WOD Only mode where we have more horizontal real estate and bigger is better.
// scrollRef lets the parent scroll this column independently via remote keys.
function DayColumn({ blocks, dayLabel, userName, maxes, fontScale = 1, scrollRef = null }) {
  const columnStyle = fontScale !== 1
    ? { ...s.dayColumn, zoom: fontScale }   // Chromium-native zoom; scales the whole subtree
    : s.dayColumn;
  if (!blocks || blocks.length === 0) {
    return (
      <div ref={scrollRef} style={columnStyle}>
        <div style={s.dayHeader}>{dayLabel}</div>
        <div style={{ ...s.exerciseRow, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No workout data</div>
      </div>
    );
  }

  const rows = [];

  blocks.forEach((block, bi) => {
    if (block.type === 'theme') return; // skip theme in static view

    const isInline = ['warmup', 'cooldown', 'mobility', 'movement'].includes(block.type);
    const typeName = getBlockTypeName(block.type);

    if (isInline) {
      // Compact inline row
      const exList = (block.exercises || []).map(ex => {
        const f = formatExercise(ex);
        return f.detail ? `${f.name} ${f.detail}` : f.name;
      }).join(', ');
      rows.push(
        <div key={`${bi}-inline`} style={s.sectionRow}>
          <span style={s.sectionLabel}>{getBlockIcon(block.type)} {typeName}:</span>
          <span style={s.sectionText}>{exList}</span>
        </div>
      );
    } else {
      // Thin divider between blocks (skip before first block — dayHeader separates it)
      if (bi > 0) {
        rows.push(<div key={`${bi}-divider`} style={s.blockDivider} />);
      }
      // Only render a visible label when it's a circuit with a type (AMRAP/EMOM/Tabata)
      // — that info actually changes how the block is performed. Plain supersets/trisets
      // don't need a title since the rows already speak for themselves.
      if (block.circuitType) {
        rows.push(
          <div key={`${bi}-circuit`} style={s.circuitTag}>
            <span style={s.circuitBadge}>{block.circuitType.toUpperCase()}</span>
          </div>
        );
      }

      // Exercise rows
      (block.exercises || []).forEach((exercise, ei) => {
        const f = formatExercise(exercise);
        rows.push(
          <div key={`${bi}-${ei}`} style={s.exerciseRow}>
            <span style={s.exName}>{f.name}</span>
            <span style={s.exDetail}>{f.detail}</span>
          </div>
        );
      });
    }
  });

  return (
    <div ref={scrollRef} style={columnStyle}>
      <div style={s.dayHeader}>{dayLabel}</div>
      {rows}
    </div>
  );
}

// ── Main Static TV ──
export default function TVStatic() {
  const [program, setProgram] = useState(null);
  const [userName, setUserName] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [startDay, setStartDay] = useState(1);
  const [maxes, setMaxes] = useState({});
  const [code, setCode] = useState('');
  const [allBlocks, setAllBlocks] = useState({});
  const [autoLoadError, setAutoLoadError] = useState(null);
  // TV layout: 'two_day' (default), 'wod' (single fullwidth), 'wod_scaled' (Rx + Scaled)
  const [layout, setLayout] = useState('two_day');

  // Coach branding — gym_name, logo_data (base64), primary + accent hex colors.
  // Fetched from /tv-config; falls back to BSA defaults when any field is null.
  const [brand, setBrand] = useState(null);

  // Full-screen brand takeover that fires every 15 min for 3s.
  // Doubles as burn-in mitigation (rearranges bright/dark pixels on schedule)
  // and reinforces the gym's identity for anyone walking by.
  // Brand flash disabled on /tv/static: the Pi Zero 2 W can't afford the
  // memory churn from animating a 60vw inline base64 logo, and the timing
  // collided with Chromium's auto-restart cycle. Re-enable on Pi 4 by
  // flipping FLASH_ENABLED back to true.
  const FLASH_ENABLED = false;
  const [showLogoFlash, setShowLogoFlash] = useState(false);
  useEffect(() => {
    if (!FLASH_ENABLED) return;
    if (!program) return;
    const hasContent = !!(brand?.logo_data || brand?.gym_name);
    if (!hasContent) return;

    const FLASH_DURATION_MS = 3_000;
    const FLASH_INTERVAL_MS = 15 * 60 * 1000;
    const FIRST_FLASH_DELAY_MS = 30_000;

    const triggerFlash = () => {
      setShowLogoFlash(true);
      setTimeout(() => setShowLogoFlash(false), FLASH_DURATION_MS);
    };
    let intervalId;
    const firstTimer = setTimeout(() => {
      triggerFlash();
      intervalId = setInterval(triggerFlash, FLASH_INTERVAL_MS);
    }, FIRST_FLASH_DELAY_MS);
    return () => {
      clearTimeout(firstTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [program, brand]);

  // Refs for per-column scrolling via remote (Flirc-mapped keys).
  // j/k → left column down/up, n/m → right column down/up.
  // In WOD (single-column) mode, all four keys scroll that lone column.
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);
  useEffect(() => {
    const SCROLL_STEP = 120; // px per press — comfortable for remote use
    const onKey = (e) => {
      const left = leftColRef.current;
      const right = rightColRef.current;
      const sole = left || right; // in WOD single-col mode, only one ref is set
      switch (e.key) {
        case 'j': (left || sole)?.scrollBy({ top:  SCROLL_STEP, behavior: 'smooth' }); break;
        case 'k': (left || sole)?.scrollBy({ top: -SCROLL_STEP, behavior: 'smooth' }); break;
        case 'n': (right || sole)?.scrollBy({ top:  SCROLL_STEP, behavior: 'smooth' }); break;
        case 'm': (right || sole)?.scrollBy({ top: -SCROLL_STEP, behavior: 'smooth' }); break;
        default: return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLoad = useCallback(async (info) => {
    const { data } = info;
    setCode(info.code);
    setProgram(data.program);
    setUserName(data.program?.userName || '');
    setCurrentWeek(data.userPosition?.currentWeek || 1);
    setStartDay(data.userPosition?.currentDay || 1);
    setMaxes({
      bench: parseFloat(data.userPosition?.oneRmBench) || 0,
      squat: parseFloat(data.userPosition?.oneRmSquat) || 0,
      deadlift: parseFloat(data.userPosition?.oneRmDeadlift) || 0,
      clean: parseFloat(data.userPosition?.oneRmClean) || 0,
    });

    // Load day 1 blocks from the initial response
    const week = data.userPosition?.currentWeek || 1;
    const day = data.userPosition?.currentDay || 1;
    const blocks1 = data.program?.blocks || [];
    const newAllBlocks = { [`${week}-${day}`]: blocks1 };

    // Load the next day too
    let day2 = day + 1;
    let week2 = week;
    const dpw = data.program?.daysPerWeek || 3;
    if (day2 > dpw) { day2 = 1; week2 = week + 1; }
    const tw = data.program?.totalWeeks || 4;
    if (week2 <= tw) {
      try {
        const res2 = await fetch(API_BASE + 'load-program.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: info.code, email: 'tv-display@bestrongagain.com',
            requested_week: week2, requested_day: day2,
          }),
        });
        const data2 = await res2.json();
        if (data2.success && data2.data?.program?.blocks) {
          newAllBlocks[`${week2}-${day2}`] = data2.data.program.blocks;
        }
      } catch { /* show what we have */ }
    }

    setAllBlocks(newAllBlocks);
  }, []);

  // Navigate weeks
  const navigateWeek = useCallback(async (dir) => {
    const dpw = program?.daysPerWeek || 3;
    const tw = program?.totalWeeks || 4;
    const newWeek = currentWeek + dir;
    if (newWeek < 1 || newWeek > tw) return;

    setCurrentWeek(newWeek);
    setStartDay(1);

    const newBlocks = {};
    // Load day 1 and day 2 for the new week
    for (let d = 1; d <= Math.min(2, dpw); d++) {
      try {
        const res = await fetch(API_BASE + 'load-program.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code, email: 'tv-display@bestrongagain.com',
            requested_week: newWeek, requested_day: d,
          }),
        });
        const data = await res.json();
        if (data.success && data.data?.program?.blocks) {
          newBlocks[`${newWeek}-${d}`] = data.data.program.blocks;
        }
      } catch { /* skip */ }
    }
    setAllBlocks(newBlocks);
  }, [code, currentWeek, program]);

  // Navigate days within the week
  const navigateDays = useCallback(async (dir) => {
    const dpw = program?.daysPerWeek || 3;
    const tw = program?.totalWeeks || 4;
    let newStart = startDay + (dir * 2); // shift by 2 since we show 2 days
    let newWeek = currentWeek;

    if (newStart > dpw) { newStart = 1; newWeek++; }
    if (newStart < 1) { newWeek--; newStart = Math.max(1, dpw - 1); }
    if (newWeek < 1 || newWeek > tw) return;

    setCurrentWeek(newWeek);
    setStartDay(newStart);

    const newBlocks = {};
    for (let d = newStart; d <= Math.min(newStart + 1, dpw); d++) {
      try {
        const res = await fetch(API_BASE + 'load-program.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code, email: 'tv-display@bestrongagain.com',
            requested_week: newWeek, requested_day: d,
          }),
        });
        const data = await res.json();
        if (data.success && data.data?.program?.blocks) {
          newBlocks[`${newWeek}-${d}`] = data.data.program.blocks;
        }
      } catch { /* skip */ }
    }
    setAllBlocks(newBlocks);
  }, [code, currentWeek, startDay, program]);

  // Keyboard shortcuts — any remote/keyboard device that sends key events drives
  // navigation. Works with CEC, Flirc USB IR receivers, or a plugged-in keyboard.
  //   Arrow Left/Right   = back/forward 2 days (same as ▶▶)
  //   Shift + Arrow L/R  = back/forward by week (same as ▶)
  useEffect(() => {
    const onKey = (e) => {
      if (!program) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        e.shiftKey ? navigateWeek(1) : navigateDays(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        e.shiftKey ? navigateWeek(-1) : navigateDays(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [program, navigateWeek, navigateDays]);

  // Auto-load workout from URL param ?code=XXXX (Pi boots with a fixed code)
  // OR ?pi=<coach_user_id> (Pi boots tied to a coach — page polls the coach's
  // "active program" and switches when they change it from their Gym TV page).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = (params.get('code') || '').trim();
    const piId = (params.get('pi') || '').trim();
    const coachCode = (params.get('coach') || '').trim().toUpperCase();

    // Fixed-code mode (legacy): load once.
    if (!program && /^\d{4}$/.test(urlCode)) {
      (async () => {
        try {
          const res = await fetch(API_BASE + 'load-program.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: urlCode, email: 'tv-display@bestrongagain.com' }),
          });
          const data = await res.json();
          if (data.success && data.data?.program) {
            handleLoad({ code: urlCode, data: data.data });
          } else {
            setAutoLoadError(`Access code ${urlCode} not found`);
          }
        } catch {
          setAutoLoadError('Network error loading workout');
        }
      })();
      return;
    }

    // Pi-controlled mode: poll coach's active program every minute.
    // Identity comes from either ?pi=<uuid> (legacy) or ?coach=<referral_code>
    // (universal SD — customer enters their coach's code in the setup portal).
    if (!piId && !coachCode) return;
    // Device identity. The Pi passes its CPU serial as ?device=...
    // A plain smart-TV browser has no hardware serial, so we mint a
    // stable per-browser UUID the first time this page is loaded and
    // keep it in localStorage. Each of the gym's 4 TVs then becomes its
    // own row in coach_devices and the coach can name/program each one
    // independently from /gym-tv.
    let deviceSerial = (params.get('device') || '').trim();
    if (!deviceSerial) {
      try {
        const KEY = 'bsa_tv_device_id';
        deviceSerial = localStorage.getItem(KEY) || '';
        if (!deviceSerial) {
          const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'tv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
          deviceSerial = 'tv-' + rand;
          localStorage.setItem(KEY, deviceSerial);
        }
      } catch { /* localStorage blocked — device stays unregistered; still works but can't be renamed */ }
    }
    let cancelled = false;
    const MEDIA_BASE = 'https://app.bestrongagain.com/api/kiosk/';
    const idParam = coachCode
      ? `coach=${encodeURIComponent(coachCode)}`
      : `pi=${encodeURIComponent(piId)}`;

    const checkConfig = async () => {
      try {
        const deviceParam = deviceSerial ? `&device=${encodeURIComponent(deviceSerial)}` : '';
        const r = await fetch(`${MEDIA_BASE}tv-config?${idParam}${deviceParam}`);
        if (!r.ok) return;
        const data = await r.json();
        if (cancelled) return;
        // Keep layout in sync with what the coach picked on their dashboard
        const serverLayout = data?.device?.layout || 'two_day';
        setLayout((prev) => (prev === serverLayout ? prev : serverLayout));
        // Pick up coach branding (logo / colors / gym name)
        // Only keep brand fields we actually render here (gym name + colors).
        // Drop logo_data — TVStatic no longer paints a logo (flash disabled,
        // top bar already dropped), so holding the 113KB blob in React state
        // is pure memory cost on the Pi Zero 2 W.
        if (data?.brand) {
          const next = {
            primary:  data.brand.primary  || null,
            accent:   data.brand.accent   || null,
            gym_name: data.brand.gym_name || null,
          };
          setBrand((prev) => {
            const same = prev
              && prev.primary  === next.primary
              && prev.accent   === next.accent
              && prev.gym_name === next.gym_name;
            return same ? prev : next;
          });
        }
        const serverCode = data?.active?.access_code;
        // If coach has no active program, show nothing / idle screen
        if (!serverCode) {
          if (program) { setProgram(null); setAllBlocks({}); setCode(''); }
          return;
        }
        // If already showing this code, nothing to do
        if (code === serverCode) return;
        // Code changed — load the new program
        const res = await fetch(API_BASE + 'load-program.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: serverCode, email: 'tv-display@bestrongagain.com' }),
        });
        const d = await res.json();
        if (d.success && d.data?.program && !cancelled) {
          handleLoad({ code: serverCode, data: d.data });
        }
      } catch { /* network hiccup — try again next tick */ }
    };

    checkConfig();
    const iv = setInterval(checkConfig, 60_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [program, handleLoad, code]);

  if (!program) {
    // If we're in Pi-controlled mode (?pi=), show an idle screen instead of the
    // manual code-entry form — the coach picks a program from their dashboard.
    const params = new URLSearchParams(window.location.search);
    const piId = (params.get('pi') || '').trim();
    const coachCode = (params.get('coach') || '').trim().toUpperCase();
    if (piId || coachCode) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: 'center', padding: '24px',
        }}>
          <div>
            <div style={{ fontSize: 'clamp(28px, 3vw, 56px)', fontWeight: '800', marginBottom: '14px' }}>
              Be Strong Again
            </div>
            <div style={{ fontSize: 'clamp(18px, 1.6vw, 28px)', color: 'rgba(255,255,255,0.75)', marginBottom: '10px' }}>
              Gym TV ready
            </div>
            <div style={{ fontSize: 'clamp(14px, 1.2vw, 20px)', color: 'rgba(255,255,255,0.5)' }}>
              Waiting for your coach to pick today's workout…
            </div>
          </div>
        </div>
      );
    }
    return (
      <>
        <StaticCodeEntry onLoad={handleLoad} />
        {autoLoadError && (
          <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#fee2e2', color: '#991b1b', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}>
            {autoLoadError}
          </div>
        )}
      </>
    );
  }

  // Coach code from URL, surfaced in the footer for gym/brand attribution
  const coachFooterCode = (new URLSearchParams(window.location.search).get('coach') || '').trim();

  const dpw = program?.daysPerWeek || 3;
  const tw = program?.totalWeeks || 4;
  const day1 = startDay;
  const day2 = startDay + 1 <= dpw ? startDay + 1 : null;

  const blocks1 = allBlocks[`${currentWeek}-${day1}`] || [];
  const blocks2 = day2 ? (allBlocks[`${currentWeek}-${day2}`] || []) : null;

  // Branding — use coach's values when set, otherwise BSA defaults
  const brandPrimary = brand?.primary || '#667eea';
  const brandAccent  = brand?.accent  || '#764ba2';
  const brandGradient = `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})`;

  return (
    <div style={{ ...s.container, '--brand-gradient': brandGradient }}>
      {/* CSS keyframes for the brand takeover fade-in/out */}
      <style>{`
        @keyframes bsa-brand-flash {
          0%   { opacity: 0; transform: scale(0.98); }
          15%  { opacity: 1; transform: scale(1); }
          85%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.02); }
        }
      `}</style>
      {/* Brand takeover every 15 min — burn-in protection + identity reinforcement */}
      {showLogoFlash && (
        <div style={{ ...s.brandFlash, background: brandGradient }}>
          {brand?.logo_data && (
            <img src={brand.logo_data} alt="" style={s.brandFlashLogo} />
          )}
          {brand?.gym_name && (
            <div style={s.brandFlashName}>{brand.gym_name}</div>
          )}
        </div>
      )}
      {/* Header bar — logo is removed from the persistent header (it only
          appears during the 15-minute brand flash takeover). Gym name stays
          on the title but at a smaller size, so the workout info wins the
          real estate and the name still reads. */}
      <div style={s.topBar}>
        <div style={s.topBarLeft}>
          <h1 style={s.programTitle}>
            {brand?.gym_name ? `${brand.gym_name} — ` : ''}{program?.name || 'Workout'}
          </h1>
          <InlineQR code={code} />
        </div>
        <div style={s.topBarRight}>
          <button onClick={() => navigateWeek(-1)} style={{ ...s.navBtn, opacity: currentWeek <= 1 ? 0.3 : 1 }} disabled={currentWeek <= 1}>{'\u25C0'}</button>
          <span style={s.weekLabel}>Week {currentWeek}/{tw}</span>
          <button onClick={() => navigateWeek(1)} style={{ ...s.navBtn, opacity: currentWeek >= tw ? 0.3 : 1 }} disabled={currentWeek >= tw}>{'\u25B6'}</button>
          <span style={{ width: '20px' }} />
          <button onClick={() => navigateDays(-1)} style={s.navBtn}>{'\u25C0\u25C0'}</button>
          <span style={s.dayLabel}>Days {day1}{day2 ? `-${day2}` : ''}</span>
          <button onClick={() => navigateDays(1)} style={s.navBtn}>{'\u25B6\u25B6'}</button>
        </div>
      </div>

      {/* Column layout — branches on coach's selected view mode */}
      <div style={s.columnsContainer}>
        {layout === 'wod' ? (
          // Single column, centered with max-width so text doesn't stretch edge-to-edge
          // on a 1920px TV. `fontScale` bumps text ~30% bigger since we have the real estate.
          <div style={s.wodCenterWrap}>
            <DayColumn
              blocks={blocks1}
              dayLabel={`Today's WOD — Week ${currentWeek}, Day ${day1}`}
              userName={userName}
              maxes={maxes}
              fontScale={1.3}
              scrollRef={leftColRef}
            />
          </div>
        ) : layout === 'wod_scaled' ? (
          // Two columns: Day 1 = Rx/WOD, Day 2 = Scaled regression
          <>
            <DayColumn
              blocks={blocks1}
              dayLabel={`Rx / WOD — Week ${currentWeek}, Day ${day1}`}
              userName={userName}
              maxes={maxes}
              scrollRef={leftColRef}
            />
            {blocks2 !== null && (
              <DayColumn
                blocks={blocks2}
                dayLabel={`Scaled — Week ${currentWeek}, Day ${day2}`}
                userName={userName}
                maxes={maxes}
                scrollRef={rightColRef}
              />
            )}
          </>
        ) : (
          // Default two_day: today + tomorrow side-by-side
          <>
            <DayColumn
              blocks={blocks1}
              dayLabel={`Week ${currentWeek} — Day ${day1}`}
              userName={userName}
              maxes={maxes}
              scrollRef={leftColRef}
            />
            {blocks2 !== null && (
              <DayColumn
                blocks={blocks2}
                dayLabel={`Week ${currentWeek} — Day ${day2}`}
                userName={userName}
                maxes={maxes}
                scrollRef={rightColRef}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span>Code: {code}{coachFooterCode && ` · Coach: ${coachFooterCode}`}</span>
        <button onClick={() => { setProgram(null); setAllBlocks({}); }} style={s.exitBtn}>Exit</button>
      </div>
    </div>
  );
}

// ── Inline QR (lives in the header bar next to program title) ────────
// Small QR badge — phone cameras can easily pick it up even at this size.
function InlineQR({ code }) {
  const { qrUrl } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const coach = (params.get('coach') || '').trim();
    const q = new URLSearchParams();
    if (code) q.set('code', code);
    if (coach) q.set('coach', coach);
    return { qrUrl: `https://bestrongagain.netlify.app/?${q.toString()}` };
  }, [code]);

  return (
    <div style={qs.inline}>
      <div style={qs.inlineQrBox}>
        <QRCodeSVG value={qrUrl} size={56} bgColor="#ffffff" fgColor="#0a0a1a" level="M" />
      </div>
      <div style={qs.inlineLabel}>Scan to track</div>
    </div>
  );
}

const qs = {
  // Inline (next to program title in header)
  inline: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '4px 10px', background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
  },
  inlineQrBox: { background: '#fff', padding: '4px', borderRadius: '6px', lineHeight: 0 },
  inlineLabel: {
    fontSize: 'clamp(11px, 0.9vw, 16px)', fontWeight: '600',
    color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap',
  },
};

// ── Styles ──
const s = {
  // Landing
  landing: {
    minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  landingCard: {
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', borderRadius: '24px',
    padding: '50px 70px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)',
    maxWidth: '500px', width: '100%',
  },
  landingTitle: { fontSize: '36px', fontWeight: '800', color: '#fff', margin: '0 0 8px' },
  landingSubtitle: { fontSize: '16px', color: 'rgba(255,255,255,0.6)', margin: '0 0 30px' },
  codeInput: {
    display: 'block', width: '100%', boxSizing: 'border-box', padding: '16px',
    fontSize: '28px', fontWeight: '700', textAlign: 'center', letterSpacing: '10px',
    border: '2px solid rgba(255,255,255,0.2)', borderRadius: '14px',
    background: 'rgba(255,255,255,0.08)', color: '#fff', outline: 'none', marginBottom: '12px',
  },
  connectBtn: {
    width: '100%', padding: '16px', fontSize: '18px', fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
    border: 'none', borderRadius: '12px', cursor: 'pointer',
  },

  // Main container
  container: {
    height: '100vh', background: '#0a0a1a', color: '#fff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: 'flex', flexDirection: 'column',
    padding: '8px 16px', boxSizing: 'border-box', overflow: 'hidden',
    cursor: 'none',  // hide labwc's mouse pointer on the gym TV — TV viewers don't have a mouse
  },

  // Top bar
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '8px', flexShrink: 0,
  },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  programTitle: { fontSize: 'clamp(16px, 1.8vw, 32px)', fontWeight: '700', margin: 0, color: '#fff', letterSpacing: '0.2px' },
  userBadge: {
    background: 'rgba(102,126,234,0.3)', border: '1px solid rgba(102,126,234,0.5)',
    borderRadius: '22px', padding: '6px 18px', fontSize: 'clamp(15px, 1.5vw, 26px)',
    fontWeight: '600', color: '#b8c6ff',
  },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  navBtn: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', borderRadius: '10px', padding: '10px 16px',
    fontSize: 'clamp(20px, 1.9vw, 34px)', fontWeight: '700', cursor: 'pointer',
  },
  weekLabel: {
    fontSize: 'clamp(18px, 1.7vw, 30px)', fontWeight: '600',
    color: 'rgba(255,255,255,0.85)', minWidth: '140px', textAlign: 'center',
  },
  dayLabel: {
    fontSize: 'clamp(16px, 1.5vw, 26px)', fontWeight: '600',
    color: 'rgba(255,255,255,0.7)', minWidth: '110px', textAlign: 'center',
  },

  // Two columns (or single, in WOD mode)
  columnsContainer: {
    flex: 1, display: 'flex', gap: '14px', overflow: 'hidden',
    justifyContent: 'center',   // centers single-column WOD layout on 1920px TVs
  },
  // Wraps the single day column in WOD mode so it doesn't stretch edge-to-edge.
  // Max-width caps line length for readability; flex:1 + maxWidth together
  // gives "grow to fit, but don't spread past this" behavior.
  wodCenterWrap: {
    flex: '1 1 auto',
    maxWidth: '1200px',
    display: 'flex',
    minHeight: 0,  // needed so children overflow: auto actually scrolls inside flex
  },
  dayColumn: {
    flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)', overflow: 'auto',
    display: 'flex', flexDirection: 'column',
  },
  dayHeader: {
    background: 'var(--brand-gradient, linear-gradient(135deg, #667eea, #764ba2))',
    padding: '6px 14px', fontSize: 'clamp(14px, 1.4vw, 24px)', fontWeight: '700',
    color: '#fff', textAlign: 'center', flexShrink: 0, letterSpacing: '0.3px',
  },
  // Coach logo next to program title
  brandLogo: {
    height: 'clamp(32px, 3.5vh, 56px)', width: 'auto', objectFit: 'contain',
    borderRadius: '6px',
  },

  // Full-screen brand takeover (fires every 15 min for 3s).
  // pointerEvents:'none' so even if React state gets stuck (Pi Zero 2 W
  // has been observed to delay setTimeout callbacks under load), the
  // invisible-after-animation overlay never blocks the workout below it.
  brandFlash: {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '36px',
    animation: 'bsa-brand-flash 3s ease-in-out forwards',
    pointerEvents: 'none',
  },
  brandFlashLogo: {
    maxWidth: '60vw', maxHeight: '60vh', objectFit: 'contain',
    filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.35))',
  },
  brandFlashName: {
    color: '#fff', fontSize: 'clamp(36px, 6vw, 96px)', fontWeight: 900,
    letterSpacing: '0.5px', textShadow: '0 6px 30px rgba(0,0,0,0.35)',
    textAlign: 'center', padding: '0 40px',
  },

  // Theme row
  themeRow: {
    padding: '8px 16px', fontSize: 'clamp(14px, 1.3vw, 22px)', lineHeight: '1.35',
    color: 'rgba(255,255,255,0.55)', fontStyle: 'italic',
    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },

  // Section row (warmup/cooldown inline)
  sectionRow: {
    padding: '8px 16px', fontSize: 'clamp(16px, 1.5vw, 26px)', lineHeight: '1.4',
    color: 'rgba(255,255,255,0.8)',
    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },
  sectionLabel: { fontWeight: '700', color: '#fff', marginRight: '8px' },
  sectionText: { color: 'rgba(255,255,255,0.7)' },

  // Block header — deprecated (kept for reference). Current design uses blockDivider.
  blockHeaderRow: {
    padding: '10px 16px', fontSize: 'clamp(18px, 1.7vw, 30px)', fontWeight: '700',
    color: '#b8c6ff', background: 'rgba(102,126,234,0.18)',
    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  // Thin line between blocks — replaces the old full-width header row
  blockDivider: {
    height: '1px', background: 'rgba(255,255,255,0.6)', margin: '6px 12px',
    flexShrink: 0,
  },
  // Compact badge row — only shown when a block has a circuit type (AMRAP/EMOM/Tabata)
  circuitTag: {
    padding: '4px 16px', flexShrink: 0,
  },
  circuitBadge: {
    background: 'rgba(255,193,7,0.25)', color: '#ffd54f', borderRadius: '6px',
    padding: '3px 10px', fontSize: 'clamp(12px, 1vw, 18px)',
    fontWeight: '700', letterSpacing: '0.5px', marginLeft: 'auto',
  },

  // Exercise row
  exerciseRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '9px 20px 9px 30px',
    fontSize: 'clamp(18px, 1.75vw, 32px)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    minHeight: 'clamp(36px, 2.7vw, 56px)', flexShrink: 0,
  },
  exName: { color: '#fff', fontWeight: '500', flex: 1 },
  exDetail: {
    color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginLeft: '8px',
    whiteSpace: 'nowrap', textAlign: 'right',
  },

  // Footer
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 0', fontSize: 'clamp(12px, 1vw, 16px)',
    color: 'rgba(255,255,255,0.4)',
    borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },
  exitBtn: {
    background: 'rgba(239,83,80,0.15)', border: '1px solid rgba(239,83,80,0.3)',
    color: '#ef5350', borderRadius: '6px', padding: '3px 12px',
    fontSize: '11px', fontWeight: '600', cursor: 'pointer',
  },
};
