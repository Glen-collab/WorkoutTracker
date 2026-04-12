import React, { useState, useEffect } from 'react';
import UserTypeSelection from './UserTypeSelection';
import NewUserForm from './NewUserForm';
import ReturningUserForm from './ReturningUserForm';

const SAVED_CREDS_KEY = 'gwt_saved_credentials';
const WELCOME_SEEN_KEY = 'gwt_welcome_seen';

// ── Welcome Walkthrough (first-time visitors only) ──
function WelcomeOverlay({ onDismiss }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: '\uD83C\uDFCB\uFE0F',
      title: 'Welcome to Be Strong Again',
      text: "This is your personal workout tracker. Your trainer has built a program just for you — this app is how you follow it, track your progress, and stay connected.",
    },
    {
      icon: '\uD83D\uDD11',
      title: 'Your Access Code',
      text: "Your trainer gave you a 4-digit access code. That code loads your specific program. If you came from our website, it may already be filled in for you.",
    },
    {
      icon: '\uD83D\uDCCA',
      title: 'Body Stats (Optional)',
      text: "We'll ask for basic info like height, weight, and age. This helps estimate your calories and scale your workouts. Fill in what you can — it's all optional and you can update it anytime.",
    },
    {
      icon: '\uD83C\uDFAF',
      title: 'Max Lifts (Optional)',
      text: "If you know your 1-rep max on bench, squat, or deadlift, you can enter it. Don't know it? That's completely normal — most people don't. These starter programs are designed to work for everyone regardless.",
    },
    {
      icon: '\u2696\uFE0F',
      title: 'Quick Waiver & Questionnaire',
      text: "Before your first workout, you'll review a short liability waiver and answer a few questions about your fitness background. This helps your trainer personalize your experience.",
    },
    {
      icon: '\uD83D\uDE80',
      title: "That's It — Let's Get Started!",
      text: "Tap New User if this is your first time, or Returning User if you've been here before. Your trainer is in your corner — let's get to work.",
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', maxWidth: '380px', width: '100%',
        padding: '32px 24px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{current.icon}</div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 10px' }}>{current.title}</h2>
        <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 24px' }}>{current.text}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: i === step ? '#667eea' : '#ddd',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: '12px 24px', border: '2px solid #e0e0e0', borderRadius: '10px',
                background: '#fff', color: '#666', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              }}
            >Back</button>
          )}
          <button
            onClick={() => isLast ? onDismiss() : setStep(step + 1)}
            style={{
              padding: '12px 32px', border: 'none', borderRadius: '10px',
              background: isLast ? 'linear-gradient(135deg, #4caf50, #2e7d32)' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}
          >{isLast ? "Let's Go!" : 'Next'}</button>
        </div>

        {!isLast && (
          <button
            onClick={onDismiss}
            style={{ background: 'none', border: 'none', color: '#999', fontSize: '12px', cursor: 'pointer', marginTop: '12px' }}
          >Skip</button>
        )}
      </div>
    </div>
  );
}

export default function AccessScreen({ onLoadProgram }) {
  // Check if user has saved credentials - skip straight to returning user form
  const savedCreds = (() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_CREDS_KEY) || 'null');
    } catch { return null; }
  })();

  const [view, setView] = useState(savedCreds ? 'returning' : 'selection'); // 'selection' | 'new' | 'returning'
  const [error, setError] = useState('');

  // Show welcome walkthrough for first-time visitors or users arriving from website (?code= in URL)
  const [showWelcome, setShowWelcome] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const fromWebsite = params.has('code');
    // Show if: never seen before, OR came from website and haven't seen it for this code
    const seenKey = fromWebsite ? WELCOME_SEEN_KEY + '_' + params.get('code') : WELCOME_SEEN_KEY;
    try {
      if (fromWebsite && !localStorage.getItem(seenKey)) return true;
      if (!savedCreds && !localStorage.getItem(WELCOME_SEEN_KEY)) return true;
      return false;
    } catch { return false; }
  });
  const dismissWelcome = () => {
    setShowWelcome(false);
    try { localStorage.setItem(WELCOME_SEEN_KEY, 'true'); } catch {}
  };

  // Wake up the backend while the user fills in the form (cold-start mitigation)
  useEffect(() => {
    fetch('/api/load-program.php', { method: 'POST', body: '{}' }).catch(() => {});
  }, []);

  const handleNewSubmit = (formData) => {
    setError('');
    onLoadProgram(formData, false);
  };

  const handleReturningSubmit = (formData) => {
    setError('');
    onLoadProgram(formData, true);
  };

  if (view === 'new') {
    return (
      <NewUserForm
        onSubmit={handleNewSubmit}
        onBack={() => { setView('selection'); setError(''); }}
        error={error}
      />
    );
  }

  if (view === 'returning') {
    return (
      <ReturningUserForm
        onSubmit={handleReturningSubmit}
        onBack={() => { setView('selection'); setError(''); }}
        error={error}
      />
    );
  }

  return (
    <>
      {showWelcome && <WelcomeOverlay onDismiss={dismissWelcome} />}
      <UserTypeSelection
        onNewUser={() => setView('new')}
        onReturningUser={() => setView('returning')}
      />
    </>
  );
}
