import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { startSwAutoUpdate } from './swUpdate';
import CrashScreen from './components/common/CrashScreen';

const rootEl = document.getElementById('gwt-react-root') || document.getElementById('root');
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    {/* Never let a client stand in the gym looking at a blank white screen. */}
    <CrashScreen>
      <App />
    </CrashScreen>
  </React.StrictMode>
);

// The boot splash lives in index.html so something paints before this bundle
// even downloads. createRoot clears the container on first render, but remove
// it explicitly rather than depending on that.
document.getElementById('bsa-boot')?.remove();

// Self-heal stale installs (gym-TV Pi / long-open iPad) so deploys land reliably.
startSwAutoUpdate();
