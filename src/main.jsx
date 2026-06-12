import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { startSwAutoUpdate } from './swUpdate';

const rootEl = document.getElementById('gwt-react-root') || document.getElementById('root');
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Self-heal stale installs (gym-TV Pi / long-open iPad) so deploys land reliably.
startSwAutoUpdate();
