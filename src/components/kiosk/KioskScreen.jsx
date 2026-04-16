import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getBlockTypeName, getBlockIcon, get1RM, calculateWeight } from '../../utils/trackerHelpers';

const API_BASE = 'https://app.bestrongagain.com/api/workout/';

// ── API helper ──
async function apiCall(endpoint, body) {
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await res.text();
      if (!res.ok) throw new Error('Server error: ' + res.status);
      return JSON.parse(text);
    } catch (err) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

// ── localStorage helpers ──
function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem('kiosk_config')) || null;
  } catch { return null; }
}

function saveConfig(cfg) {
  localStorage.setItem('kiosk_config', JSON.stringify(cfg));
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem('kiosk_users')) || [];
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem('kiosk_users', JSON.stringify(users));
}

function getTrackingKey(code, email, week, day) {
  return `kiosk_tracking_${code}_${email}_${week}_${day}`;
}

function loadTracking(code, email, week, day) {
  try {
    return JSON.parse(localStorage.getItem(getTrackingKey(code, email, week, day))) || {};
  } catch { return {}; }
}

function saveTracking(code, email, week, day, data) {
  try {
    localStorage.setItem(getTrackingKey(code, email, week, day), JSON.stringify(data));
  } catch {}
}

// ── Default config ──
const DEFAULT_CONFIG = {
  programs: [],
  tvAssignments: { tv1: '', tv2: '', tv3: '', tv4: '' },
  coachPin: '0000',
};

// ── Styles ──
const colors = {
  bg: '#0f0c29',
  bgLight: '#24243e',
  card: 'rgba(255,255,255,0.07)',
  cardHover: 'rgba(255,255,255,0.12)',
  accent: '#667eea',
  accentAlt: '#764ba2',
  text: '#fff',
  textDim: 'rgba(255,255,255,0.6)',
  success: '#4caf50',
  danger: '#ef5350',
  inputBg: 'rgba(255,255,255,0.1)',
  inputBorder: 'rgba(255,255,255,0.2)',
};

// ════════════════════════════════════════════════
// MAIN KIOSK COMPONENT
// ════════════════════════════════════════════════
export default function KioskScreen() {
  const [view, setView] = useState('home'); // home | program | admin
  const [config, setConfig] = useState(loadConfig() || DEFAULT_CONFIG);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programData, setProgramData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [totalWeeks, setTotalWeeks] = useState(4);
  const [trackingData, setTrackingData] = useState({});
  const [maxes, setMaxes] = useState({ bench: 0, squat: 0, deadlift: 0, clean: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [idleCountdown, setIdleCountdown] = useState(null);
  const [savingStatus, setSavingStatus] = useState(null); // 'saving' | 'saved' | 'error'

  const idleTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const IDLE_MS = 2 * 60 * 1000; // 2 minutes
  const COUNTDOWN_SEC = 10;

  // ── Idle timer ──
  const resetIdle = useCallback(() => {
    if (view === 'home' || view === 'admin') return;
    setIdleCountdown(null);
    clearTimeout(idleTimerRef.current);
    clearInterval(countdownRef.current);
    idleTimerRef.current = setTimeout(() => {
      let sec = COUNTDOWN_SEC;
      setIdleCountdown(sec);
      countdownRef.current = setInterval(() => {
        sec--;
        if (sec <= 0) {
          clearInterval(countdownRef.current);
          setIdleCountdown(null);
          goHome();
        } else {
          setIdleCountdown(sec);
        }
      }, 1000);
    }, IDLE_MS);
  }, [view]);

  const cancelIdleReturn = useCallback(() => {
    setIdleCountdown(null);
    clearInterval(countdownRef.current);
    resetIdle();
  }, [resetIdle]);

  // Listen for any interaction
  useEffect(() => {
    if (view !== 'program') return;
    const handler = () => {
      if (idleCountdown !== null) {
        cancelIdleReturn();
      } else {
        resetIdle();
      }
    };
    const events = ['touchstart', 'mousedown', 'keydown', 'input', 'scroll'];
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetIdle();
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearTimeout(idleTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [view, resetIdle, cancelIdleReturn, idleCountdown]);

  // ── Navigation ──
  const goHome = useCallback(() => {
    // Auto-save before leaving
    if (selectedProgram && currentUser && Object.keys(trackingData).length > 0) {
      saveTracking(selectedProgram.code, currentUser.email, currentWeek, currentDay, trackingData);
    }
    clearTimeout(idleTimerRef.current);
    clearInterval(countdownRef.current);
    setView('home');
    setSelectedProgram(null);
    setProgramData(null);
    setCurrentUser(null);
    setTrackingData({});
    setError(null);
    setIdleCountdown(null);
    setSavingStatus(null);
  }, [selectedProgram, currentUser, trackingData, currentWeek, currentDay]);

  // ── Load program from API ──
  const loadProgramForUser = useCallback(async (prog, user, week, day) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall('load-program.php', {
        email: user.email,
        code: prog.code,
        name: user.name,
        benchMax: 0, squatMax: 0, deadliftMax: 0, cleanMax: 0,
        ...(week ? { requested_week: week } : {}),
        ...(day ? { requested_day: day } : {}),
      });
      if (result.success && result.data?.program) {
        const p = result.data.program;
        setProgramData(p);
        if (result.data.userPosition && !week && !day) {
          setCurrentWeek(result.data.userPosition.currentWeek || 1);
          setCurrentDay(result.data.userPosition.currentDay || 1);
        }
        if (result.data.userPosition) {
          setMaxes({
            bench: parseFloat(result.data.userPosition.oneRmBench) || 0,
            squat: parseFloat(result.data.userPosition.oneRmSquat) || 0,
            deadlift: parseFloat(result.data.userPosition.oneRmDeadlift) || 0,
            clean: parseFloat(result.data.userPosition.oneRmClean) || 0,
          });
        }
        if (p.daysPerWeek) setDaysPerWeek(p.daysPerWeek);
        if (p.totalWeeks) setTotalWeeks(p.totalWeeks);
        // Restore saved workout tracking
        if (result.data.savedWorkout?.data?.blocks) {
          const restored = {};
          result.data.savedWorkout.data.blocks.forEach((block, bi) => {
            block.exercises?.forEach((ex, ei) => {
              const weights = ex.weights || [];
              const actualReps = ex.actualReps || [];
              const setsCount = typeof ex.sets === 'number' ? ex.sets : (weights.length || 1);
              for (let si = 0; si < setsCount; si++) {
                if (weights[si]) restored[`${bi}-${ei}-${si}-weight`] = weights[si];
                if (actualReps[si]) restored[`${bi}-${ei}-${si}-reps`] = actualReps[si];
              }
              if (weights.some(w => w) || actualReps.some(r => r)) {
                restored[`complete-${bi}-${ei}`] = true;
              }
            });
          });
          setTrackingData(restored);
        } else {
          // Try localStorage backup
          const w = week || result.data.userPosition?.currentWeek || 1;
          const d = day || result.data.userPosition?.currentDay || 1;
          const saved = loadTracking(prog.code, user.email, w, d);
          setTrackingData(saved);
        }
        setView('program');
      } else {
        setError(result?.message || 'Failed to load program');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Navigate day/week ──
  const navigateDay = useCallback((direction) => {
    if (!selectedProgram || !currentUser) return;
    let newWeek = currentWeek;
    let newDay = currentDay;
    if (direction === 'next') {
      if (newDay < daysPerWeek) { newDay++; }
      else if (newWeek < totalWeeks) { newWeek++; newDay = 1; }
      else return;
    } else {
      if (newDay > 1) { newDay--; }
      else if (newWeek > 1) { newWeek--; newDay = daysPerWeek; }
      else return;
    }
    setCurrentWeek(newWeek);
    setCurrentDay(newDay);
    setTrackingData({});
    loadProgramForUser(selectedProgram, currentUser, newWeek, newDay);
  }, [selectedProgram, currentUser, currentWeek, currentDay, daysPerWeek, totalWeeks, loadProgramForUser]);

  // ── Update tracking ──
  const handleUpdateTracking = useCallback((blockIndex, exIndex, setIndex, field, value) => {
    const isDirectKey = field.startsWith('rec-') || field.startsWith('complete-') || field.startsWith('block-notes-');
    const key = isDirectKey ? field : `${blockIndex}-${exIndex}-${setIndex}-${field}`;
    setTrackingData(prev => {
      const updated = { ...prev, [key]: value };
      // Auto-save to localStorage
      if (selectedProgram && currentUser) {
        saveTracking(selectedProgram.code, currentUser.email, currentWeek, currentDay, updated);
      }
      return updated;
    });
  }, [selectedProgram, currentUser, currentWeek, currentDay]);

  // ── Log workout to API ──
  const handleLogWorkout = useCallback(async () => {
    if (!programData || !currentUser || !selectedProgram) return;
    setSavingStatus('saving');
    try {
      const workoutData = {
        week: currentWeek,
        day: currentDay,
        blocks: programData.blocks?.map((block, bi) => ({
          type: block.type || 'straight-set',
          trainerNotes: block.trainerNotes || block.notes || '',
          exercises: block.exercises?.map((ex, ei) => {
            const setsCount = typeof ex.sets === 'number' ? ex.sets : parseInt(ex.sets) || 1;
            const weights = [];
            const actualReps = [];
            for (let si = 0; si < setsCount; si++) {
              weights.push(trackingData[`${bi}-${ei}-${si}-weight`] || '');
              actualReps.push(trackingData[`${bi}-${ei}-${si}-reps`] || '');
            }
            return {
              name: ex.name || 'Unknown Exercise',
              sets: setsCount,
              targetReps: ex.reps || '',
              actualReps,
              weights,
              completed: trackingData[`complete-${bi}-${ei}`] || false,
              qualifier: ex.qualifier || '',
              notes: ex.notes || '',
              actualDuration: trackingData[`${bi}-${ei}-null-duration`] || '',
              actualDistance: trackingData[`${bi}-${ei}-null-distance`] || '',
            };
          }) || [],
        })) || [],
      };

      await apiCall('log-workout.php', {
        email: currentUser.email,
        code: selectedProgram.code,
        name: currentUser.name,
        week: currentWeek,
        day: currentDay,
        workoutData,
        source: 'kiosk',
      });

      setSavingStatus('saved');
      // Clear local tracking backup after successful save
      try {
        localStorage.removeItem(getTrackingKey(selectedProgram.code, currentUser.email, currentWeek, currentDay));
      } catch {}
      setTimeout(() => setSavingStatus(null), 3000);
    } catch (err) {
      setSavingStatus('error');
      console.error('Failed to log workout:', err);
      setTimeout(() => setSavingStatus(null), 5000);
    }
  }, [programData, currentUser, selectedProgram, currentWeek, currentDay, trackingData]);

  // ── Render by view ──
  if (view === 'admin') {
    return <AdminPanel config={config} setConfig={setConfig} onClose={() => setView('home')} />;
  }

  if (view === 'program') {
    return (
      <ProgramScreen
        program={selectedProgram}
        programData={programData}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        currentWeek={currentWeek}
        currentDay={currentDay}
        daysPerWeek={daysPerWeek}
        totalWeeks={totalWeeks}
        trackingData={trackingData}
        maxes={maxes}
        onUpdateTracking={handleUpdateTracking}
        onLogWorkout={handleLogWorkout}
        onNavigateDay={navigateDay}
        onGoHome={goHome}
        loading={loading}
        savingStatus={savingStatus}
        idleCountdown={idleCountdown}
        onCancelIdle={cancelIdleReturn}
        onLoadProgram={loadProgramForUser}
        selectedProgram={selectedProgram}
      />
    );
  }

  // ── HOME SCREEN ──
  return (
    <HomeScreen
      config={config}
      loading={loading}
      error={error}
      onSelectProgram={(prog) => {
        setSelectedProgram(prog);
        setView('program');
        // Don't load yet — user needs to pick themselves first
      }}
      onOpenAdmin={() => setView('admin')}
    />
  );
}


// ════════════════════════════════════════════════
// HOME SCREEN
// ════════════════════════════════════════════════
function HomeScreen({ config, loading, error, onSelectProgram, onOpenAdmin }) {
  const programs = config?.programs?.filter(p => p.code) || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>
      {/* Title */}
      <h1 style={{
        fontSize: '42px',
        fontWeight: '800',
        color: colors.text,
        margin: '0 0 8px',
        letterSpacing: '-0.5px',
      }}>
        Be Strong Again
      </h1>
      <p style={{
        fontSize: '18px',
        color: colors.textDim,
        margin: '0 0 48px',
      }}>
        Tap your program to get started
      </p>

      {error && (
        <div style={{
          background: 'rgba(239,83,80,0.2)',
          border: '1px solid rgba(239,83,80,0.4)',
          borderRadius: '12px',
          padding: '14px 20px',
          color: '#ef5350',
          marginBottom: '24px',
          fontSize: '16px',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {programs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: colors.textDim,
          fontSize: '18px',
          padding: '60px 20px',
        }}>
          No programs configured yet.
          <br />
          Tap the gear icon to set up programs.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          maxWidth: '1000px',
          width: '100%',
        }}>
          {programs.map((prog, i) => (
            <button
              key={prog.slot || i}
              onClick={() => onSelectProgram(prog)}
              disabled={loading}
              style={{
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentAlt})`,
                border: 'none',
                borderRadius: '20px',
                padding: '32px 24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                minHeight: '160px',
                justifyContent: 'center',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 4px 20px rgba(102,126,234,0.3)',
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span style={{ fontSize: '48px' }}>{prog.emoji || '\uD83C\uDFCB\uFE0F'}</span>
              <span style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#fff',
                textAlign: 'center',
                lineHeight: '1.3',
              }}>
                {prog.name || `Program ${prog.code}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Gear icon — admin */}
      <button
        onClick={onOpenAdmin}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '24px',
          color: colors.textDim,
        }}
        title="Admin"
      >
        {'\u2699\uFE0F'}
      </button>
    </div>
  );
}


// ════════════════════════════════════════════════
// PROGRAM SCREEN
// ════════════════════════════════════════════════
function ProgramScreen({
  program, programData, currentUser, setCurrentUser,
  currentWeek, currentDay, daysPerWeek, totalWeeks,
  trackingData, maxes, onUpdateTracking, onLogWorkout,
  onNavigateDay, onGoHome, loading, savingStatus,
  idleCountdown, onCancelIdle, onLoadProgram, selectedProgram,
}) {
  const [showUserPicker, setShowUserPicker] = useState(!currentUser);
  const [users] = useState(loadUsers());
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState(program?.code || '');

  // If no user selected yet, show user picker
  if (!currentUser || showUserPicker) {
    return (
      <UserPicker
        program={program}
        users={users}
        newEmail={newEmail}
        setNewEmail={setNewEmail}
        newName={newName}
        setNewName={setNewName}
        newCode={newCode}
        setNewCode={setNewCode}
        onSelectUser={(user) => {
          setCurrentUser(user);
          setShowUserPicker(false);
          // Update recent users list
          const updated = loadUsers();
          const idx = updated.findIndex(u => u.email === user.email);
          if (idx >= 0) {
            updated[idx].lastUsed = new Date().toISOString().slice(0, 10);
            updated.splice(0, 0, updated.splice(idx, 1)[0]);
          } else {
            updated.unshift({ name: user.name, email: user.email, lastUsed: new Date().toISOString().slice(0, 10) });
          }
          saveUsers(updated.slice(0, 50)); // Keep max 50 users
          onLoadProgram(program, user);
        }}
        onGoHome={onGoHome}
        loading={loading}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight} 100%)`,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: colors.text,
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>
      {/* Idle countdown overlay */}
      {idleCountdown !== null && (
        <div
          onClick={onCancelIdle}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '72px', fontWeight: '800', color: colors.danger, marginBottom: '16px' }}>
            {idleCountdown}
          </div>
          <div style={{ fontSize: '22px', color: '#fff', marginBottom: '8px' }}>
            Returning to home screen...
          </div>
          <div style={{ fontSize: '16px', color: colors.textDim }}>
            Tap anywhere to stay
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onGoHome}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              padding: '10px 20px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              minHeight: '48px',
            }}
          >
            {'\u2190'} Home
          </button>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>
              {program?.emoji || ''} {program?.name || 'Program'}
            </div>
            <div style={{ fontSize: '14px', color: colors.textDim }}>
              Week {currentWeek} / Day {currentDay}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '16px',
            fontWeight: '600',
          }}>
            {'\uD83D\uDC64'} {currentUser.name}
          </div>
          <button
            onClick={() => setShowUserPicker(true)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              padding: '10px 16px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              minHeight: '48px',
            }}
          >
            Switch User
          </button>
        </div>
      </div>

      {/* Day navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '16px 24px',
      }}>
        <button
          onClick={() => onNavigateDay('prev')}
          disabled={currentWeek === 1 && currentDay === 1}
          style={{
            background: (currentWeek === 1 && currentDay === 1) ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            padding: '10px 24px',
            color: (currentWeek === 1 && currentDay === 1) ? 'rgba(255,255,255,0.3)' : '#fff',
            fontSize: '18px',
            fontWeight: '600',
            cursor: (currentWeek === 1 && currentDay === 1) ? 'default' : 'pointer',
            minHeight: '48px',
          }}
        >
          {'\u25C0'} Prev Day
        </button>
        <span style={{ fontSize: '18px', fontWeight: '600', minWidth: '140px', textAlign: 'center' }}>
          Week {currentWeek} &middot; Day {currentDay}
        </span>
        <button
          onClick={() => onNavigateDay('next')}
          disabled={currentWeek === totalWeeks && currentDay === daysPerWeek}
          style={{
            background: (currentWeek === totalWeeks && currentDay === daysPerWeek) ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            padding: '10px 24px',
            color: (currentWeek === totalWeeks && currentDay === daysPerWeek) ? 'rgba(255,255,255,0.3)' : '#fff',
            fontSize: '18px',
            fontWeight: '600',
            cursor: (currentWeek === totalWeeks && currentDay === daysPerWeek) ? 'default' : 'pointer',
            minHeight: '48px',
          }}
        >
          Next Day {'\u25B6'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '20px', color: colors.textDim }}>
          Loading workout...
        </div>
      )}

      {/* Workout blocks */}
      {!loading && programData?.blocks && (
        <div style={{ padding: '0 24px 120px', maxWidth: '900px', margin: '0 auto' }}>
          {programData.blocks.map((block, blockIndex) => (
            <KioskBlock
              key={blockIndex}
              block={block}
              blockIndex={blockIndex}
              trackingData={trackingData}
              maxes={maxes}
              onUpdate={onUpdateTracking}
            />
          ))}
        </div>
      )}

      {/* Bottom bar — Log Workout */}
      {!loading && programData && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(15,12,41,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          backdropFilter: 'blur(10px)',
        }}>
          {savingStatus === 'saved' && (
            <span style={{ color: colors.success, fontSize: '16px', fontWeight: '600' }}>
              {'\u2713'} Workout Saved!
            </span>
          )}
          {savingStatus === 'error' && (
            <span style={{ color: colors.danger, fontSize: '16px', fontWeight: '600' }}>
              Save failed - data backed up locally
            </span>
          )}
          <button
            onClick={onLogWorkout}
            disabled={savingStatus === 'saving'}
            style={{
              background: savingStatus === 'saving'
                ? 'rgba(255,255,255,0.2)'
                : `linear-gradient(135deg, ${colors.success}, #2e7d32)`,
              border: 'none',
              borderRadius: '14px',
              padding: '16px 48px',
              color: '#fff',
              fontSize: '20px',
              fontWeight: '700',
              cursor: savingStatus === 'saving' ? 'default' : 'pointer',
              minHeight: '60px',
              boxShadow: '0 4px 16px rgba(76,175,80,0.3)',
            }}
          >
            {savingStatus === 'saving' ? 'Saving...' : '\uD83D\uDCBE Log Workout'}
          </button>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════
// USER PICKER
// ════════════════════════════════════════════════
function UserPicker({ program, users, newEmail, setNewEmail, newName, setNewName, newCode, setNewCode, onSelectUser, onGoHome, loading }) {
  // Filter users who have used this program's code before
  const recentUsers = users.filter(u => u.email);

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: colors.text,
    }}>
      <button
        onClick={onGoHome}
        style={{
          alignSelf: 'flex-start',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '10px',
          padding: '10px 20px',
          color: '#fff',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '32px',
          minHeight: '48px',
        }}
      >
        {'\u2190'} Back
      </button>

      <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px' }}>
        {program?.emoji || ''} {program?.name || 'Program'}
      </h2>
      <p style={{ fontSize: '16px', color: colors.textDim, margin: '0 0 32px' }}>
        Select your name or sign in
      </p>

      {/* Recent users */}
      {recentUsers.length > 0 && (
        <div style={{ width: '100%', maxWidth: '500px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', color: colors.textDim, margin: '0 0 12px', fontWeight: '600' }}>
            Recent Users
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentUsers.map((user, i) => (
              <button
                key={i}
                onClick={() => onSelectUser({ name: user.name, email: user.email, accessCode: program.code })}
                disabled={loading}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '64px',
                }}
                onTouchStart={e => { e.currentTarget.style.background = 'rgba(102,126,234,0.3)'; }}
                onTouchEnd={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              >
                <span>{'\uD83D\uDC64'} {user.name}</span>
                <span style={{ fontSize: '13px', color: colors.textDim }}>{user.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New user form */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h3 style={{ fontSize: '16px', color: colors.textDim, margin: '0 0 16px', fontWeight: '600' }}>
          First Time? Sign In
        </h3>
        <input
          type="text"
          placeholder="Your Name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: colors.inputBg,
            border: `2px solid ${colors.inputBorder}`,
            borderRadius: '10px',
            fontSize: '18px',
            color: '#fff',
            marginBottom: '12px',
            boxSizing: 'border-box',
            outline: 'none',
            minHeight: '54px',
          }}
        />
        <input
          type="email"
          placeholder="Your Email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: colors.inputBg,
            border: `2px solid ${colors.inputBorder}`,
            borderRadius: '10px',
            fontSize: '18px',
            color: '#fff',
            marginBottom: '12px',
            boxSizing: 'border-box',
            outline: 'none',
            minHeight: '54px',
          }}
        />
        <input
          type="text"
          placeholder="Access Code (4 digits)"
          value={newCode}
          onChange={e => setNewCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: colors.inputBg,
            border: `2px solid ${colors.inputBorder}`,
            borderRadius: '10px',
            fontSize: '18px',
            color: '#fff',
            marginBottom: '16px',
            boxSizing: 'border-box',
            outline: 'none',
            minHeight: '54px',
          }}
        />
        <button
          onClick={() => {
            if (!newName.trim() || !newEmail.trim() || !newCode.trim()) return;
            onSelectUser({ name: newName.trim(), email: newEmail.trim(), accessCode: newCode.trim() });
          }}
          disabled={!newName.trim() || !newEmail.trim() || !newCode.trim() || loading}
          style={{
            width: '100%',
            padding: '16px',
            background: (!newName.trim() || !newEmail.trim() || !newCode.trim())
              ? 'rgba(255,255,255,0.1)'
              : `linear-gradient(135deg, ${colors.accent}, ${colors.accentAlt})`,
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
            cursor: (!newName.trim() || !newEmail.trim() || !newCode.trim()) ? 'default' : 'pointer',
            minHeight: '60px',
          }}
        >
          Start Workout
        </button>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════
// KIOSK BLOCK — simplified block rendering
// ════════════════════════════════════════════════
function KioskBlock({ block, blockIndex, trackingData, maxes, onUpdate }) {
  const [expanded, setExpanded] = useState(true);

  // Theme blocks are just text
  if (block.type === 'theme') {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '14px',
        borderLeft: '4px solid ' + colors.accent,
      }}>
        <div style={{ fontSize: '16px', color: colors.textDim, lineHeight: '1.6' }}>
          {block.themeText || block.notes || ''}
        </div>
      </div>
    );
  }

  const exercises = block.exercises || [];
  const blockType = getBlockTypeName(block.type) || block.type;
  const blockIcon = getBlockIcon(block.type) || '\uD83D\uDCCB';
  const completedCount = exercises.filter((_, ei) => trackingData[`complete-${blockIndex}-${ei}`]).length;
  const allDone = exercises.length > 0 && completedCount === exercises.length;

  return (
    <div style={{
      background: allDone ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.06)',
      borderRadius: '14px',
      marginBottom: '14px',
      overflow: 'hidden',
      border: allDone ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Block header */}
      <div
        onClick={() => setExpanded(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          cursor: 'pointer',
          background: allDone
            ? 'rgba(76,175,80,0.15)'
            : `linear-gradient(135deg, ${colors.accent}, ${colors.accentAlt})`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{blockIcon}</span>
          <span style={{ fontSize: '17px', fontWeight: '700' }}>{blockType}</span>
          {block.notes && (
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              — {block.notes}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {exercises.length > 0 && (
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              padding: '4px 10px',
              fontSize: '13px',
              fontWeight: '600',
            }}>
              {completedCount}/{exercises.length}
            </span>
          )}
          <span style={{ fontSize: '16px', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            {'\u25BC'}
          </span>
        </div>
      </div>

      {/* Exercises */}
      {expanded && (
        <div style={{ padding: '12px 16px' }}>
          {exercises.map((ex, exIndex) => (
            <KioskExercise
              key={exIndex}
              exercise={ex}
              blockIndex={blockIndex}
              exIndex={exIndex}
              trackingData={trackingData}
              maxes={maxes}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════
// KIOSK EXERCISE — simplified exercise rendering
// ════════════════════════════════════════════════
function KioskExercise({ exercise, blockIndex, exIndex, trackingData, maxes, onUpdate }) {
  const isComplete = trackingData[`complete-${blockIndex}-${exIndex}`] || false;
  const setsCount = typeof exercise.sets === 'number' ? exercise.sets : parseInt(exercise.sets) || 1;

  // Check if it's a cardio/conditioning exercise (has duration or distance fields)
  const isCardio = !!(exercise.duration || exercise.distance || exercise.durationUnit);

  // Calculate prescribed weights for percentage-based exercises
  const getWeightForSet = (setIndex) => {
    if (exercise.isPercentageBased && exercise.percentages?.[setIndex]) {
      const oneRM = get1RM(exercise.name, maxes, exercise.baseMax);
      if (oneRM > 0) {
        return Math.round(oneRM * (exercise.percentages[setIndex] / 100) / 5) * 5;
      }
    }
    return exercise.weight || '';
  };

  const getRepsForSet = (setIndex) => {
    if (exercise.repsPerSet?.[setIndex]) return exercise.repsPerSet[setIndex];
    return exercise.reps || '';
  };

  return (
    <div style={{
      background: isComplete ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.04)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '10px',
      border: isComplete ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Exercise header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '17px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
            {exercise.name}
          </div>
          <div style={{ fontSize: '13px', color: colors.textDim }}>
            {setsCount} sets {'\u00D7'} {exercise.reps || '?'} reps
            {exercise.qualifier && ` (${exercise.qualifier})`}
            {exercise.notes && ` — ${exercise.notes}`}
          </div>
        </div>
        <button
          onClick={() => onUpdate(blockIndex, exIndex, null, `complete-${blockIndex}-${exIndex}`, !isComplete)}
          style={{
            background: isComplete
              ? `linear-gradient(135deg, ${colors.success}, #2e7d32)`
              : 'rgba(255,255,255,0.1)',
            border: isComplete ? 'none' : '2px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '28px',
            color: '#fff',
            flexShrink: 0,
            marginLeft: '12px',
          }}
        >
          {isComplete ? '\u2713' : ''}
        </button>
      </div>

      {/* Cardio tracking */}
      {isCardio && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '12px', color: colors.textDim, marginBottom: '4px', display: 'block' }}>
              Duration ({exercise.durationUnit || 'min'})
            </label>
            <input
              type="text"
              placeholder={exercise.duration || 'Duration'}
              value={trackingData[`${blockIndex}-${exIndex}-null-duration`] || ''}
              onChange={e => onUpdate(blockIndex, exIndex, null, 'duration', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: colors.inputBg,
                border: `2px solid ${colors.inputBorder}`,
                borderRadius: '10px',
                fontSize: '16px',
                color: '#fff',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '48px',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: colors.textDim, marginBottom: '4px', display: 'block' }}>
              Distance ({exercise.distanceUnit || 'mi'})
            </label>
            <input
              type="text"
              placeholder={exercise.distance || 'Distance'}
              value={trackingData[`${blockIndex}-${exIndex}-null-distance`] || ''}
              onChange={e => onUpdate(blockIndex, exIndex, null, 'distance', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: colors.inputBg,
                border: `2px solid ${colors.inputBorder}`,
                borderRadius: '10px',
                fontSize: '16px',
                color: '#fff',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '48px',
              }}
            />
          </div>
        </div>
      )}

      {/* Set tracking rows */}
      {!isCardio && Array.from({ length: setsCount }).map((_, setIndex) => {
        const prescribedWeight = getWeightForSet(setIndex);
        const prescribedReps = getRepsForSet(setIndex);
        const pctLabel = exercise.isPercentageBased && exercise.percentages?.[setIndex]
          ? `${exercise.percentages[setIndex]}%`
          : '';

        return (
          <div key={setIndex} style={{
            display: 'grid',
            gridTemplateColumns: pctLabel ? '50px 1fr 1fr' : '50px 1fr 1fr',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textDim,
              textAlign: 'center',
            }}>
              {pctLabel || `Set ${setIndex + 1}`}
            </div>
            <input
              type="text"
              placeholder={prescribedWeight ? `${prescribedWeight} lbs` : 'Weight'}
              value={trackingData[`${blockIndex}-${exIndex}-${setIndex}-weight`] || ''}
              onChange={e => onUpdate(blockIndex, exIndex, setIndex, 'weight', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: colors.inputBg,
                border: `2px solid ${colors.inputBorder}`,
                borderRadius: '10px',
                fontSize: '16px',
                color: '#fff',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '48px',
              }}
            />
            <input
              type="text"
              placeholder={prescribedReps ? `${prescribedReps} reps` : 'Reps'}
              value={trackingData[`${blockIndex}-${exIndex}-${setIndex}-reps`] || ''}
              onChange={e => onUpdate(blockIndex, exIndex, setIndex, 'reps', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: colors.inputBg,
                border: `2px solid ${colors.inputBorder}`,
                borderRadius: '10px',
                fontSize: '16px',
                color: '#fff',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '48px',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}


// ════════════════════════════════════════════════
// ADMIN PANEL
// ════════════════════════════════════════════════
function AdminPanel({ config, setConfig, onClose }) {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [localConfig, setLocalConfig] = useState(JSON.parse(JSON.stringify(config)));
  const [saved, setSaved] = useState(false);

  const correctPin = config.coachPin || '0000';

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: colors.text,
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>
          Coach Admin
        </h2>
        <p style={{ color: colors.textDim, marginBottom: '24px', fontSize: '16px' }}>
          Enter PIN to continue
        </p>
        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
          maxLength={8}
          style={{
            width: '200px',
            padding: '16px',
            background: colors.inputBg,
            border: `2px solid ${colors.inputBorder}`,
            borderRadius: '12px',
            fontSize: '24px',
            color: '#fff',
            textAlign: 'center',
            letterSpacing: '8px',
            outline: 'none',
            marginBottom: '16px',
            minHeight: '60px',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && pin === correctPin) setAuthenticated(true);
          }}
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '14px 28px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              minHeight: '52px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (pin === correctPin) setAuthenticated(true);
            }}
            style={{
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentAlt})`,
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              minHeight: '52px',
            }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  // Ensure we have 8 program slots
  while (localConfig.programs.length < 8) {
    localConfig.programs.push({ slot: localConfig.programs.length + 1, code: '', name: '', emoji: '' });
  }

  const handleSave = () => {
    // Filter out empty programs for cleanliness but keep structure
    const cleanConfig = {
      ...localConfig,
      programs: localConfig.programs.map((p, i) => ({
        ...p,
        slot: i + 1,
      })),
    };
    saveConfig(cleanConfig);
    setConfig(cleanConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateProgram = (index, field, value) => {
    setLocalConfig(prev => {
      const updated = { ...prev, programs: [...prev.programs] };
      updated.programs[index] = { ...updated.programs[index], [field]: value };
      return updated;
    });
  };

  const updateTV = (tv, value) => {
    setLocalConfig(prev => ({
      ...prev,
      tvAssignments: { ...prev.tvAssignments, [tv]: value },
    }));
  };

  const emojiOptions = ['\uD83C\uDFCB\uFE0F', '\uD83C\uDFC3', '\u2694\uFE0F', '\uD83D\uDCAA', '\uD83E\uDDD8', '\uD83C\uDFAF', '\uD83D\uDD25', '\u26A1', '\uD83E\uDD4A', '\uD83C\uDFC6', '\uD83D\uDE80', '\uD83C\uDFCA', '\u2744\uFE0F', '\uD83E\uDDBE', '\uD83C\uDFC0', '\uD83C\uDFBE'];

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight} 100%)`,
      padding: '32px 24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: colors.text,
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
            {'\u2699\uFE0F'} Kiosk Admin
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              padding: '10px 20px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              minHeight: '48px',
            }}
          >
            {'\u2190'} Back
          </button>
        </div>

        {/* Program slots */}
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textDim, margin: '0 0 16px' }}>
          Program Slots (8 max)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
          {localConfig.programs.slice(0, 8).map((prog, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '50px 100px 1fr 60px',
              gap: '10px',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '12px',
              padding: '12px 16px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: '14px', color: colors.textDim, fontWeight: '600' }}>#{i + 1}</span>
              <input
                type="text"
                placeholder="Code"
                value={prog.code || ''}
                onChange={e => updateProgram(i, 'code', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                style={{
                  padding: '10px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: '#fff',
                  outline: 'none',
                  minHeight: '44px',
                }}
              />
              <input
                type="text"
                placeholder="Display Name"
                value={prog.name || ''}
                onChange={e => updateProgram(i, 'name', e.target.value)}
                style={{
                  padding: '10px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: '#fff',
                  outline: 'none',
                  minHeight: '44px',
                }}
              />
              <select
                value={prog.emoji || '\uD83C\uDFCB\uFE0F'}
                onChange={e => updateProgram(i, 'emoji', e.target.value)}
                style={{
                  padding: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '8px',
                  fontSize: '20px',
                  color: '#fff',
                  outline: 'none',
                  minHeight: '44px',
                  cursor: 'pointer',
                }}
              >
                {emojiOptions.map(em => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* TV Assignments */}
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textDim, margin: '0 0 16px' }}>
          TV Assignments
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '36px' }}>
          {['tv1', 'tv2', 'tv3', 'tv4'].map(tv => (
            <div key={tv} style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '12px',
              padding: '14px 16px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <label style={{ fontSize: '14px', color: colors.textDim, marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                {tv.toUpperCase().replace('TV', 'TV ')}
              </label>
              <select
                value={localConfig.tvAssignments?.[tv] || ''}
                onChange={e => updateTV(tv, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: '#fff',
                  outline: 'none',
                  minHeight: '44px',
                  cursor: 'pointer',
                }}
              >
                <option value="">-- None --</option>
                {localConfig.programs.filter(p => p.code).map(p => (
                  <option key={p.code} value={p.code}>{p.name || `Code ${p.code}`}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Manage Users */}
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textDim, margin: '0 0 16px' }}>
          Saved Users ({loadUsers().length})
        </h3>
        <div style={{ marginBottom: '36px' }}>
          {loadUsers().length === 0 ? (
            <p style={{ color: colors.textDim, fontSize: '14px' }}>No users saved yet. Users are added when they first sign in at the kiosk.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {loadUsers().map((user, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                }}>
                  <span>{user.name} — {user.email}</span>
                  <span style={{ color: colors.textDim, fontSize: '12px' }}>Last: {user.lastUsed || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}
          {loadUsers().length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all saved users?')) {
                  saveUsers([]);
                }
              }}
              style={{
                marginTop: '12px',
                background: 'rgba(239,83,80,0.2)',
                border: '1px solid rgba(239,83,80,0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: colors.danger,
                fontSize: '14px',
                cursor: 'pointer',
                minHeight: '40px',
              }}
            >
              Clear All Users
            </button>
          )}
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingBottom: '40px' }}>
          <button
            onClick={handleSave}
            style={{
              background: `linear-gradient(135deg, ${colors.success}, #2e7d32)`,
              border: 'none',
              borderRadius: '14px',
              padding: '16px 48px',
              color: '#fff',
              fontSize: '20px',
              fontWeight: '700',
              cursor: 'pointer',
              minHeight: '60px',
              boxShadow: '0 4px 16px rgba(76,175,80,0.3)',
            }}
          >
            {saved ? '\u2713 Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
