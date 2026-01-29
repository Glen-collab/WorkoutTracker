import { useState, useCallback } from 'react';

const API_BASE = (window.gwtConfig && window.gwtConfig.apiBase) || 'https://bestrongagain.com/workout-programs/api/general/';

export default function useTrackerAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, body) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const text = await response.text();
      if (!response.ok) throw new Error('Server error: ' + response.status);
      const data = JSON.parse(text);
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  const loadProgram = useCallback((params) => apiCall('load-program.php', params), [apiCall]);
  const loadUserOverride = useCallback((params) => apiCall('load-user-override.php', params), [apiCall]);
  const logWorkout = useCallback((params) => apiCall('log-workout.php', params), [apiCall]);
  const submitQuestionnaire = useCallback((params) => apiCall('submit-questionnaire.php', params), [apiCall]);
  const submitCompletion = useCallback((params) => apiCall('submit-completion.php', params), [apiCall]);

  return { loading, error, loadProgram, loadUserOverride, logWorkout, submitQuestionnaire, submitCompletion };
}
