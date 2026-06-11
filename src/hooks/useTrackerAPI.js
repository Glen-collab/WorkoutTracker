import { useState, useCallback } from 'react';

const API_BASE = 'https://app.bestrongagain.com/api/workout/';
const MEDIA_API_BASE = 'https://app.bestrongagain.com/api/media/';

export default function useTrackerAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, body, maxRetries = 2) => {
    setLoading(true);
    setError(null);
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(API_BASE + endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const text = await response.text();
        const data = JSON.parse(text);
        if (!response.ok) {
          if (data.payment_required) {
            setLoading(false);
            return data;
          }
          throw new Error(data.message || 'Server error: ' + response.status);
        }
        setLoading(false);
        return data;
      } catch (err) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        setLoading(false);
        setError(err.message);
        throw err;
      }
    }
  }, []);

  const loadProgram = useCallback((params) => apiCall('load-program.php', params), [apiCall]);
  const loadUserOverride = useCallback((params) => apiCall('load-user-override.php', params), [apiCall]);
  const logWorkout = useCallback((params) => apiCall('log-workout.php', params), [apiCall]);
  const submitQuestionnaire = useCallback((params) => apiCall('submit-questionnaire.php', params, 0), [apiCall]);
  const submitCompletion = useCallback((params) => apiCall('submit-completion.php', params), [apiCall]);
  // 1-on-1 only: email the client a session recap + coach notes (coach reviews first).
  const sendSessionRecap = useCallback((params) => apiCall('send-session-recap.php', params, 1), [apiCall]);
  const getWeeklyStats = useCallback((params) => apiCall('get-weekly-stats.php', params), [apiCall]);
  const getTravelWorkouts = useCallback((params) => apiCall('get-travel-workouts.php', params), [apiCall]);
  // Persist in-app edits to 1RM maxes + body stats (single retry — best-effort).
  const updateUserStats = useCallback((params) => apiCall('update-user-stats.php', params, 1), [apiCall]);

  // Fetches coach's / featured_global video overrides for the current user.
  // Plain fetch (separate host path, no retry needed — failure = fall back to bundled videos).
  const getTrackerOverrides = useCallback(async (email) => {
    try {
      const r = await fetch(MEDIA_API_BASE + 'tracker-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) return { overrides: {} };
      return await r.json();
    } catch {
      return { overrides: {} };
    }
  }, []);

  return { loading, error, loadProgram, loadUserOverride, logWorkout, submitQuestionnaire, submitCompletion, sendSessionRecap, getWeeklyStats, getTravelWorkouts, getTrackerOverrides, updateUserStats };
}
