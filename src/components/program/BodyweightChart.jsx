import { useEffect, useMemo, useState } from 'react';

// Bodyweight-over-time line chart for the 1-on-1 view. Pulls every logged day
// that recorded a weigh-in (bodyweight-history.php — keyed by CLIENT/email, so
// the trend carries across programs) and draws an SVG trend line that fills the
// card width. Collapsible; only renders once there are 2+ data points. Live
// point (today's unsaved weight) is appended so the coach sees it land on the
// trend immediately. Tap any point to read that day's exact weight — which also
// covers a year+ of weigh-ins (points pack in but stay individually readable).

export default function BodyweightChart({ accessCode, userEmail, getBodyweightHistory, liveWeight, refreshKey }) {
  const [history, setHistory] = useState(null);
  const [open, setOpen] = useState(true);
  const [sel, setSel] = useState(null); // index of the tapped point

  useEffect(() => {
    if (!getBodyweightHistory || !userEmail) return;
    let cancelled = false;
    // code passed for compat; the history is client-scoped (email) server-side.
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

  useEffect(() => { setSel(null); }, [points.length]); // clear selection if data changes

  if (!history) return null;
  if (points.length < 2) return null;

  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights), max = Math.max(...weights);
  const lo = Math.floor(min - 1), hi = Math.ceil(max + 1);
  const mid = Math.round((lo + hi) / 2);
  const range = hi - lo || 1;

  // Fixed viewBox — the SVG renders at width:100% so it fills the card box; a
  // fixed viewBox keeps the height consistent and lets many weigh-ins pack in
  // across the same width (tap a point to read exact values).
  const W = 320, H = 168, pad = { t: 18, r: 14, b: 24, l: 30 };
  const innerH = H - pad.t - pad.b;
  const plotW = W - pad.l - pad.r;

  const xAt = (i) => pad.l + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yAt = (w) => pad.t + innerH - ((w - lo) / range) * innerH;
  const xy = points.map((p, i) => ({ x: xAt(i), y: yAt(p.weight), p }));
  const line = xy.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  const area = line + ` L${xy[xy.length - 1].x.toFixed(1)},${pad.t + innerH} L${xy[0].x.toFixed(1)},${pad.t + innerH} Z`;

  const first = points[0].weight, latest = points[points.length - 1].weight;
  const delta = +(latest - first).toFixed(1);
  const fmtDate = (d) => { try { const [, m, day] = d.split('-'); return `${+m}/${+day}`; } catch { return d; } };

  // x labels: thin them out so they never crowd (every k-th, always incl. last).
  const step = Math.max(1, Math.round(points.length / 7));
  const labelIdx = points.map((_, i) => i).filter((i) => i % step === 0 || i === points.length - 1);

  // Tooltip bubble for the tapped point (clamped inside the viewBox).
  let tip = null;
  if (sel != null && xy[sel]) {
    const q = xy[sel];
    const label = `${points[sel].weight} lbs · ${fmtDate(points[sel].date)}`;
    const tw = label.length * 5.4 + 14;
    const tx = Math.min(Math.max(q.x - tw / 2, 2), W - tw - 2);
    let ty = q.y - 26;
    if (ty < 1) ty = q.y + 10; // flip below if it would clip the top
    tip = { q, label, tw, tx, ty };
  }

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
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {[lo, mid, hi].map((v, i) => (
              <g key={i}>
                <line x1={pad.l} y1={yAt(v)} x2={W - pad.r} y2={yAt(v)} stroke="rgba(255,255,255,0.08)" />
                <text x={pad.l - 5} y={yAt(v) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.4)">{v}</text>
              </g>
            ))}
            <path d={area} fill="url(#bwgrad)" opacity="0.5" />
            <path d={line} fill="none" stroke="#06d6a0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {xy.map((q, i) => (
              <g key={i} onClick={() => setSel(sel === i ? null : i)} style={{ cursor: 'pointer' }}>
                {/* generous transparent hit target for easy tapping on a tablet */}
                <circle cx={q.x} cy={q.y} r="13" fill="transparent" />
                <circle cx={q.x} cy={q.y} r={sel === i ? 5.5 : (q.p.live ? 4 : 3)}
                  fill={q.p.live ? '#fbbf24' : '#06d6a0'}
                  stroke={sel === i ? '#fff' : '#0b1020'} strokeWidth={sel === i ? 2 : 1.5} />
              </g>
            ))}
            {labelIdx.map((idx) => (
              <text key={idx} x={xy[idx].x} y={H - 8} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">
                {fmtDate(points[idx].date)}
              </text>
            ))}
            {tip && (
              <g pointerEvents="none">
                <line x1={tip.q.x} y1={tip.q.y} x2={tip.q.x} y2={tip.ty + (tip.ty > tip.q.y ? 0 : 22)} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <rect x={tip.tx} y={tip.ty} width={tip.tw} height="22" rx="6" fill="#0b1020" stroke="#06d6a0" strokeWidth="1" />
                <text x={tip.tx + tip.tw / 2} y={tip.ty + 15} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{tip.label}</text>
              </g>
            )}
            <defs>
              <linearGradient id="bwgrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06d6a0" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06d6a0" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div style={s.foot}>
            {points.length} weigh-ins · {fmtDate(points[0].date)} → {fmtDate(points[points.length - 1].date)} · tap a point for its weight
          </div>
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
