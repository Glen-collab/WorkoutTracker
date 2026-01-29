import React, { useState } from 'react';
import UserTypeSelection from './UserTypeSelection';
import NewUserForm from './NewUserForm';
import ReturningUserForm from './ReturningUserForm';

export default function AccessScreen({ onLoadProgram }) {
  const [view, setView] = useState('selection'); // 'selection' | 'new' | 'returning'
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
