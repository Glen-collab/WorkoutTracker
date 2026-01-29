import React from 'react';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px 28px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#666',
    margin: '0 0 28px 0',
  },
  btnPurple: {
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
  btnGreen: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
    color: '#fff',
    fontSize: '17px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '24px',
  },
  infoCard: {
    background: '#f0f0ff',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'left',
  },
  infoTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#667eea',
    margin: '0 0 8px 0',
  },
  infoText: {
    fontSize: '13px',
    color: '#555',
    margin: '0',
    lineHeight: '1.6',
  },
};

export default function UserTypeSelection({ onNewUser, onReturningUser }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>&#x1F510;</div>
        <h1 style={styles.title}>Welcome to Your Workout Tracker</h1>
        <p style={styles.subtitle}>Choose how you'd like to continue:</p>

        <button style={styles.btnPurple} onClick={onNewUser}>
          New User
        </button>
        <button style={styles.btnGreen} onClick={onReturningUser}>
          Returning User
        </button>

        <div style={styles.infoCard}>
          <p style={styles.infoTitle}>First Time Here?</p>
          <p style={styles.infoText}>
            If this is your first visit, tap <strong>New User</strong> and enter the access code
            provided by your trainer. You'll set up your profile and get started with your
            personalized program. If you've been here before, tap <strong>Returning User</strong> to
            pick up where you left off.
          </p>
        </div>
      </div>
    </div>
  );
}
