import React from 'react';

const styles = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#333',
  },
  meta: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '12px',
  },
  navBtn: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  dayDisplay: {
    fontSize: '16px',
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
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
  isFirstDay,
  isLastDay,
  isCustomWorkout,
  customReason,
}) {
  const showNav = totalWeeks > 1 || daysPerWeek > 1;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{program?.name || 'Workout Program'}</h2>
      <div style={styles.meta}>
        For: {userName} ({userEmail}) | {'\uD83D\uDCC5'} Week {currentWeek} Day{' '}
        {currentDay}
      </div>

      {showNav && (
        <div style={styles.nav}>
          <button
            style={{
              ...styles.navBtn,
              opacity: isFirstDay ? 0.5 : 1,
              cursor: isFirstDay ? 'default' : 'pointer',
            }}
            disabled={isFirstDay}
            onClick={() => onNavigate('prev')}
          >
            {'\u2190'} Previous
          </button>
          <span style={styles.dayDisplay}>
            Wk {currentWeek}: Day {currentDay}
          </span>
          <button
            style={{
              ...styles.navBtn,
              opacity: isLastDay ? 0.5 : 1,
              cursor: isLastDay ? 'default' : 'pointer',
            }}
            disabled={isLastDay}
            onClick={() => onNavigate('next')}
          >
            Next {'\u2192'}
          </button>
        </div>
      )}

      {isCustomWorkout && (
        <div style={styles.customBadge}>
          <span>
            {'\u2713'} Custom Workout - Your trainer customized this workout for
            you
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
