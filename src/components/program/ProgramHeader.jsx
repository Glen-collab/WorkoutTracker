import React from 'react';

const s = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#333',
  },
  meta: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  weekRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  weekBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    color: '#667eea',
    fontWeight: '700',
  },
  weekLabel: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#333',
    minWidth: '80px',
    textAlign: 'center',
  },
  dayRow: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  dayPill: {
    padding: '8px 14px',
    borderRadius: '20px',
    border: '2px solid #e0e0e0',
    background: '#f5f5f5',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#666',
    transition: 'all 0.15s',
  },
  dayPillActive: {
    padding: '8px 14px',
    borderRadius: '20px',
    border: '2px solid #667eea',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(102,126,234,0.4)',
  },
  customBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#e8f5e9',
    border: '1px solid #4caf50',
    borderRadius: '8px',
    padding: '10px 14px',
    marginTop: '12px',
    color: '#2e7d32',
    fontSize: '14px',
  },
};

export default function ProgramHeader({
  program,
  userName,
  userEmail,
  currentWeek,
  currentDay,
  daysPerWeek,
  totalWeeks,
  onNavigate,
  onNavigateToDay,
  isCustomWorkout,
  customReason,
}) {
  const showNav = totalWeeks > 1 || daysPerWeek > 1;
  const days = Array.from({ length: daysPerWeek || 1 }, (_, i) => i + 1);

  const handleWeekChange = (dir) => {
    const newWeek = currentWeek + dir;
    if (newWeek < 1 || newWeek > totalWeeks) return;
    // Navigate to day 1 of the new week
    if (onNavigateToDay) onNavigateToDay(newWeek, 1);
  };

  const handleDayClick = (day) => {
    if (day === currentDay) return;
    if (onNavigateToDay) onNavigateToDay(currentWeek, day);
  };

  return (
    <div style={s.card}>
      <h2 style={s.title}>{program?.name || 'Workout Program'}</h2>
      <div style={s.meta}>
        For: {userName} ({userEmail})
      </div>

      {showNav && (
        <>
          {/* Week selector */}
          {totalWeeks > 1 && (
            <div style={s.weekRow}>
              <button
                style={{ ...s.weekBtn, opacity: currentWeek <= 1 ? 0.3 : 1 }}
                disabled={currentWeek <= 1}
                onClick={() => handleWeekChange(-1)}
              >
                {'\u25C0'}
              </button>
              <span style={s.weekLabel}>Week {currentWeek} / {totalWeeks}</span>
              <button
                style={{ ...s.weekBtn, opacity: currentWeek >= totalWeeks ? 0.3 : 1 }}
                disabled={currentWeek >= totalWeeks}
                onClick={() => handleWeekChange(1)}
              >
                {'\u25B6'}
              </button>
            </div>
          )}

          {/* Day pills */}
          <div style={s.dayRow}>
            {days.map(day => (
              <button
                key={day}
                style={day === currentDay ? s.dayPillActive : s.dayPill}
                onClick={() => handleDayClick(day)}
              >
                Day {day}
              </button>
            ))}
          </div>
        </>
      )}

      {isCustomWorkout && (
        <div style={s.customBadge}>
          <span>
            {'\u2713'} Custom Workout - Your trainer customized this workout for you
          </span>
          {customReason && (
            <span style={{ fontStyle: 'italic', marginLeft: '4px' }}>
              ({customReason})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
