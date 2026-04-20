import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  const duration = ex.duration ? `${ex.duration} ${ex.durationUnit || 'min'}` : '';
  const distance = ex.distance ? `${ex.distance} ${ex.distanceUnit || 'mi'}` : '';
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
function DayColumn({ blocks, dayLabel, userName, maxes }) {
  if (!blocks || blocks.length === 0) {
    return (
      <div style={s.dayColumn}>
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
      // Block header
      rows.push(
        <div key={`${bi}-header`} style={s.blockHeaderRow}>
          {getBlockIcon(block.type)} {typeName}
          {block.circuitType && <span style={s.circuitBadge}>{block.circuitType.toUpperCase()}</span>}
        </div>
      );

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
    <div style={s.dayColumn}>
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

  if (!program) return <StaticCodeEntry onLoad={handleLoad} />;

  const dpw = program?.daysPerWeek || 3;
  const tw = program?.totalWeeks || 4;
  const day1 = startDay;
  const day2 = startDay + 1 <= dpw ? startDay + 1 : null;

  const blocks1 = allBlocks[`${currentWeek}-${day1}`] || [];
  const blocks2 = day2 ? (allBlocks[`${currentWeek}-${day2}`] || []) : null;

  return (
    <div style={s.container}>
      {/* Header bar */}
      <div style={s.topBar}>
        <div style={s.topBarLeft}>
          <h1 style={s.programTitle}>{program?.name || 'Workout'}</h1>
          <span style={s.userBadge}>{userName || 'Athlete'}</span>
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

      {/* Two-column layout */}
      <div style={s.columnsContainer}>
        <DayColumn
          blocks={blocks1}
          dayLabel={`Week ${currentWeek} — Day ${day1}`}
          userName={userName}
          maxes={maxes}
        />
        {blocks2 !== null && (
          <DayColumn
            blocks={blocks2}
            dayLabel={`Week ${currentWeek} — Day ${day2}`}
            userName={userName}
            maxes={maxes}
          />
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span>Code: {code}</span>
        <button onClick={() => { setProgram(null); setAllBlocks({}); }} style={s.exitBtn}>Exit</button>
      </div>

      {/* QR code corner — scan to open this workout on phone (auto-signs up under the gym's coach if new) */}
      <QRCorner code={code} />
    </div>
  );
}

// ── QR Corner ─────────────────────────────────────────────────────────
// Encodes a URL so clients in the gym can scan to open this workout on their phone.
// Coach referral code is read from the /tv/static URL (?coach=GLENM7NUS) so each
// Pi-powered gym TV can be configured to attribute sign-ups to its owning coach.
function QRCorner({ code }) {
  const { qrUrl, coachCode } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const coach = (params.get('coach') || '').trim();
    // Priority URL: tracker with the workout code pre-filled, plus coach attribution.
    // New users landing here will be prompted for email; coach code stored for future
    // sign-up attribution.
    const base = 'https://bestrongagain.netlify.app/';
    const q = new URLSearchParams();
    if (code) q.set('code', code);
    if (coach) q.set('coach', coach);
    return { qrUrl: `${base}?${q.toString()}`, coachCode: coach };
  }, [code]);

  return (
    <div style={qs.wrap}>
      <div style={qs.title}>Scan to track on your phone</div>
      <div style={qs.qrBox}>
        <QRCodeSVG value={qrUrl} size={140} bgColor="#ffffff" fgColor="#0a0a1a" level="M" />
      </div>
      {coachCode && <div style={qs.coachLine}>Coach: {coachCode}</div>}
    </div>
  );
}

const qs = {
  wrap: {
    position: 'fixed', right: '16px', bottom: '40px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px', padding: '10px', textAlign: 'center',
    backdropFilter: 'blur(10px)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    zIndex: 50,
  },
  title: { color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '600', marginBottom: '6px', letterSpacing: '0.3px' },
  qrBox: { background: '#fff', padding: '8px', borderRadius: '8px', display: 'inline-block' },
  coachLine: { color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: '600', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
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
  },

  // Top bar
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '6px', flexShrink: 0,
  },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  programTitle: { fontSize: 'clamp(18px, 2.5vw, 28px)', fontWeight: '800', margin: 0, color: '#fff' },
  userBadge: {
    background: 'rgba(102,126,234,0.3)', border: '1px solid rgba(102,126,234,0.5)',
    borderRadius: '16px', padding: '4px 12px', fontSize: '14px', fontWeight: '600', color: '#b8c6ff',
  },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '6px' },
  navBtn: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', borderRadius: '8px', padding: '4px 10px', fontSize: '16px',
    fontWeight: '700', cursor: 'pointer',
  },
  weekLabel: { fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', minWidth: '90px', textAlign: 'center' },
  dayLabel: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', minWidth: '70px', textAlign: 'center' },

  // Two columns
  columnsContainer: {
    flex: 1, display: 'flex', gap: '12px', overflow: 'hidden',
  },
  dayColumn: {
    flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)', overflow: 'auto',
    display: 'flex', flexDirection: 'column',
  },
  dayHeader: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: '8px 14px', fontSize: '16px', fontWeight: '700', color: '#fff',
    textAlign: 'center', flexShrink: 0,
  },

  // Theme row
  themeRow: {
    padding: '4px 12px', fontSize: '11px', lineHeight: '1.3',
    color: 'rgba(255,255,255,0.5)', fontStyle: 'italic',
    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },

  // Section row (warmup/cooldown inline)
  sectionRow: {
    padding: '4px 12px', fontSize: '12px', lineHeight: '1.4',
    color: 'rgba(255,255,255,0.6)',
    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },
  sectionLabel: { fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginRight: '6px' },
  sectionText: { color: 'rgba(255,255,255,0.5)' },

  // Block header
  blockHeaderRow: {
    padding: '5px 12px', fontSize: '14px', fontWeight: '700',
    color: '#b8c6ff', background: 'rgba(102,126,234,0.1)',
    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: '6px',
  },
  circuitBadge: {
    background: 'rgba(255,193,7,0.2)', color: '#ffd54f', borderRadius: '4px',
    padding: '1px 6px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', marginLeft: 'auto',
  },

  // Exercise row
  exerciseRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '3px 12px 3px 20px', fontSize: '13px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    minHeight: '22px', flexShrink: 0,
  },
  exName: { color: '#fff', fontWeight: '500', flex: 1 },
  exDetail: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginLeft: '8px', whiteSpace: 'nowrap', textAlign: 'right' },

  // Footer
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)',
    borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },
  exitBtn: {
    background: 'rgba(239,83,80,0.15)', border: '1px solid rgba(239,83,80,0.3)',
    color: '#ef5350', borderRadius: '6px', padding: '3px 12px',
    fontSize: '11px', fontWeight: '600', cursor: 'pointer',
  },
};
