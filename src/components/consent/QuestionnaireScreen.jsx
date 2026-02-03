import React, { useState } from 'react';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    paddingTop: '40px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px 24px',
    maxWidth: '540px',
    margin: '0 auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  icon: {
    fontSize: '40px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  question: {
    marginBottom: '24px',
  },
  questionLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '10px',
    display: 'block',
  },
  optionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  optionBtn: {
    padding: '10px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    background: '#fff',
    color: '#444',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  optionBtnActivePurple: {
    padding: '10px 16px',
    border: '2px solid #764ba2',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  optionBtnActiveGreen: {
    padding: '10px 16px',
    border: '2px solid #2e7d32',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
    minHeight: '80px',
    boxSizing: 'border-box',
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
  },
  errorMsg: {
    background: '#fdecea',
    color: '#b71c1c',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  btnSubmit: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '17px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

const questions = [
  {
    key: 'goal',
    label: '1. What is your primary fitness goal?',
    type: 'single',
    options: [
      { value: 'lose_weight', label: 'Lose Weight' },
      { value: 'build_muscle', label: 'Build Muscle' },
      { value: 'athletic_performance', label: 'Athletic Performance' },
      { value: 'mobility', label: 'Improve Mobility' },
      { value: 'general_health', label: 'General Health' },
      { value: 'competition', label: 'Competition Prep' },
    ],
  },
  {
    key: 'fitnessLevel',
    label: '2. What is your current fitness level?',
    type: 'single',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
  {
    key: 'location',
    label: '3. Where do you primarily train?',
    type: 'single',
    options: [
      { value: 'commercial_gym', label: 'Commercial Gym' },
      { value: 'crossfit', label: 'CrossFit Box' },
      { value: 'home_gym', label: 'Home Gym' },
      { value: 'outside', label: 'Outside' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'equipment',
    label: '4. What equipment do you have access to? (select all)',
    type: 'multi',
    options: [
      { value: 'dumbbells', label: 'Dumbbells' },
      { value: 'barbells', label: 'Barbells' },
      { value: 'kettlebells', label: 'Kettlebells' },
      { value: 'bands', label: 'Resistance Bands' },
      { value: 'cardio', label: 'Cardio Machines' },
      { value: 'machines', label: 'Weight Machines' },
      { value: 'bodyweight', label: 'Bodyweight Only' },
    ],
  },
  {
    key: 'daysPerWeek',
    label: '5. How many days per week can you train?',
    type: 'single',
    options: [
      { value: '1-2', label: '1-2 Days' },
      { value: '3-4', label: '3-4 Days' },
      { value: '5-6', label: '5-6 Days' },
      { value: 'everyday', label: 'Everyday' },
    ],
  },
  {
    key: 'injuries',
    label: '6. Do you have any current injuries or pain?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    key: 'motivation',
    label: '7. What motivates you most?',
    type: 'single',
    options: [
      { value: 'health', label: 'Health & Longevity' },
      { value: 'mental', label: 'Mental Health' },
      { value: 'appearance', label: 'Appearance' },
      { value: 'sports', label: 'Sports Performance' },
      { value: 'lifestyle', label: 'Active Lifestyle' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'intensity',
    label: '8. How intense do you want your workouts?',
    type: 'single',
    options: [
      { value: 'challenging', label: 'Push Me Hard' },
      { value: 'moderate', label: 'Moderate Effort' },
      { value: 'easy', label: 'Keep It Light' },
    ],
  },
  {
    key: 'coachingStyle',
    label: '9. What coaching style do you prefer?',
    type: 'single',
    options: [
      { value: 'strict', label: 'Strict & Direct' },
      { value: 'motivational', label: 'Motivational' },
      { value: 'educational', label: 'Educational' },
      { value: 'mix', label: 'Mix of All' },
    ],
  },
];

export default function QuestionnaireScreen({ onSubmit, onOpenPainModal }) {
  const [responses, setResponses] = useState({});
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSingleSelect = (key, value) => {
    setResponses((prev) => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));

    // If injuries = yes, open pain modal
    if (key === 'injuries' && value === 'yes') {
      if (onOpenPainModal) onOpenPainModal();
    }
    // If injuries = no, clear any pain data
    if (key === 'injuries' && value === 'no') {
      setResponses((prev) => ({ ...prev, injuries: 'no', painData: null }));
    }
  };

  const handleMultiSelect = (key, value) => {
    setResponses((prev) => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const handleSubmit = () => {
    const requiredKeys = ['goal', 'fitnessLevel', 'location', 'equipment', 'daysPerWeek', 'injuries', 'motivation', 'intensity', 'coachingStyle'];
    const missing = requiredKeys.filter((key) => {
      const val = responses[key];
      if (Array.isArray(val)) return val.length === 0;
      return !val;
    });

    if (missing.length > 0) {
      setValidationError('Please answer all required questions before submitting.');
      return;
    }

    setValidationError('');
    onSubmit({ ...responses, additionalInfo });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>&#x1F4CB;</div>
          <h1 style={styles.title}>Fitness Intake</h1>
          <p style={styles.subtitle}>Help us personalize your experience</p>
        </div>

        {validationError && <div style={styles.errorMsg}>{validationError}</div>}

        {questions.map((q) => (
          <div key={q.key} style={styles.question}>
            <label style={styles.questionLabel}>{q.label}</label>
            <div style={styles.optionsGrid}>
              {q.options.map((opt) => {
                const isMulti = q.type === 'multi';
                const isActive = isMulti
                  ? (responses[q.key] || []).includes(opt.value)
                  : responses[q.key] === opt.value;

                const activeStyle = isMulti
                  ? styles.optionBtnActiveGreen
                  : styles.optionBtnActivePurple;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    style={isActive ? activeStyle : styles.optionBtn}
                    onClick={() =>
                      isMulti
                        ? handleMultiSelect(q.key, opt.value)
                        : handleSingleSelect(q.key, opt.value)
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={styles.question}>
          <label style={styles.questionLabel}>10. Anything else we should know?</label>
          <textarea
            style={styles.textarea}
            placeholder="Previous experience, time constraints, preferences..."
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
        </div>

        <button type="button" style={styles.btnSubmit} onClick={handleSubmit}>
          Submit Questionnaire
        </button>
      </div>
    </div>
  );
}
