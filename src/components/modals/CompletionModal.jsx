import React, { useState } from 'react';

const INTEREST_OPTIONS = [
  { id: 'strength', label: 'Strength Training' },
  { id: 'muscle', label: 'Muscle Building' },
  { id: 'weight_loss', label: 'Weight Loss' },
  { id: 'athletic', label: 'Athletic Performance' },
  { id: 'mobility', label: 'Mobility & Flexibility' },
  { id: 'other', label: 'Other' },
];

export default function CompletionModal({ isOpen, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [improvements, setImprovements] = useState('');
  const [interests, setInterests] = useState(new Set());
  const [comments, setComments] = useState('');

  if (!isOpen) return null;

  const toggleInterest = (id) => {
    setInterests(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    onSubmit({
      rating,
      improvements,
      interests: Array.from(interests),
      comments,
    });
  };

  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, padding: 16,
  };

  const modal = {
    background: '#1e1e2f', borderRadius: 16, width: '100%', maxWidth: 440,
    maxHeight: '90vh', overflow: 'auto', color: '#fff', fontFamily: 'Arial, sans-serif',
  };

  const header = {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: '20px', borderRadius: '16px 16px 0 0', textAlign: 'center',
    fontSize: 22, fontWeight: 'bold',
  };

  const textareaStyle = {
    width: '100%', minHeight: 60, background: '#2a2a3e', color: '#fff',
    border: '1px solid #444', borderRadius: 8, padding: 10, fontSize: 14,
    resize: 'vertical', boxSizing: 'border-box', marginBottom: 16,
  };

  const displayRating = rating;

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>&#127891; Program Complete!</div>
        <div style={{ padding: 20 }}>
          <p style={{ textAlign: 'center', fontSize: 16, color: '#ccc', marginBottom: 20 }}>
            Congratulations on finishing your program! We would love your feedback.
          </p>

          {/* Star Rating */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8 }}>Rate your experience:</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onTouchEnd={(e) => { e.preventDefault(); setRating(star); }}
                  style={{
                    fontSize: 36, cursor: 'pointer', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center',
                    width: 48, height: 48, padding: 0,
                    background: 'transparent', border: 'none',
                    color: star <= displayRating ? '#ffc107' : '#555',
                    transition: 'color 0.15s, transform 0.1s',
                    transform: star <= displayRating ? 'scale(1.1)' : 'scale(1)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 6 }}>
            What could be improved?
          </label>
          <textarea style={textareaStyle} value={improvements} onChange={e => setImprovements(e.target.value)} placeholder="Your feedback..." />

          {/* Interests */}
          <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 8 }}>
            What are you interested in next?
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {INTEREST_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => toggleInterest(opt.id)}
                style={{
                  background: interests.has(opt.id) ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#2a2a3e',
                  color: '#fff', border: interests.has(opt.id) ? 'none' : '1px solid #555',
                  borderRadius: 20, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Comments */}
          <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 6 }}>
            Additional comments
          </label>
          <textarea style={textareaStyle} value={comments} onChange={e => setComments(e.target.value)} placeholder="Anything else..." />

          <button
            onClick={handleSubmit}
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: 24,
              background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
              fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
