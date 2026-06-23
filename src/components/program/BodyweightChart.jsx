import { useEffect, useMemo, useState } from 'react';

// Bodyweight-over-time line chart for the 1-on-1 view. Pulls every logged day
// that recorded a weigh-in (bodyweight-history.php) and draws a simple SVG
// trend line. Collapsible; only renders once there are 2+ data points so a
// single weigh-in doesn't show an empty graph. Live point (today's unsaved
// weight) is appended so the coach sees it land on the trend immediately.

export default function BodyweightChart({ accessCode, userEmail, getBodyweightHistory, liveWeight, refreshKey }) {
  const [history, setHistory] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!getBodyweightHistory || !accessCode || !userEmail) return;
    let cancelled = false;
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

  if (!history) return null;
  if (points.length < 2) return null;

  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights), max = Math.max(...weights);
  const lo = Math.floor(min - 1), hi = Math.ceil(max + 1);
  const range = hi - lo || 1;

  const W = 320, H = 150, pad = { t: 14, r: 14, b: 22, l: 34 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const xy = points.map((p, i) => ({
    x: pad.l + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
    y: pad.t + innerH - ((p.weight - lo) / range) * innerH,
    p,
  }));
  const line = xy.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  const area = line + ` L${xy[xy.length - 1].x.toFixed(1)},${pad.t + innerH} L${xy[0].x.toFixed(1)},${pad.t + innerH} Z`;

  const first = points[0].weight, latest = points[points.length - 1].weight;
  const delta = +(latest - first).toFixed(1);
  const fmtDate = (d) => { try { const [y, m, day] = d.split('-'); return `${+m}/${+day}`; } catch { return d; } };

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
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            {[lo, Math.round((lo + hi) / 2), hi].map((v, i) => {
              const y = pad.t + innerH - ((v - lo) / range) * innerH;
              return (
                <g key={i}>
                  <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="rgba(255,255,255,0.08)" />
                  <text x={pad.l - 5} y={y + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.4)">{v}</text>
                </g>
              );
            })}
            <path d={area} fill="url(#bwgrad)" opacity="0.5" />
            <path d={line} fill="none" stroke="#06d6a0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {xy.map((q, i) => (
              <circle key={i} cx={q.x} cy={q.y} r={q.p.live ? 4 : 3}
                fill={q.p.live ? '#fbbf24' : '#06d6a0'} stroke="#0b1020" strokeWidth="1.5" />
            ))}
            {/* x labels: first, middle, last to avoid crowding */}
            {[0, Math.floor(xy.length / 2), xy.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((idx) => (
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
