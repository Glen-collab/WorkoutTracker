// useCastSync.js
// When the tracker successfully casts, we stash the pair_code in sessionStorage.
// This hook reads it, pushes this device's scroll position (as a 0..1 fraction of
// scrollable height) to the backend whenever the user scrolls, and exposes
// helpers to stop the cast from anywhere in the app.

import { useEffect, useState, useCallback, useRef } from 'react';

const CAST_API = 'https://app.bestrongagain.com/api/cast';
const STORAGE_KEY = 'bsa_cast_pair';

// Debounce helper
function useDebouncedPush(active, pairCode) {
  const timerRef = useRef(null);
  const lastSentRef = useRef(-1);

  useEffect(() => {
    if (!active || !pairCode) return;

    const pushNow = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const frac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      // Only push if fraction changed meaningfully (avoid spam)
      if (Math.abs(frac - lastSentRef.current) < 0.02) return;
      lastSentRef.current = frac;
      fetch(CAST_API + '/scroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair_code: pairCode, scroll_frac: frac }),
        keepalive: true,
      }).catch(() => {});
    };

    // Fire on scroll-END — wait until scrolling has settled for 350ms before
    // sending to the backend. Avoids flooding the TV during flick-scrolls and
    // layout-shift scroll bursts triggered by opening a video on mobile Safari.
    const onScroll = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        pushNow();
      }, 350);
    };

    // Push once immediately so the TV lands at the right spot the moment it binds
    pushNow();

    window.addEventListener('scroll', onScroll, { passive: true });
    // Also push on resize (scrollable height can change)
    window.addEventListener('resize', onScroll);
    return () => {
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [active, pairCode]);
}

export default function useCastSync() {
  const [pairCode, setPairCodeState] = useState(() => sessionStorage.getItem(STORAGE_KEY) || null);

  // Listen for other tabs/components setting the cast pair
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setPairCodeState(e.newValue || null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Verify the cached pair_code is still alive on the backend. If the TV closed
  // or the session expired, clear silently so the pill doesn't linger on refresh.
  useEffect(() => {
    if (!pairCode) return;
    let cancelled = false;
    const verify = async () => {
      try {
        const r = await fetch(`${CAST_API}/poll/${pairCode}`);
        const d = await r.json();
        if (cancelled) return;
        // Clear if session is truly gone. `bound:false` on its own is fine —
        // that just means paired but not yet pushed; only an explicit `expired`
        // or missing bound flag + missing bound state warrants clearing.
        if (d.expired) {
          sessionStorage.removeItem(STORAGE_KEY);
          setPairCodeState(null);
        }
      } catch {
        // network hiccup — leave it; user can tap Stop if they need to force-clear
      }
    };
    verify();
    const iv = setInterval(verify, 60_000); // re-check every minute
    return () => { cancelled = true; clearInterval(iv); };
  }, [pairCode]);

  // Push scroll position while active
  useDebouncedPush(!!pairCode, pairCode);

  const startCast = useCallback((code) => {
    sessionStorage.setItem(STORAGE_KEY, code);
    setPairCodeState(code);
  }, []);

  const castPlay = useCallback(async (exercise) => {
    const code = sessionStorage.getItem(STORAGE_KEY);
    if (!code) return;
    try {
      await fetch(CAST_API + '/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair_code: code, exercise: exercise || null }),
        keepalive: true,
      });
    } catch {}
  }, []);

  const stopCast = useCallback(async () => {
    const code = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setPairCodeState(null);
    if (code) {
      try {
        await fetch(CAST_API + '/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pair_code: code }),
          keepalive: true,
        });
      } catch {}
    }
  }, []);

  return { pairCode, startCast, stopCast, castPlay };
}
