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
  // Whenever the user lands back on Access (logout / relogin / new tab),
  // drop any lingering cast session from sessionStorage so the pill
  // doesn't auto-reappear on the next program screen. A re-login is a
  // clean slate — if they still want to cast, they re-pair a fresh code.
  useEffect(() => {
    try { sessionStorage.removeItem('bsa_cast_pair'); } catch {}
    try { window.dispatchEvent(new CustomEvent('bsa:cast-change', { detail: null })); } catch {}
  }, []);

  // Check if user has saved credentials - skip straight to returning user form
  const savedCreds = (() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_CREDS_KEY) || 'null');
    } catch { return null; }
  })();

  const [view, setView] = useState(savedCreds ? 'returning' : 'selection'); // 'selection' | 'new' | 'returning'
  const [error, setError] = useState('');

  // Show welcome walkthrough for first-time visitors or users arriving from website (?code= in URL)
  // Once per PERSON, not once per program.
  //
  // The key used to include the access code, so scanning a different gym TV
  // counted as a brand-new first visit and replayed the whole walkthrough — for
  // a client alternating between two programs, every single session. It also
  // ignored saved credentials, so a returning athlete arriving by QR got it
  // again regardless. Anyone we already recognise on this device has been here
  // before; the server flag (seeded on program load) covers new devices.
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      if (savedCreds) return false;
      return !localStorage.getItem(WELCOME_SEEN_KEY);
    } catch { return false; }
  });
  const dismissWelcome = () => {
    setShowWelcome(false);
    try { localStorage.setItem(WELCOME_SEEN_KEY, 'true'); } catch {}
  };

  // Wake up the backend while the user fills in the form (cold-start mitigation).
  // Must be the absolute Flask URL: a relative /api/* path goes through the
  // Netlify proxy to the retired WordPress host and 403s, warming nothing.
  // /api/health is GET-only and hits the DB, so it warms the connection pool too.
  useEffect(() => {
    fetch('https://app.bestrongagain.com/api/health').catch(() => {});
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
