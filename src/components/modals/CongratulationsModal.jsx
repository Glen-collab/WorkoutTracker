import React, { useMemo } from 'react';

const QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Strength does not come from winning. Your struggles develop your strengths.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Success is what comes after you stop making excuses.",
  "Your body can stand almost anything. It's your mind that you have to convince.",
  "Champions are made when nobody is watching.",
  "The iron never lies. Two hundred pounds is always two hundred pounds.",
  "Discipline is choosing between what you want now and what you want most.",
];

export default function CongratulationsModal({ isOpen, onClose }) {
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [isOpen]);

  if (!isOpen) return null;

  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(135deg, rgba(102,126,234,0.95), rgba(118,75,162,0.95))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: 16, fontFamily: 'Arial, sans-serif',
  };

  const card = {
    textAlign: 'center', color: '#fff', maxWidth: 360, padding: 32,
  };

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>&#127881;</div>
        <h2 style={{ fontSize: 28, margin: '0 0 8px', fontWeight: 'bold' }}>Workout Logged!</h2>
        <p style={{ fontSize: 16, opacity: 0.9, margin: '0 0 24px' }}>
          Great work! Your trainer has been notified.
        </p>
        <p style={{ fontSize: 14, fontStyle: 'italic', opacity: 0.8, margin: '0 0 32px', lineHeight: 1.5 }}>
          "{quote}"
        </p>
        <button
          onClick={onClose}
          style={{
            background: '#fff', color: '#764ba2', border: 'none', borderRadius: 24,
            padding: '12px 40px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
