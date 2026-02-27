import React, { useState, useMemo } from 'react';
import ProgramHeader from './ProgramHeader';
import BlockCard from './BlockCard';
import DailyTonnage, { calcBlockTonnage, calcCardio, getDefaultWeight } from './DailyTonnage';
import WeeklyStatsCard from './WeeklyStatsCard';

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
  profile,
  onUpdateProfile,
  accessCode,
  getWeeklyStats,
  travelMode,
  travelEquipment,
  travelDay,
  travelTotalDays,
  onExitTravelMode,
}) {
  const blocks = program?.blocks || [];
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [tempFeet, setTempFeet] = useState('');
  const [tempInches, setTempInches] = useState('');
  const [tempWeight, setTempWeight] = useState('');
  const [tempAge, setTempAge] = useState('');

  const heightTotal = profile?.height || 0;
  const displayFeet = heightTotal ? Math.floor(heightTotal / 12) : '';
  const displayInches = heightTotal ? heightTotal % 12 : '';

  // Calculate live stats for current session (to update weekly card in real-time)
  const liveStats = useMemo(() => {
    const userWeight = profile?.weight || 0;
    const userGender = profile?.gender || '';
    const effectiveWeight = userWeight > 0 ? userWeight : getDefaultWeight(userGender);
    const weightKg = effectiveWeight * 0.453592;

    let tonnage = 0, coreEquiv = 0, cardioMinutes = 0, cardioMiles = 0, cardioCal = 0;
    let completedExercises = 0;

    (blocks || []).forEach((block, blockIndex) => {
      const bt = calcBlockTonnage(block, maxes || {}, trackingData, blockIndex, userWeight, userGender);
      tonnage += bt.tonnage;
      coreEquiv += bt.coreEquiv;
      const c = calcCardio(block, trackingData, blockIndex, weightKg);
      cardioMinutes += c.minutes;
      cardioMiles += c.miles;
      cardioCal += c.calories;
      // Count completed exercises for calorie estimate
      (block.exercises || []).forEach((ex, exIndex) => {
        if (trackingData?.[`complete-${blockIndex}-${exIndex}`]) completedExercises++;
      });
    });

    // Calorie estimate: MET formula + work bonuses
    const strengthMinutes = completedExercises * 3;
    const baseMET = 6;
    const strengthCal = baseMET * weightKg * (strengthMinutes / 60);
    const tonnageBonus = (tonnage / 1000) * 10; // ~10 cal per 1000 lbs lifted

    const estCalories = Math.round(strengthCal + tonnageBonus + cardioCal);

    return { tonnage: Math.round(tonnage), coreEquiv, cardioMinutes, cardioMiles, estCalories };
  }, [blocks, maxes, trackingData, profile]);

  return (
    <div style={s.container}>
      <div style={s.content}>
        {travelMode && (
          <div style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                Travel Mode — {travelEquipment === 'hotel_gym' ? 'Hotel Gym' : 'Bodyweight'} Day {travelDay} of {travelTotalDays}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '2px' }}>
                This won't affect your normal program position
              </div>
            </div>
            <button
              onClick={onExitTravelMode}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Exit Travel Mode
            </button>
          </div>
        )}

        <ProgramHeader
          program={program}
          userName={userName}
          userEmail={userEmail}
          currentWeek={travelMode ? 1 : currentWeek}
          currentDay={travelMode ? travelDay : currentDay}
          daysPerWeek={travelMode ? travelTotalDays : daysPerWeek}
          totalWeeks={travelMode ? 1 : totalWeeks}
          onNavigate={onNavigate}
          onNavigateToDay={onNavigateToDay}
          isFirstDay={travelMode ? travelDay <= 1 : isFirstDay}
          isLastDay={travelMode ? travelDay >= travelTotalDays : isLastDay}
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
            key={`${currentWeek}-${currentDay}-${blockIndex}`}
            block={block}
            blockIndex={blockIndex}
            maxes={maxes}
            userName={userName}
            savedBlockData={savedWorkout?.data?.blocks?.[blockIndex]}
            previousWeekBlock={previousWeekWorkout?.data?.blocks?.[blockIndex]}
            trackingData={trackingData}
            onUpdateTracking={onUpdateTracking}
            onMarkComplete={() => {}}
            onSetRecommendation={onSetRecommendation}
            recommendations={recommendations}
          />
        ))}

        <DailyTonnage blocks={blocks} maxes={maxes} trackingData={trackingData} userWeight={profile?.weight || 0} userGender={profile?.gender} />

        {/* Profile Widget */}
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <span
            style={{ fontSize: '13px', color: '#fff', opacity: 0.7, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => {
              setShowProfileEdit(!showProfileEdit);
              setTempFeet(displayFeet);
              setTempInches(displayInches);
              setTempWeight(profile?.weight || '');
              setTempAge(profile?.age || '');
            }}
          >
            {profile?.weight || heightTotal || profile?.gender
              ? [
                  profile?.gender === 'M' ? 'Male' : profile?.gender === 'F' ? 'Female' : null,
                  heightTotal ? `${displayFeet}'${displayInches}"` : null,
                  profile?.weight ? `${profile.weight} lbs` : null,
                  profile?.age ? `Age ${profile.age}` : null,
                ].filter(Boolean).join(' | ')
              : 'Set your stats for calorie estimates'}
          </span>
          {showProfileEdit && (
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', marginTop: '8px', maxWidth: '280px', margin: '8px auto 0' }}>
              {/* Gender display (read-only, set in registration) */}
              {profile?.gender && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
                  <div style={{
                    flex: 1, padding: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textAlign: 'center',
                    background: profile.gender === 'M' ? '#667eea' : 'rgba(255,255,255,0.2)',
                    color: profile.gender === 'M' ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}>Male</div>
                  <div style={{
                    flex: 1, padding: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textAlign: 'center',
                    background: profile.gender === 'F' ? '#667eea' : 'rgba(255,255,255,0.2)',
                    color: profile.gender === 'F' ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}>Female</div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input type="number" placeholder="Ft" value={tempFeet} onChange={(e) => setTempFeet(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', fontSize: '14px', textAlign: 'center', width: '100%', boxSizing: 'border-box', minWidth: 0 }} />
                <input type="number" placeholder="In" value={tempInches} onChange={(e) => setTempInches(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', fontSize: '14px', textAlign: 'center', width: '100%', boxSizing: 'border-box', minWidth: 0 }} />
                <input type="number" placeholder="Lbs" value={tempWeight} onChange={(e) => setTempWeight(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', fontSize: '14px', textAlign: 'center', width: '100%', boxSizing: 'border-box', minWidth: 0 }} />
                <input type="number" placeholder="Age" value={tempAge} onChange={(e) => setTempAge(e.target.value)}
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', fontSize: '14px', textAlign: 'center', width: '100%', boxSizing: 'border-box', minWidth: 0 }} />
              </div>
              <button
                onClick={() => {
                  if (onUpdateProfile) {
                    onUpdateProfile({
                      gender: profile?.gender || '',
                      height: (tempFeet || tempInches) ? (Number(tempFeet || 0) * 12 + Number(tempInches || 0)) : profile?.height || '',
                      weight: tempWeight ? Number(tempWeight) : profile?.weight || '',
                      age: tempAge ? Number(tempAge) : profile?.age || '',
                    });
                  }
                  setShowProfileEdit(false);
                }}
                style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: '#fff', color: '#764ba2', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        <WeeklyStatsCard
          accessCode={accessCode}
          userEmail={userEmail}
          currentWeek={currentWeek}
          daysPerWeek={daysPerWeek}
          totalWeeks={totalWeeks}
          getWeeklyStats={getWeeklyStats}
          liveStats={liveStats}
        />

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
