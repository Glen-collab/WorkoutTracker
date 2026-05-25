import React, { useState } from 'react';

const BENEFITS = [
  { icon: '📊', title: 'Personal Dashboard', desc: 'Track your tonnage, calories, and progress over time with detailed charts.' },
  { icon: '💬', title: 'Coach Messaging', desc: 'Direct message your coach for form checks, questions, and program adjustments.' },
  { icon: '🏆', title: 'Monthly Challenges', desc: 'Compete in 4-week challenges against other members. Volume kings, session streaks, and more.' },
  { icon: '⚡', title: 'Priority Updates', desc: 'First access to new programs, features, and training content.' },
];

export default function TransitionSurveyModal({ isOpen, onComplete, onDismiss, userEmail, userName }) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [likelihood, setLikelihood] = useState(0);
  const [improvements, setImprovements] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [graceEndsAt, setGraceEndsAt] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const apiBase = window.gwtConfig?.apiBase || 'https://app.bestrongagain.com/api/workout/';
      const res = await fetch(apiBase + 'submit-survey.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          user_name: userName,
          rating,
          improvements,
          continue_likelihood: likelihood,
          comments,
        }),
      });
      const data = await res.json();
      if (data.grace_ends_at) {
        setGraceEndsAt(new Date(data.grace_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
      }
      setStep(4);
    } catch (err) {
      console.error('Survey submit error:', err);
      setStep(4);
      setGraceEndsAt('4 weeks from now');
    } finally {
      setSubmitting(false);
    }
  };

  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, padding: 16,
  };
  const modal = {
    background: '#1e1e2f', borderRadius: 16, width: '100%', maxWidth: 440,
    maxHeight: '90vh', overflow: 'auto', color: '#fff', fontFamily: 'Arial, sans-serif',
  };
  const header = {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: '20px', borderRadius: '16px 16px 0 0', textAlign: 'center',
    fontSize: 20, fontWeight: 'bold',
  };
  const body = { padding: 20 };
  const textareaStyle = {
    width: '100%', minHeight: 70, background: '#2a2a3e', color: '#fff',
    border: '1px solid #444', borderRadius: 8, padding: 10, fontSize: 14,
    resize: 'vertical', boxSizing: 'border-box', marginBottom: 16,
  };
  const primaryBtn = {
    width: '100%', padding: '14px', border: 'none', borderRadius: 24,
    background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
    fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginBottom: 8,
  };
  const skipBtn = {
    width: '100%', padding: '10px', background: 'none',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
    color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer',
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          {step <= 2 ? '📋 Quick Feedback' : step === 3 ? '🚀 What\'s Coming' : '✅ You\'re All Set'}
        </div>
        <div style={body}>

          {step === 1 && (<>
            <p style={{ textAlign: 'center', fontSize: 15, color: '#ccc', marginBottom: 20, lineHeight: 1.5 }}>
              We'd love to hear how your experience has been so far!
            </p>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8 }}>How would you rate Be Strong Again?</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button" key={star}
                    onClick={() => setRating(star)}
                    onTouchEnd={(e) => { e.preventDefault(); setRating(star); }}
                    style={{
                      fontSize: 36, cursor: 'pointer', display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center',
                      width: 48, height: 48, padding: 0,
                      background: 'transparent', border: 'none',
                      color: star <= rating ? '#ffc107' : '#555',
                      transition: 'color 0.15s, transform 0.1s',
                      transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >★</button>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: '#aaa', marginBottom: 10 }}>How likely are you to continue training? (1-10)</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button
                    type="button" key={n}
                    onClick={() => setLikelihood(n)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: 'none',
                      background: n <= likelihood ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#2a2a3e',
                      color: '#fff', fontSize: 14, fontWeight: '700', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>

            <button
              style={{ ...primaryBtn, opacity: rating > 0 && likelihood > 0 ? 1 : 0.4 }}
              disabled={rating === 0 || likelihood === 0}
              onClick={() => setStep(2)}
            >Next</button>
            <button style={skipBtn} onClick={onDismiss}>I'll do this later</button>
          </>)}

          {step === 2 && (<>
            <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 6 }}>
              What would you improve about the app?
            </label>
            <textarea style={textareaStyle} value={improvements} onChange={e => setImprovements(e.target.value)} placeholder="Any features, exercises, or changes you'd like to see..." />

            <label style={{ fontSize: 14, color: '#aaa', display: 'block', marginBottom: 6 }}>
              Any other comments?
            </label>
            <textarea style={textareaStyle} value={comments} onChange={e => setComments(e.target.value)} placeholder="Optional..." />

            <button style={primaryBtn} onClick={() => setStep(3)}>Next</button>
            <button style={skipBtn} onClick={() => setStep(1)}>Back</button>
          </>)}

          {step === 3 && (<>
            <p style={{ textAlign: 'center', fontSize: 15, color: '#ccc', marginBottom: 20, lineHeight: 1.5 }}>
              Here's what BSA subscribers get access to:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {BENEFITS.map((b, i) => (
                <div key={i} style={{
                  background: '#2a2a3e', borderRadius: 12, padding: '14px 16px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: 14, marginBottom: 4 }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#aaa', marginBottom: 16 }}>
              All included with your <b style={{ color: '#ffc107' }}>$20/month</b> membership.
            </p>
            <button style={primaryBtn} disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting...' : 'Submit & Start My Free Trial'}
            </button>
            <button style={skipBtn} onClick={() => setStep(2)}>Back</button>
          </>)}

          {step === 4 && (<>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <p style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Thanks for your feedback!</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 20 }}>
                You have <b style={{ color: '#22c55e' }}>4 weeks of free access</b> to try everything out.
                {graceEndsAt && <><br />Your free trial runs through <b>{graceEndsAt}</b>.</>}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.5 }}>
                After that, a $20/month subscription keeps your programs, challenges, and dashboard active.
              </p>
            </div>
            <button style={primaryBtn} onClick={() => {
              try { localStorage.setItem(`gwt_survey_done_${userEmail}`, 'true'); } catch {}
              onComplete(graceEndsAt);
            }}>
              Got It — Let's Train!
            </button>
          </>)}
        </div>
      </div>
    </div>
  );
}
