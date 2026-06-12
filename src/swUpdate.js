// swUpdate.js — keep the tracker from running stale code on long-lived installs
// (gym-TV Pi, the 1-on-1 iPad left open for hours). vite-plugin-pwa is set to
// autoUpdate, but the browser only checks for a new service worker
// occasionally, so a deploy can sit unseen — which already bit us (a stale build
// 403'd a session recap and broke the weight autofill).
//
// This nudges the service worker to check for a new build on load, on focus
// (the iOS "resume" case), and every few minutes. When a new SW takes control
// (skipWaiting is on), reload so the fresh code is live. Guarded so the very
// first install never triggers a reload, and only one reload per page life.

export function startSwAutoUpdate() {
  if (!('serviceWorker' in navigator)) return;
  if (window.location.hostname === 'localhost') return;

  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) return;   // first-ever claim shouldn't reload
    refreshing = true;
    window.location.reload();
  });

  const check = () =>
    navigator.serviceWorker.getRegistration()
      .then((reg) => reg && reg.update())
      .catch(() => {});

  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  window.addEventListener('focus', check);
  setInterval(check, 3 * 60 * 1000);
  setTimeout(check, 4000);
}
