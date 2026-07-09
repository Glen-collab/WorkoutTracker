import { useState, useCallback } from 'react';
import { stepVisibleDay, isFirstVisibleDay, isLastVisibleDay } from '../utils/visibleDays';

export default function useTrackerState() {
  // Screen flow
  const [screen, setScreen] = useState('access'); // 'access' | 'consent' | 'questionnaire' | 'program'

  // User data
  const [user, setUser] = useState({
    name: '', email: '', accessCode: '', isReturningUser: false
  });
  const [maxes, setMaxes] = useState({ bench: 0, squat: 0, deadlift: 0, clean: 0 });
  // Per-athlete sprint PBs (best time per distance) — drives the %PB target
  // times. Loaded from the user's account, edited inline in sprint blocks.
  const [sprintPBs, setSprintPBs] = useState({});
  // Per-athlete exercise swaps that persist across weeks (prescribed name →
  // { name, video, sets, reps }). Loaded from the server each program load.
  const [exerciseSwaps, setExerciseSwaps] = useState({});
  const [profile, setProfile] = useState({ height: '', weight: '', age: '' });

  // Consent
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState(null);

  // Program
  const [program, setProgram] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState(null);
  const [hiddenDays, setHiddenDays] = useState([]); // day numbers hidden from client + TV
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

  // Navigate days (skips hidden days)
  const navigateDay = useCallback((direction) => {
    if (!daysPerWeek || !totalWeeks) return;
    const next = stepVisibleDay(currentWeek, currentDay, direction, daysPerWeek, hiddenDays, totalWeeks);
    if (!next) return;
    setCurrentWeek(next.week);
    setCurrentDay(next.day);
  }, [currentWeek, currentDay, daysPerWeek, hiddenDays, totalWeeks]);

  const isFirstDay = isFirstVisibleDay(currentWeek, currentDay, daysPerWeek, hiddenDays);
  const isLastDay = isLastVisibleDay(currentWeek, currentDay, daysPerWeek, hiddenDays, totalWeeks);

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
    sprintPBs, setSprintPBs,
    exerciseSwaps, setExerciseSwaps,
    profile, setProfile,
    consentAccepted, setConsentAccepted,
    consentTimestamp, setConsentTimestamp,
    program, setProgram,
    currentWeek, setCurrentWeek,
    currentDay, setCurrentDay,
    daysPerWeek, setDaysPerWeek,
    hiddenDays, setHiddenDays,
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
