import React, { useState, useCallback, useRef, useEffect } from 'react';
import useTrackerState from './hooks/useTrackerState';
import useTrackerAPI from './hooks/useTrackerAPI';
import AccessScreen from './components/access/AccessScreen';
import ConsentScreen from './components/consent/ConsentScreen';
import QuestionnaireScreen from './components/consent/QuestionnaireScreen';
import ProgramView from './components/program/ProgramView';
import PainModal from './components/modals/PainModal';
import CompletionModal from './components/modals/CompletionModal';
import CongratulationsModal from './components/modals/CongratulationsModal';
import TestYourMight, { getWeekConfig } from './components/game/TestYourMight';
import WorkoutChatbot from './components/chatbot/WorkoutChatbot';

const containerStyle = {
  minHeight: '100vh',
  background: '#f0f2f5',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export default function App() {
  const state = useTrackerState();
  const api = useTrackerAPI();

  const {
    screen, setScreen,
    user, setUser,
    maxes, setMaxes,
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
    logout,
  } = state;

  // Tracking data keyed by "blockIndex-exIndex-setIndex-field"
  const [trackingData, setTrackingData] = useState({});

  // Pain areas for questionnaire
  const [painAreas, setPainAreas] = useState([]);

  // Modal visibility
  const [showPainModal, setShowPainModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showGamePrompt, setShowGamePrompt] = useState(false);
  const [gameWeek, setGameWeek] = useState(1);

  const chatbotRef = useRef(null);

  // --- Helpers ---

  const initializeTrackingFromSaved = useCallback((saved) => {
    if (!saved?.data?.blocks) return;
    const newTracking = {};
    saved.data.blocks.forEach((block, blockIndex) => {
      if (!block.exercises) return;
      block.exercises.forEach((ex, exIndex) => {
        if (!ex.sets) return;
        ex.sets.forEach((set, setIndex) => {
          if (set.weight !== undefined) newTracking[`${blockIndex}-${exIndex}-${setIndex}-weight`] = set.weight;
          if (set.reps !== undefined) newTracking[`${blockIndex}-${exIndex}-${setIndex}-reps`] = set.reps;
          if (set.completed !== undefined) newTracking[`${blockIndex}-${exIndex}-${setIndex}-completed`] = set.completed;
        });
      });
    });
    setTrackingData(newTracking);
  }, []);

  const handleUpdateTracking = useCallback((blockIndex, exIndex, setIndex, field, value) => {
    // If field already looks like a full key (contains 'rec-' or 'complete-' or 'block-notes-'), store it directly
    const isDirectKey = field.startsWith('rec-') || field.startsWith('complete-') || field.startsWith('block-notes-');
    const key = isDirectKey ? field : `${blockIndex}-${exIndex}-${setIndex}-${field}`;
    setTrackingData(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // --- Load program from API ---

  // Use a ref to always have latest user/maxes without stale closures
  const userRef = useRef(user);
  const maxesRef = useRef(maxes);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { maxesRef.current = maxes; }, [maxes]);

  const handleLoadProgramFromAPI = useCallback(async (requestedWeek, requestedDay) => {
    const u = userRef.current;
    const m = maxesRef.current;
    try {
      // Match the PHP API field names: email, code, name, benchMax, squatMax, deadliftMax, cleanMax
      const params = {
        email: u.email,
        code: u.accessCode,
        name: u.name,
        benchMax: m.bench || 0,
        squatMax: m.squat || 0,
        deadliftMax: m.deadlift || 0,
        cleanMax: m.clean || 0,
      };
      if (requestedWeek) params.requested_week = requestedWeek;
      if (requestedDay) params.requested_day = requestedDay;

      const result = await api.loadProgram(params);

      if (result.success && result.data && result.data.program) {
        const prog = result.data.program;
        setProgram(prog);

        if (result.data.userPosition) {
          // Only set position from DB on initial load (no explicit requested day)
          if (!requestedWeek && !requestedDay) {
            setCurrentWeek(result.data.userPosition.currentWeek || 1);
            setCurrentDay(result.data.userPosition.currentDay || 1);
          }
          // Auto-fill 1RM from database if user didn't provide them
          const pos = result.data.userPosition;
          setMaxes(prev => ({
            bench: prev.bench || parseFloat(pos.oneRmBench) || 0,
            squat: prev.squat || parseFloat(pos.oneRmSquat) || 0,
            deadlift: prev.deadlift || parseFloat(pos.oneRmDeadlift) || 0,
            clean: prev.clean || parseFloat(pos.oneRmClean) || 0,
          }));
        }
        if (prog.daysPerWeek) setDaysPerWeek(prog.daysPerWeek);
        if (prog.totalWeeks) setTotalWeeks(prog.totalWeeks);

        // Store user name from DB for returning users
        if (u.isReturningUser && prog.userName) {
          setUser(prev => ({ ...prev, name: prog.userName }));
        }

        if (result.data.savedWorkout) {
          setSavedWorkout(result.data.savedWorkout);
          initializeTrackingFromSaved(result.data.savedWorkout);
        } else {
          setSavedWorkout(null);
          setTrackingData({});
        }

        // Check for custom override
        try {
          const overrideResult = await api.loadUserOverride({
            accessCode: u.accessCode,
            userEmail: u.email,
            weekNumber: requestedWeek || result.data.userPosition?.currentWeek || 1,
            dayNumber: requestedDay || result.data.userPosition?.currentDay || 1,
          });
          if (overrideResult.success && overrideResult.data && overrideResult.data.workoutData) {
            setProgram(prev => ({
              ...prev,
              blocks: overrideResult.data.workoutData.blocks || prev.blocks,
            }));
            setIsCustomWorkout(true);
            setCustomReason(overrideResult.data.overrideReason || '');
          } else {
            setIsCustomWorkout(false);
            setCustomReason('');
          }
        } catch {
          setIsCustomWorkout(false);
          setCustomReason('');
        }

        // Load previous week workout for recommendations
        const curWeek = requestedWeek || result.data.userPosition?.currentWeek || 1;
        if (curWeek > 1) {
          try {
            const prevResult = await api.loadProgram({
              email: u.email,
              code: u.accessCode,
              requested_week: curWeek - 1,
              requested_day: requestedDay || result.data.userPosition?.currentDay || 1,
            });
            if (prevResult.success && prevResult.data && prevResult.data.savedWorkout) {
              setPreviousWeekWorkout(prevResult.data.savedWorkout);
            } else {
              setPreviousWeekWorkout(null);
            }
          } catch {
            setPreviousWeekWorkout(null);
          }
        } else {
          setPreviousWeekWorkout(null);
        }

        setScreen('program');
      } else {
        console.error('Failed to load program:', result);
        alert(result?.message || 'Invalid access code or email. Please check and try again.');
        setScreen('access');
      }
    } catch (err) {
      console.error('Failed to load program:', err);
      // In dev mode, load a mock program so we can test the UI
      if (window.location.hostname === 'localhost') {
        console.warn('DEV MODE: Loading mock program for testing');
        const mockProgram = {
          name: 'Mock 4-Week Strength Program',
          userName: u.name || 'Test User',
          daysPerWeek: 4,
          totalWeeks: 4,
          blocks: [
            {
              type: 'theme',
              themeText: 'Today we focus on building strength through compound movements. Stay focused and push yourself!',
            },
            {
              type: 'warmup',
              notes: 'Light cardio + dynamic stretching',
              exercises: [
                { name: 'Foam Roller — Lower Body', reps: '2 min', sets: 1 },
                { name: 'Walking Lunges', reps: '10 each leg', sets: 2 },
              ]
            },
            {
              type: 'straight-set',
              notes: 'Focus on controlled eccentric',
              exercises: [
                {
                  name: 'Bench Press',
                  sets: 4,
                  reps: '8',
                  isPercentageBased: true,
                  percentages: [65, 70, 75, 80],
                  repsPerSet: [8, 8, 6, 5],
                  scheme: '5/3/1',
                  youtube: 'https://iframe.videodelivery.net/4401f79b1c197056394175ac3bc5b369',
                },
                {
                  name: 'Incline Dumbbell Press',
                  sets: 3,
                  reps: '10',
                  notes: 'Squeeze at the top',
                },
              ]
            },
            {
              type: 'superset',
              notes: 'No rest between exercises, 60s rest between rounds',
              exercises: [
                { name: 'Dumbbell Lateral Raise', sets: 3, reps: '12' },
                { name: 'Face Pulls', sets: 3, reps: '15' },
              ]
            },
            {
              type: 'circuit',
              circuitType: 'amrap',
              timeLimit: 10,
              notes: '10 minute AMRAP',
              exercises: [
                { name: 'Push-ups', reps: '15' },
                { name: 'Air Squats', reps: '20' },
                { name: 'Sit-ups', reps: '10' },
              ]
            },
            {
              type: 'conditioning',
              notes: 'Finish strong',
              exercises: [
                { name: 'Assault Bike', duration: '5 min', intensity: 'Moderate' },
              ]
            },
          ]
        };
        setProgram(mockProgram);
        setCurrentWeek(1);
        setCurrentDay(1);
        setDaysPerWeek(mockProgram.daysPerWeek);
        setTotalWeeks(mockProgram.totalWeeks);
        setSavedWorkout(null);
        setPreviousWeekWorkout(null);
        setIsCustomWorkout(false);
        setCustomReason('');
        setTrackingData({});
        setScreen('program');
        return;
      }
      alert('Network error. Please check your connection and try again.');
      setScreen('access');
    }
  }, [api, setProgram, setCurrentWeek, setCurrentDay, setDaysPerWeek, setTotalWeeks, setMaxes, setUser, setSavedWorkout, setPreviousWeekWorkout, setIsCustomWorkout, setCustomReason, setScreen, initializeTrackingFromSaved]);

  // --- Handlers ---

  const handleLoadProgram = useCallback((formData, isReturningUser) => {
    // Forms send { name, email, code, benchMax, squatMax, deadliftMax, cleanMax }
    const userData = {
      name: formData.name || '',
      email: formData.email,
      accessCode: formData.code,
      isReturningUser,
    };
    setUser(userData);

    const newMaxes = {
      bench: formData.benchMax || 0,
      squat: formData.squatMax || 0,
      deadlift: formData.deadliftMax || 0,
      clean: formData.cleanMax || 0,
    };
    setMaxes(newMaxes);

    if (isReturningUser) {
      // Skip consent, go straight to loading
      // Use setTimeout so state updates propagate before API call
      setTimeout(() => handleLoadProgramFromAPI(), 0);
    } else {
      setScreen('consent');
    }
  }, [setUser, setMaxes, setScreen, handleLoadProgramFromAPI]);

  const handleAcceptConsent = useCallback(() => {
    setConsentAccepted(true);
    setConsentTimestamp(new Date().toISOString());

    const questionnaireKey = `gwt_questionnaire_${user.accessCode}_${user.email}`;
    const alreadyDone = localStorage.getItem(questionnaireKey);

    if (!alreadyDone) {
      setScreen('questionnaire');
    } else {
      handleLoadProgramFromAPI();
    }
  }, [setConsentAccepted, setConsentTimestamp, user, setScreen, handleLoadProgramFromAPI]);

  const handleDeclineConsent = useCallback(() => {
    setScreen('access');
  }, [setScreen]);

  const handleSubmitQuestionnaire = useCallback(async (questionnaireData) => {
    try {
      await api.submitQuestionnaire({
        email: user.email,
        access_code: user.accessCode,
        name: user.name,
        pain_areas: painAreas,
        ...questionnaireData,
      });
      const questionnaireKey = `gwt_questionnaire_${user.accessCode}_${user.email}`;
      localStorage.setItem(questionnaireKey, 'true');
    } catch (err) {
      console.error('Questionnaire submit error:', err);
    }
    handleLoadProgramFromAPI();
  }, [api, user, painAreas, handleLoadProgramFromAPI]);

  const isMockMode = window.location.hostname === 'localhost';

  const handleNavigateDay = useCallback(async (direction) => {
    if (!daysPerWeek || !totalWeeks) return;

    let newWeek = currentWeek;
    let newDay = currentDay + direction;

    if (newDay > daysPerWeek) { newDay = 1; newWeek++; }
    if (newDay < 1) { newDay = daysPerWeek; newWeek--; }
    if (newWeek < 1) return;
    if (newWeek > totalWeeks) return;

    setCurrentWeek(newWeek);
    setCurrentDay(newDay);
    setTrackingData({});
    setRecommendations({});

    if (!isMockMode) {
      await handleLoadProgramFromAPI(newWeek, newDay);
    }
  }, [currentWeek, currentDay, daysPerWeek, totalWeeks, isMockMode, setCurrentWeek, setCurrentDay, setRecommendations, handleLoadProgramFromAPI]);

  const handleNavigateToDay = useCallback(async (week, day) => {
    if (week === currentWeek && day === currentDay) return;
    setCurrentWeek(week);
    setCurrentDay(day);
    setTrackingData({});
    setRecommendations({});
    if (!isMockMode) {
      await handleLoadProgramFromAPI(week, day);
    }
  }, [currentWeek, currentDay, isMockMode, setCurrentWeek, setCurrentDay, setRecommendations, handleLoadProgramFromAPI]);

  const handleLogWorkout = useCallback(async (clientNotes) => {
    try {
      // Build workout data formatted for the PHP email (flat arrays)
      const workoutData = {
        week: currentWeek,
        day: currentDay,
        blocks: program?.blocks?.map((block, blockIndex) => ({
          type: block.type || 'straight-set',
          trainerNotes: block.trainerNotes || block.notes || '',
          clientNotes: trackingData[`block-notes-${blockIndex}`] || '',
          exercises: block.exercises?.map((ex, exIndex) => {
            const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 1);

            // Build flat weights[] and actualReps[] arrays from tracking data
            const weights = [];
            const actualReps = [];
            for (let si = 0; si < setsCount; si++) {
              const trackedWeight = trackingData[`${blockIndex}-${exIndex}-${si}-weight`];
              const trackedReps = trackingData[`${blockIndex}-${exIndex}-${si}-reps`];
              // Fall back to preset weight from sets array
              const presetWeight = Array.isArray(ex.sets) && ex.sets[si] ? (ex.sets[si].weight || '') : '';
              const presetReps = Array.isArray(ex.sets) && ex.sets[si] ? (ex.sets[si].reps || '') : '';
              weights.push(trackedWeight || presetWeight || '');
              actualReps.push(trackedReps || presetReps || '');
            }

            const result = {
              name: ex.name || 'Unknown Exercise',
              sets: setsCount,
              targetReps: ex.reps || '',
              actualReps,
              weights,
              isPercentageBased: !!ex.isPercentageBased,
              percentages: ex.percentages || [],
              repsPerSet: ex.repsPerSet || [],
              scheme: ex.schemeName || ex.scheme || '',
              recommendation: recommendations[`${blockIndex}-${exIndex}`] || null,
            };

            return result;
          }),
        })) || [],
      };

      // Build chatbot conversation data for the email
      let chatbotData = null;
      if (chatbotRef.current) {
        const summary = chatbotRef.current.getConversationSummary();
        if (summary && summary.messages && summary.messages.length > 0) {
          // Group messages into sections: pain-related, general Q&A
          const painMessages = [];
          const responseMessages = [];
          let isPainSection = false;

          summary.messages.forEach(m => {
            const text = (m.text || '').replace(/<[^>]*>/g, '').trim(); // strip HTML
            if (!text) return;
            // Detect pain-related topics
            if (text.toLowerCase().includes('pain') || text.toLowerCase().includes('soreness') || text.toLowerCase().includes('massage') || text.toLowerCase().includes('myofascial')) {
              isPainSection = true;
            }
            if (isPainSection && m.isBot) {
              painMessages.push(text.substring(0, 300));
            } else if (!m.isBot) {
              responseMessages.push(text.substring(0, 200));
            }
          });

          const sections = [];
          if (responseMessages.length > 0) {
            sections.push({ title: 'Client Questions & Selections', type: 'responses', items: responseMessages });
          }
          if (painMessages.length > 0) {
            sections.push({ title: 'Pain / Recovery Guidance Viewed', type: 'pain', items: painMessages });
          }
          if (sections.length > 0) chatbotData = sections;
        }
      }

      let result;
      if (isMockMode) {
        // In dev mode, simulate successful log
        result = { success: true, data: {} };
      } else {
        result = await api.logWorkout({
          user_name: user.name,
          user_email: user.email,
          program_code: user.accessCode,
          program_name: program?.name || 'Workout',
          workout_data: workoutData,
          current_week: currentWeek,
          current_day: currentDay,
          days_per_week: daysPerWeek,
          total_weeks: totalWeeks,
          one_rm_bench: maxes.bench || null,
          one_rm_squat: maxes.squat || null,
          one_rm_deadlift: maxes.deadlift || null,
          one_rm_clean: maxes.clean || null,
          chatbot_data: chatbotData,
        });
      }

      if (result.success) {
        // Save exercise history to localStorage
        const historyKey = `gwt_history_${user.accessCode}_${user.email}`;
        try {
          const existing = JSON.parse(localStorage.getItem(historyKey) || '{}');
          existing[`w${currentWeek}d${currentDay}`] = {
            logged_at: new Date().toISOString(),
            data: workoutData,
          };
          localStorage.setItem(historyKey, JSON.stringify(existing));
        } catch { /* ignore */ }

        if (result.data?.program_complete) {
          setShowCompletionModal(true);
        } else {
          setShowCongratsModal(true);

          // Advance to next day/week from API response
          const nextWeek = result.data?.next_week;
          const nextDay = result.data?.next_day;
          if (nextWeek && nextDay) {
            // Load the next workout after a short delay so congrats modal shows first
            setTimeout(() => {
              setCurrentWeek(nextWeek);
              setCurrentDay(nextDay);
              setTrackingData({});
              setRecommendations({});
              handleLoadProgramFromAPI(nextWeek, nextDay);
            }, 2000);
          }
        }

        // If last day of week, prompt for game after delay
        if (currentDay === daysPerWeek) {
          setGameWeek(currentWeek);
          setTimeout(() => {
            setShowGamePrompt(true);
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Failed to log workout:', err);
    }
  }, [currentWeek, currentDay, program, trackingData, recommendations, api, user, daysPerWeek, totalWeeks, maxes, setCurrentWeek, setCurrentDay, setRecommendations, handleLoadProgramFromAPI]);

  const handleSubmitCompletion = useCallback(async (completionData) => {
    try {
      await api.submitCompletion({
        email: user.email,
        access_code: user.accessCode,
        name: user.name,
        ...completionData,
      });
    } catch (err) {
      console.error('Completion submit error:', err);
    }
    setShowCompletionModal(false);
  }, [api, user]);

  return (
    <div style={containerStyle}>
      {screen === 'access' && (
        <AccessScreen onLoadProgram={handleLoadProgram} />
      )}
      {screen === 'consent' && (
        <ConsentScreen
          onAccept={handleAcceptConsent}
          onDecline={handleDeclineConsent}
          userName={user.name}
        />
      )}
      {screen === 'questionnaire' && (
        <QuestionnaireScreen
          onSubmit={handleSubmitQuestionnaire}
          onOpenPainModal={() => setShowPainModal(true)}
        />
      )}
      {screen === 'program' && program && (
        <ProgramView
          program={program}
          userName={user.name}
          userEmail={user.email}
          currentWeek={currentWeek}
          currentDay={currentDay}
          daysPerWeek={daysPerWeek}
          totalWeeks={totalWeeks}
          maxes={maxes}
          savedWorkout={savedWorkout}
          previousWeekWorkout={previousWeekWorkout}
          isCustomWorkout={isCustomWorkout}
          customReason={customReason}
          recommendations={recommendations}
          onNavigate={handleNavigateDay}
          onNavigateToDay={handleNavigateToDay}
          onSetRecommendation={setRecommendation}
          isFirstDay={isFirstDay}
          isLastDay={isLastDay}
          onLogWorkout={handleLogWorkout}
          onLogout={logout}
          trackingData={trackingData}
          onUpdateTracking={handleUpdateTracking}
        />
      )}

      {/* Floating chatbot - on access and program screens */}
      {(screen === 'access' || screen === 'program') && (
        <WorkoutChatbot ref={chatbotRef} userName={user?.name || 'there'} screen={screen} />
      )}

      {/* Modals */}
      <PainModal
        isOpen={showPainModal}
        onClose={() => setShowPainModal(false)}
        selectedAreas={painAreas}
        onUpdateAreas={setPainAreas}
      />
      <CompletionModal
        isOpen={showCompletionModal}
        onSubmit={handleSubmitCompletion}
        onClose={() => setShowCompletionModal(false)}
      />
      <CongratulationsModal
        isOpen={showCongratsModal}
        onClose={() => setShowCongratsModal(false)}
      />
      {showGamePrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: "'Press Start 2P', Arial, cursive" }}>
          <div style={{ fontSize: 'clamp(18px, 5vw, 28px)', color: '#FFD700', textShadow: '3px 3px 0px #8B0000', marginBottom: 24, textAlign: 'center' }}>
            TEST YOUR MIGHT?
          </div>
          <div style={{ fontSize: 'clamp(10px, 2.5vw, 14px)', color: '#fff', marginBottom: 24, textAlign: 'center' }}>
            Week {gameWeek} &mdash; {getWeekConfig(gameWeek).fullName} 🥋
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => { setShowGamePrompt(false); setShowGame(true); }} style={{ padding: '14px 28px', fontFamily: "'Press Start 2P', cursive", fontSize: 'clamp(11px, 3vw, 14px)', background: '#228B22', border: '3px solid #FFD700', color: '#FFD700', cursor: 'pointer' }}>
              LET'S GO!
            </button>
            <button onClick={() => setShowGamePrompt(false)} style={{ padding: '14px 28px', fontFamily: "'Press Start 2P', cursive", fontSize: 'clamp(11px, 3vw, 14px)', background: '#8B0000', border: '3px solid #FFD700', color: '#FFD700', cursor: 'pointer' }}>
              SKIP
            </button>
          </div>
        </div>
      )}
      <TestYourMight
        isOpen={showGame}
        onClose={() => setShowGame(false)}
        weekNumber={gameWeek}
        benchMax={maxes.bench}
      />
    </div>
  );
}
