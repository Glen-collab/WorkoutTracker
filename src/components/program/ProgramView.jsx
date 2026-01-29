import React from 'react';
import ProgramHeader from './ProgramHeader';
import BlockCard from './BlockCard';
import DailyTonnage from './DailyTonnage';

const s = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: '16px',
    boxSizing: 'border-box',
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  savedMsg: {
    background: '#e3f2fd',
    border: '1px solid #90caf9',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '14px',
    fontSize: '14px',
    color: '#1565c0',
    textAlign: 'center',
  },
  actionBar: {
    marginTop: '20px',
    paddingBottom: '30px',
  },
  logBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  logoutBtn: {
    width: '100%',
    padding: '12px',
    background: '#9e9e9e',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default function ProgramView({
  program,
  userName,
  userEmail,
  currentWeek,
  currentDay,
  daysPerWeek,
  totalWeeks,
  maxes,
  savedWorkout,
  previousWeekWorkout,
  isCustomWorkout,
  customReason,
  recommendations,
  onNavigate,
  onNavigateToDay,
  onSetRecommendation,
  isFirstDay,
  isLastDay,
  onLogWorkout,
  onLogout,
  trackingData,
  onUpdateTracking,
}) {
  const blocks = program?.blocks || [];

  return (
    <div style={s.container}>
      <div style={s.content}>
        <ProgramHeader
          program={program}
          userName={userName}
          userEmail={userEmail}
          currentWeek={currentWeek}
          currentDay={currentDay}
          daysPerWeek={daysPerWeek}
          totalWeeks={totalWeeks}
          onNavigate={onNavigate}
          onNavigateToDay={onNavigateToDay}
          isFirstDay={isFirstDay}
          isLastDay={isLastDay}
          isCustomWorkout={isCustomWorkout}
          customReason={customReason}
        />

        {savedWorkout && (
          <div style={s.savedMsg}>
            {'\uD83D\uDCCA'} Viewing previously logged workout from{' '}
            {savedWorkout.date || 'unknown date'}
          </div>
        )}

        {blocks.map((block, blockIndex) => (
          <BlockCard
            key={blockIndex}
            block={block}
            blockIndex={blockIndex}
            maxes={maxes}
            userName={userName}
            savedBlockData={savedWorkout?.blocks?.[blockIndex]}
            previousWeekBlock={previousWeekWorkout?.blocks?.[blockIndex]}
            trackingData={trackingData}
            onUpdateTracking={onUpdateTracking}
            onMarkComplete={() => {}}
            onSetRecommendation={onSetRecommendation}
            recommendations={recommendations}
          />
        ))}

        <DailyTonnage blocks={blocks} maxes={maxes} trackingData={trackingData} />

        <div style={s.actionBar}>
          <button style={s.logBtn} onClick={onLogWorkout}>
            {'\uD83D\uDCDD'} Log Workout
          </button>
          <button style={s.logoutBtn} onClick={onLogout}>
            {'\uD83C\uDFE0'} Logout
          </button>
        </div>
      </div>
    </div>
  );
}
