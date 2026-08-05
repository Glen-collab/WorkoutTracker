import React from 'react';

// Catches any render crash so a client never sees a blank white screen.
//
// A white screen mid-session is the worst failure this app has: the athlete is
// standing in the gym with a phone showing nothing, no idea whether it's their
// wifi, the QR, or the app, and no way to tell us what happened. This turns
// that into a readable message, a working way out, and — critically — the
// actual error text, so a screenshot from the gym floor is enough to debug it.
//
// Deliberately plain: no hooks, no imports, nothing that can itself fail.
export default class CrashScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep it in the console for anyone able to plug the phone in.
    console.error('[tracker crash]', error, info?.componentStack);
  }

  handleReset = () => {
    // Clear caches + service worker, then hard reload. Covers the common cause:
    // a half-updated install after a deploy.
    try {
      if ('caches' in window) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      }
      localStorage.removeItem('bsa_sw_build');
    } catch { /* nothing to do */ }
    setTimeout(() => window.location.reload(), 250);
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '28px 22px', textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ fontSize: '44px', marginBottom: '12px' }}>🔧</div>
        <h1 style={{ fontSize: '21px', fontWeight: 800, margin: '0 0 10px' }}>
          The app hit a snag
        </h1>
        <p style={{ fontSize: '15px', lineHeight: 1.55, maxWidth: '330px', margin: '0 0 22px', opacity: 0.9 }}>
          Your workout and everything you've logged are safe on our end. Tap below to reload —
          this usually clears it.
        </p>
        <button
          onClick={this.handleReset}
          style={{
            padding: '15px 34px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: '#fff', color: '#4554c9', fontSize: '16px', fontWeight: 800,
            boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
          }}
        >Reload the app</button>
        <details style={{ marginTop: '26px', fontSize: '12px', opacity: 0.75, maxWidth: '330px' }}>
          <summary style={{ cursor: 'pointer' }}>Show details for your coach</summary>
          <pre style={{
            textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            marginTop: '8px', fontSize: '11px', lineHeight: 1.4,
          }}>{String(this.state.error?.message || this.state.error)}</pre>
        </details>
      </div>
    );
  }
}
