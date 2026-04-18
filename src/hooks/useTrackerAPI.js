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
        if (!response.ok) throw new Error('Server error: ' + response.status);
        const data = JSON.parse(text);
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
  const getWeeklyStats = useCallback((params) => apiCall('get-weekly-stats.php', params), [apiCall]);
  const getTravelWorkouts = useCallback((params) => apiCall('get-travel-workouts.php', params), [apiCall]);

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

  return { loading, error, loadProgram, loadUserOverride, logWorkout, submitQuestionnaire, submitCompletion, getWeeklyStats, getTravelWorkouts, getTrackerOverrides };
}
