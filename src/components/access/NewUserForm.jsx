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
    transition: 'border-color 0.2s',
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

export default function NewUserForm({ onSubmit, onBack, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  });
  const [benchMax, setBenchMax] = useState('');
  const [squatMax, setSquatMax] = useState('');
  const [deadliftMax, setDeadliftMax] = useState('');
  const [cleanMax, setCleanMax] = useState('');
  const [showMaxes, setShowMaxes] = useState(false);
  const [gender, setGender] = useState('');
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
      name,
      email,
      code,
      benchMax: benchMax ? Number(benchMax) : null,
      squatMax: squatMax ? Number(squatMax) : null,
      deadliftMax: deadliftMax ? Number(deadliftMax) : null,
      cleanMax: cleanMax ? Number(cleanMax) : null,
      gender: gender || null,
      height: (heightFeet || heightInches) ? (Number(heightFeet || 0) * 12 + Number(heightInches || 0)) : null,
      weight: weight ? Number(weight) : null,
      age: age ? Number(age) : null,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>&#x2728;</div>
          <h1 style={styles.title}>Welcome! Let's Get You Set Up</h1>
          <p style={styles.subtitle}>This only takes a minute — and your trainer will use this info to personalize your program.</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Name *</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label style={styles.label}>Email *</label>
          <p style={{ fontSize: '12px', color: '#888', margin: '-4px 0 6px', lineHeight: '1.4' }}>Your trainer uses this to send you program updates and track your progress.</p>
          <input
            style={styles.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={styles.label}>Access Code *</label>
          <p style={{ fontSize: '12px', color: '#888', margin: '-4px 0 6px', lineHeight: '1.4' }}>This is the 4-digit code your trainer gave you. It loads your personalized program.</p>
          <input
            style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px', fontSize: '18px' }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder=""
            value={code}
            onChange={handleCodeChange}
            onPaste={handlePaste}
            maxLength={4}
            required
          />

          {/* Body Stats */}
          <div style={{ background: '#f0f7ff', border: '1px solid #d0e3f7', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <label style={{ ...styles.label, color: '#1565c0', marginBottom: '4px' }}>About You</label>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px', lineHeight: '1.4' }}>This helps us estimate calories, scale your workouts, and track your progress accurately. Fill in what you can — everything here is optional.</p>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setGender('M')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: gender === 'M' ? '2px solid #667eea' : '2px solid #e0e0e0',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                background: gender === 'M' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                color: gender === 'M' ? '#fff' : '#333',
              }}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => setGender('F')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: gender === 'F' ? '2px solid #667eea' : '2px solid #e0e0e0',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                background: gender === 'F' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                color: gender === 'F' ? '#fff' : '#333',
              }}
            >
              Female
            </button>
          </div>
          <div style={{ ...styles.grid, marginBottom: '16px' }}>
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
          </div>

          {/* 1RM Values - Collapsible, Optional */}
          <div
            style={styles.collapseHeader}
            onClick={() => setShowMaxes(!showMaxes)}
          >
            <span>&#x1F4AA; Max Lifts (Optional)</span>
            <span>{showMaxes ? '▲' : '▼'}</span>
          </div>

          {showMaxes && (
            <>
              <div style={{ background: '#faf5ff', border: '1px solid #e8d5f5', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
                <p style={{ fontSize: '13px', color: '#5a3e8e', margin: 0, lineHeight: '1.5' }}>
                  <strong>Don't know your max? That's totally fine.</strong> Most people don't — and these starter programs are designed to work for everyone regardless. Your trainer will help you figure these out over time. Leave them blank for now if you're not sure.
                </p>
              </div>
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
            </>
          )}

          <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', margin: '0 0 12px', lineHeight: '1.4' }}>
            Next you'll review a quick liability waiver and fitness questionnaire — then you're in.
          </p>
          <button type="submit" style={styles.btnSubmit}>
            Continue
          </button>
          <button type="button" style={styles.btnBack} onClick={onBack}>
            &#8592; Back
          </button>
        </form>
      </div>
    </div>
  );
}
