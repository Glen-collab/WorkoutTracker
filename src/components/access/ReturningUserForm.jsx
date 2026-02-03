import React, { useState } from 'react';
import { formatAccessCode } from '../../utils/trackerHelpers';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '20px',
    paddingTop: '40px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '36px 24px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  icon: {
    fontSize: '42px',
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
  error: {
    background: '#fdecea',
    color: '#b71c1c',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    marginBottom: '16px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  collapseHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f5f0ff',
    border: '2px solid #e8e0f5',
    borderRadius: '10px',
    padding: '14px 16px',
    cursor: 'pointer',
    marginBottom: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#5a3e8e',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  gridLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '4px',
  },
  gridInput: {
    width: '100%',
    minWidth: 0,
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btnSubmit: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
    color: '#fff',
    fontSize: '17px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  btnBack: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    background: 'transparent',
    color: '#666',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default function ReturningUserForm({ onSubmit, onBack, error }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [benchMax, setBenchMax] = useState('');
  const [squatMax, setSquatMax] = useState('');
  const [deadliftMax, setDeadliftMax] = useState('');
  const [cleanMax, setCleanMax] = useState('');
  const [showMaxes, setShowMaxes] = useState(false);
  const [showBodyStats, setShowBodyStats] = useState(false);
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');

  const handleCodeChange = (e) => {
    setCode(formatAccessCode(e.target.value));
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    setCode(formatAccessCode(pasted));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      email,
      code,
      benchMax: benchMax ? Number(benchMax) : null,
      squatMax: squatMax ? Number(squatMax) : null,
      deadliftMax: deadliftMax ? Number(deadliftMax) : null,
      cleanMax: cleanMax ? Number(cleanMax) : null,
      height: (heightFeet || heightInches) ? (Number(heightFeet || 0) * 12 + Number(heightInches || 0)) : null,
      weight: weight ? Number(weight) : null,
      age: age ? Number(age) : null,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>&#x1F44B;</div>
          <h1 style={styles.title}>Welcome Back!</h1>
          <p style={styles.subtitle}>Enter your credentials to continue</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email *</label>
          <input
            style={styles.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={styles.label}>Access Code *</label>
          <input
            style={styles.input}
            type="text"
            placeholder="XXXXX-XXXXX"
            value={code}
            onChange={handleCodeChange}
            onPaste={handlePaste}
            maxLength={11}
            required
          />

          <div
            style={styles.collapseHeader}
            onClick={() => setShowMaxes(!showMaxes)}
          >
            <span>&#x1F4AA; Update 1RM Values (Optional)</span>
            <span>{showMaxes ? '▲' : '▼'}</span>
          </div>

          {showMaxes && (
            <div style={styles.grid}>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Bench (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="0"
                  value={benchMax}
                  onChange={(e) => setBenchMax(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Squat (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="0"
                  value={squatMax}
                  onChange={(e) => setSquatMax(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Deadlift (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="0"
                  value={deadliftMax}
                  onChange={(e) => setDeadliftMax(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Clean (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="0"
                  value={cleanMax}
                  onChange={(e) => setCleanMax(e.target.value)}
                />
              </div>
            </div>
          )}

          <div
            style={styles.collapseHeader}
            onClick={() => setShowBodyStats(!showBodyStats)}
          >
            <span>&#x2696; Body Stats (Optional)</span>
            <span>{showBodyStats ? '\u25B2' : '\u25BC'}</span>
          </div>

          {showBodyStats && (
            <div style={styles.grid}>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Height (ft)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="5"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Height (in)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="10"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Weight (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="180"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Age</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="30"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>
          )}

          <button type="submit" style={styles.btnSubmit}>
            Load My Workout
          </button>
          <button type="button" style={styles.btnBack} onClick={onBack}>
            &#8592; Back
          </button>
        </form>
      </div>
    </div>
  );
}
