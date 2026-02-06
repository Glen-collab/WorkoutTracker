import React, { useState, useEffect } from 'react';
import UserTypeSelection from './UserTypeSelection';
import NewUserForm from './NewUserForm';
import ReturningUserForm from './ReturningUserForm';

const SAVED_CREDS_KEY = 'gwt_saved_credentials';

export default function AccessScreen({ onLoadProgram }) {
  // Check if user has saved credentials - skip straight to returning user form
  const savedCreds = (() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_CREDS_KEY) || 'null');
    } catch { return null; }
  })();

  const [view, setView] = useState(savedCreds ? 'returning' : 'selection'); // 'selection' | 'new' | 'returning'
  const [error, setError] = useState('');

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
    <UserTypeSelection
      onNewUser={() => setView('new')}
      onReturningUser={() => setView('returning')}
    />
  );
}
