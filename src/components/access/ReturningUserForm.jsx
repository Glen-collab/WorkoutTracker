import React, { useState, useEffect } from 'react';
import { formatAccessCode } from '../../utils/trackerHelpers';
import HelpTip from '../common/HelpTip';
import { lookupUserProfile } from '../../hooks/useTrackerAPI';

const SAVED_CREDS_KEY = 'gwt_saved_credentials';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '20px',
    paddingTop: '40px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '36px 24px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  icon: {
    fontSize: '42px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  error: {
    background: '#fdecea',
    color: '#b71c1c',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    marginBottom: '16px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  collapseHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f5f0ff',
    border: '2px solid #e8e0f5',
    borderRadius: '10px',
    padding: '14px 16px',
    cursor: 'pointer',
    marginBottom: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#5a3e8e',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  gridLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '4px',
  },
  gridInput: {
    width: '100%',
    minWidth: 0,
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btnSubmit: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
    color: '#fff',
    fontSize: '17px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  btnBack: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    background: 'transparent',
    color: '#666',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default function ReturningUserForm({ onSubmit, onBack, error }) {
  // Load saved credentials from localStorage
  const savedCreds = (() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_CREDS_KEY) || 'null');
    } catch { return null; }
  })();

  const [email, setEmail] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('email') || savedCreds?.email || '';
  });
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || savedCreds?.code || '';
  });
  const [benchMax, setBenchMax] = useState('');
  const [squatMax, setSquatMax] = useState('');
  const [deadliftMax, setDeadliftMax] = useState('');
  const [cleanMax, setCleanMax] = useState('');
  const [showMaxes, setShowMaxes] = useState(false);
  const [showBodyStats, setShowBodyStats] = useState(false);
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');

  const [recalled, setRecalled] = useState(false);
  const [myPrograms, setMyPrograms] = useState([]);
  const recallKeyRef = React.useRef('');
  // The code that arrived in the URL — i.e. scanned off the gym TV.
  const scannedCode = React.useMemo(() => {
    const c = new URLSearchParams(window.location.search).get('code') || '';
    return c.replace(/\D/g, '');
  }, []);
  // Which email the numbers currently on screen belong to.
  const filledForRef = React.useRef('');

  // Changing the email means "I'm a different person now" — so wipe the numbers.
  //
  // Without this they just sat there: pull up one athlete, get their maxes and
  // body stats recalled, retype the email as someone else, submit — and the
  // FIRST athlete's stats were written onto the second one's record. That
  // happened for real (a coach's height/weight/age overwrote a client's), and
  // on a shared phone or kiosk it would happen constantly.
  //
  // Clearing on any change, including deleting the email entirely, also gives
  // an obvious way to start clean. The recall below refills from the server the
  // moment a valid email + code is present again.
  useEffect(() => {
    const norm = String(email || '').trim().toLowerCase();
    if (!filledForRef.current || norm === filledForRef.current) return;
    filledForRef.current = '';
    recallKeyRef.current = '';
    setRecalled(false);
    setBenchMax(''); setSquatMax(''); setDeadliftMax(''); setCleanMax('');
    setHeightFeet(''); setHeightInches(''); setWeight(''); setAge('');
  }, [email]);

  // Pull this athlete's saved maxes + body stats back from the server as soon as
  // we know who they are.
  //
  // These used to live ONLY in localStorage, which loses them in the two ways
  // clients actually hit: an iOS PWA added to the home screen gets its own
  // storage separate from Safari (and reinstalling wipes it), and arriving via
  // the gym-TV QR means the device has no history at all — the TV can only put
  // the program code in the QR, since it has no idea who is about to scan it.
  //
  // Only fills fields the client hasn't typed into, so it can never fight them
  // mid-entry, and it opens the sections so the numbers are visibly there
  // rather than hidden behind a collapsed panel.
  useEffect(() => {
    const cleanCode = String(code || '').replace(/\D/g, '');
    const cleanEmail = String(email || '').trim();
    if (cleanCode.length < 4 || !cleanEmail.includes('@')) return undefined;
    const key = `${cleanEmail.toLowerCase()}|${cleanCode}`;
    if (recallKeyRef.current === key) return undefined; // already handled
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await lookupUserProfile({ email: cleanEmail, code: cleanCode });
      if (cancelled) return;
      recallKeyRef.current = key;
      if (Array.isArray(res?.programs)) setMyPrograms(res.programs);
      if (!res?.found || !res.profile) return;
      const p = res.profile;
      const num = (v) => (v === null || v === undefined ? '' : String(Math.round(Number(v) * 100) / 100));
      let filledMax = false, filledBody = false;
      const setIfBlank = (cur, setter, val, isBody) => {
        if (cur !== '' || val === null || val === undefined) return;
        setter(num(val));
        if (isBody) filledBody = true; else filledMax = true;
      };
      setIfBlank(benchMax, setBenchMax, p.benchMax, false);
      setIfBlank(squatMax, setSquatMax, p.squatMax, false);
      setIfBlank(deadliftMax, setDeadliftMax, p.deadliftMax, false);
      setIfBlank(cleanMax, setCleanMax, p.cleanMax, false);
      if (p.height !== null && p.height !== undefined && heightFeet === '' && heightInches === '') {
        setHeightFeet(String(Math.floor(Number(p.height) / 12)));
        setHeightInches(String(Math.round(Number(p.height) % 12)));
        filledBody = true;
      }
      setIfBlank(weight, setWeight, p.weight, true);
      setIfBlank(age, setAge, p.age, true);
      // Remember whose numbers are on screen, so the effect above can wipe them
      // if the email is edited to someone else.
      filledForRef.current = cleanEmail.toLowerCase();
      if (filledMax) setShowMaxes(true);
      if (filledBody) setShowBodyStats(true);
      if (filledMax || filledBody) setRecalled(true);
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, code]);

  const handleCodeChange = (e) => {
    setCode(formatAccessCode(e.target.value));
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    setCode(formatAccessCode(pasted));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      email,
      code,
      benchMax: benchMax ? Number(benchMax) : null,
      squatMax: squatMax ? Number(squatMax) : null,
      deadliftMax: deadliftMax ? Number(deadliftMax) : null,
      cleanMax: cleanMax ? Number(cleanMax) : null,
      height: (heightFeet || heightInches) ? (Number(heightFeet || 0) * 12 + Number(heightInches || 0)) : null,
      weight: weight ? Number(weight) : null,
      age: age ? Number(age) : null,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>&#x1F44B;</div>
          <h1 style={styles.title}>Welcome Back!</h1>
          <p style={styles.subtitle}>Enter your credentials to continue</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* The gym-TV QR carries whichever program is on the BOARD, not this
            athlete's. A Legacy athlete scanning on a Prime day was silently put
            into Prime — and since the tracker only ever shows the workout, not
            which program it came from, the switch was invisible until something
            reloaded and dropped them back into their own. Name both and let
            them choose. Only appears when they genuinely differ. */}
        {myPrograms.length > 1 && scannedCode && myPrograms.some(p => p.code === scannedCode)
          && myPrograms[0].code !== scannedCode && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px',
            padding: '12px 14px', marginBottom: '14px', fontSize: '13px', color: '#78350f', lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Which workout today?</div>
            {[myPrograms.find(p => p.code === scannedCode), myPrograms[0]].filter(Boolean).map((p, i) => (
              <button
                key={p.code}
                type="button"
                onClick={() => setCode(p.code)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', marginBottom: '6px',
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  border: code.replace(/\D/g, '') === p.code ? '2px solid #d97706' : '1px solid #e5e7eb',
                  background: code.replace(/\D/g, '') === p.code ? '#fef3c7' : '#fff',
                  fontSize: '13px', fontWeight: 600, color: '#1a1a2e',
                }}
              >
                {p.name}{p.nickname ? ` — ${p.nickname}` : ''}
                <span style={{ display: 'block', fontWeight: 500, fontSize: '11.5px', color: '#92400e', marginTop: '2px' }}>
                  {i === 0 ? 'scanned from the gym screen' : 'the one you were on last'}
                </span>
              </button>
            ))}
          </div>
        )}

        {recalled && (
          <div style={{
            background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857',
            borderRadius: '10px', padding: '9px 12px', fontSize: '13px',
            fontWeight: 600, marginBottom: '14px', lineHeight: 1.45,
          }}>
            ✓ Found your saved numbers — check them below and change anything that's out of date.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email *</label>
          <input
            style={styles.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={styles.label}>Access Code *</label>
          <input
            style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px', fontSize: '18px' }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder=""
            value={code}
            onChange={handleCodeChange}
            onPaste={handlePaste}
            maxLength={4}
            required
          />

          <div
            style={styles.collapseHeader}
            onClick={() => setShowMaxes(!showMaxes)}
          >
            <span>
              &#x1F4AA; Update 1RM Values (Optional)
              <HelpTip text="A 'max' (1RM) is the most weight you can lift one time for that move. Don't know yours? Leave it blank — your trainer dials these in over time and the program works either way." />
            </span>
            <span>{showMaxes ? '▲' : '▼'}</span>
          </div>

          {showMaxes && (
            <div style={styles.grid}>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Bench (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="0"
                  value={benchMax}
                  onChange={(e) => setBenchMax(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Squat (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="0"
                  value={squatMax}
                  onChange={(e) => setSquatMax(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Deadlift (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="0"
                  value={deadliftMax}
                  onChange={(e) => setDeadliftMax(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Clean (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="0"
                  value={cleanMax}
                  onChange={(e) => setCleanMax(e.target.value)}
                />
              </div>
            </div>
          )}

          <div
            style={styles.collapseHeader}
            onClick={() => setShowBodyStats(!showBodyStats)}
          >
            <span>
              &#x2696; Body Stats (Optional)
              <HelpTip text="Your height, weight, and age. We use these to estimate calories and scale your workouts to your body. All optional - skip anything you'd rather not share." />
            </span>
            <span>{showBodyStats ? '\u25B2' : '\u25BC'}</span>
          </div>

          {showBodyStats && (
            <div style={styles.grid}>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Height (ft)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="5"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Height (in)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="10"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Weight (lbs)</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="180"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div style={styles.gridItem}>
                <label style={styles.gridLabel}>Age</label>
                <input
                  style={styles.gridInput}
                  type="number"
                  placeholder="30"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>
          )}

          <button type="submit" style={styles.btnSubmit}>
            Load My Workout
          </button>
          <button type="button" style={styles.btnBack} onClick={onBack}>
            &#8592; Back
          </button>
        </form>
      </div>
    </div>
  );
}
