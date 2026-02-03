import { useState, useCallback } from 'react';

export default function useTrackerState() {
  // Screen flow
  const [screen, setScreen] = useState('access'); // 'access' | 'consent' | 'questionnaire' | 'program'

  // User data
  const [user, setUser] = useState({
    name: '', email: '', accessCode: '', isReturningUser: false
  });
  const [maxes, setMaxes] = useState({ bench: 0, squat: 0, deadlift: 0, clean: 0 });
  const [profile, setProfile] = useState({ height: '', weight: '', age: '' });

  // Consent
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState(null);

  // Program
  const [program, setProgram] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState(null);
  const [totalWeeks, setTotalWeeks] = useState(null);

  // Saved workout data
  const [savedWorkout, setSavedWorkout] = useState(null);
  const [previousWeekWorkout, setPreviousWeekWorkout] = useState(null);

  // Custom workout indicator
  const [isCustomWorkout, setIsCustomWorkout] = useState(false);
  const [customReason, setCustomReason] = useState('');

  // Exercise recommendations (up/same/down arrows)
  const [recommendations, setRecommendations] = useState({});

  const setRecommendation = useCallback((blockIndex, exIndex, direction) => {
    setRecommendations(prev => ({
      ...prev,
      [`${blockIndex}-${exIndex}`]: direction
    }));
  }, []);

  // Navigate days
  const navigateDay = useCallback((direction) => {
    if (!daysPerWeek || !totalWeeks) return;

    let newWeek = currentWeek;
    let newDay = currentDay + direction;

    if (newDay > daysPerWeek) { newDay = 1; newWeek++; }
    if (newDay < 1) { newDay = daysPerWeek; newWeek--; }
    if (newWeek < 1 || newWeek > totalWeeks) return;

    setCurrentWeek(newWeek);
    setCurrentDay(newDay);
  }, [currentWeek, currentDay, daysPerWeek, totalWeeks]);

  const isFirstDay = currentWeek === 1 && currentDay === 1;
  const isLastDay = currentWeek === totalWeeks && currentDay === daysPerWeek;

  // Reset to login
  const logout = useCallback(() => {
    setScreen('access');
    setProgram(null);
    setSavedWorkout(null);
    setPreviousWeekWorkout(null);
    setIsCustomWorkout(false);
    setCustomReason('');
    setRecommendations({});
  }, []);

  return {
    screen, setScreen,
    user, setUser,
    maxes, setMaxes,
    profile, setProfile,
    consentAccepted, setConsentAccepted,
    consentTimestamp, setConsentTimestamp,
    program, setProgram,
    currentWeek, setCurrentWeek,
    currentDay, setCurrentDay,
    daysPerWeek, setDaysPerWeek,
    totalWeeks, setTotalWeeks,
    savedWorkout, setSavedWorkout,
    previousWeekWorkout, setPreviousWeekWorkout,
    isCustomWorkout, setIsCustomWorkout,
    customReason, setCustomReason,
    recommendations, setRecommendation, setRecommendations,
    navigateDay, isFirstDay, isLastDay,
    logout
  };
}
