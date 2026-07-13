import { useEffect, useMemo, useRef, useState } from 'react';

// Bodyweight-over-time line chart for the 1-on-1 view. Pulls every logged day
// that recorded a weigh-in (bodyweight-history.php — keyed by CLIENT/email, so
// the trend carries across programs) and draws an SVG trend line. Collapsible;
// only renders once there are 2+ data points. Live point (today's unsaved
// weight) is appended so the coach sees it land on the trend immediately.
// Long histories scroll horizontally (fixed y-axis) so a year+ of weigh-ins
// stays readable instead of cramming into one width.

export default function BodyweightChart({ accessCode, userEmail, getBodyweightHistory, liveWeight, refreshKey }) {
  const [history, setHistory] = useState(null);
  const [open, setOpen] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!getBodyweightHistory || !userEmail) return;
    let cancelled = false;
    // code is passed for compat but the history is client-scoped server-side.
    getBodyweightHistory({ email: userEmail, code: accessCode })
      .then((r) => { if (!cancelled) setHistory(r?.success ? (r.data || []) : []); })
      .catch(() => { if (!cancelled) setHistory([]); });
    return () => { cancelled = true; };
  }, [getBodyweightHistory, accessCode, userEmail, refreshKey]);

  // Merge in today's live (unsaved) weight as a provisional last point so it
  // shows on the trend before logging. If today already has a saved point,
  // overwrite it with the live value instead of duplicating.
  const points = useMemo(() => {
    const base = Array.isArray(history) ? history.slice() : [];
    const lw = parseFloat(liveWeight);
    if (lw && lw >= 50 && lw <= 700) {
      const today = new Date().toISOString().slice(0, 10);
      const last = base[base.length - 1];
      if (last && last.date === today) base[base.length - 1] = { ...last, weight: lw, live: true };
      else base.push({ date: today, weight: lw, live: true });
    }
    return base;
  }, [history, liveWeight]);

  // Default the scroll to the most-recent end whenever the data or open state
  // changes, so the coach sees the latest weigh-ins first (and can scroll left
  // for older history).
  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [open, points.length]);

  if (!history) return null;
  if (points.length < 2) return null;

  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights), max = Math.max(...weights);
  const lo = Math.floor(min - 1), hi = Math.ceil(max + 1);
  const mid = Math.round((lo + hi) / 2);
  const range = hi - lo || 1;

  const H = 150, pad = { t: 14, r: 16, b: 22, l: 10 };
  const AXIS_W = 34;                 // fixed left y-axis column
  const PT_SPACING = 24;             // px per weigh-in once we exceed the base width
  const innerH = H - pad.t - pad.b;
  const plotW = Math.max(260, (points.length - 1) * PT_SPACING);
  const chartW = pad.l + plotW + pad.r;

  const xAt = (i) => pad.l + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yAt = (w) => pad.t + innerH - ((w - lo) / range) * innerH;
  const xy = points.map((p, i) => ({ x: xAt(i), y: yAt(p.weight), p }));
  const line = xy.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  const area = line + ` L${xy[xy.length - 1].x.toFixed(1)},${pad.t + innerH} L${xy[0].x.toFixed(1)},${pad.t + innerH} Z`;

  const first = points[0].weight, latest = points[points.length - 1].weight;
  const delta = +(latest - first).toFixed(1);
  const fmtDate = (d) => { try { const [, m, day] = d.split('-'); return `${+m}/${+day}`; } catch { return d; } };

  // x labels: thin them out so they never crowd (every k-th, always incl. last).
  const step = Math.max(1, Math.round(points.length / 8));
  const labelIdx = points.map((_, i) => i).filter((i) => i % step === 0 || i === points.length - 1);

  return (
    <div style={s.card}>
      <button style={s.header} onClick={() => setOpen((o) => !o)}>
        <span style={s.title}>⚖️ Bodyweight Trend</span>
        <span style={s.sub}>
          {latest} lbs
          {delta !== 0 && (
            <span style={{ color: delta < 0 ? '#34d399' : '#fbbf24', marginLeft: 8 }}>
              {delta < 0 ? '▼' : '▲'} {Math.abs(delta)} lbs
            </span>
          )}
          <span style={{ marginLeft: 10, opacity: 0.6 }}>{open ? '▾' : '▸'}</span>
        </span>
      </button>
      {open && (
        <div style={s.body}>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* Fixed y-axis (stays put while the plot scrolls) */}
            <svg width={AXIS_W} viewBox={`0 0 ${AXIS_W} ${H}`} style={{ flex: `0 0 ${AXIS_W}px`, height: 'auto', overflow: 'visible' }}>
              {[hi, mid, lo].map((v, i) => (
                <text key={i} x={AXIS_W - 5} y={yAt(v) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.4)">{v}</text>
              ))}
            </svg>
            {/* Scrollable plot — grows with the number of weigh-ins */}
            <div ref={scrollRef} style={{ overflowX: 'auto', flex: 1, minWidth: 0 }}>
              <svg width={chartW} viewBox={`0 0 ${chartW} ${H}`} style={{ height: 'auto', display: 'block' }}>
                {[lo, mid, hi].map((v, i) => (
                  <line key={i} x1={0} y1={yAt(v)} x2={chartW} y2={yAt(v)} stroke="rgba(255,255,255,0.08)" />
                ))}
                <path d={area} fill="url(#bwgrad)" opacity="0.5" />
                <path d={line} fill="none" stroke="#06d6a0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {xy.map((q, i) => (
                  <circle key={i} cx={q.x} cy={q.y} r={q.p.live ? 4 : 3}
                    fill={q.p.live ? '#fbbf24' : '#06d6a0'} stroke="#0b1020" strokeWidth="1.5" />
                ))}
                {labelIdx.map((idx) => (
                  <text key={idx} x={xy[idx].x} y={H - 6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">
                    {fmtDate(points[idx].date)}
                  </text>
                ))}
                <defs>
                  <linearGradient id="bwgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06d6a0" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#06d6a0" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div style={s.foot}>{points.length} weigh-ins · {fmtDate(points[0].date)} → {fmtDate(points[points.length - 1].date)}</div>
        </div>
      )}
    </div>
  );
}

const s = {
  card: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  header: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', color: '#fff', padding: '12px 14px', cursor: 'pointer', fontSize: 14 },
  title: { fontWeight: 800 },
  sub: { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' },
  body: { padding: '4px 12px 12px' },
  foot: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
};
