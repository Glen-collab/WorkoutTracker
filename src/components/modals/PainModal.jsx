import React, { useState } from 'react';

const BODY_AREAS = [
  { id: 'head_neck',       label: 'Head/Neck',       top: '8%',  left: '50%' },
  { id: 'left_shoulder',   label: 'Left Shoulder',   top: '20%', left: '30%' },
  { id: 'right_shoulder',  label: 'Right Shoulder',  top: '20%', left: '70%' },
  { id: 'upper_back',      label: 'Upper Back',      top: '25%', left: '50%' },
  { id: 'left_elbow',      label: 'Left Elbow',      top: '35%', left: '20%' },
  { id: 'right_elbow',     label: 'Right Elbow',     top: '35%', left: '80%' },
  { id: 'core_abs',        label: 'Core/Abs',        top: '38%', left: '50%' },
  { id: 'lower_back',      label: 'Lower Back',      top: '45%', left: '50%' },
  { id: 'left_wrist',      label: 'Left Wrist',      top: '48%', left: '15%' },
  { id: 'right_wrist',     label: 'Right Wrist',     top: '48%', left: '85%' },
  { id: 'left_hip',        label: 'Left Hip',        top: '52%', left: '38%' },
  { id: 'right_hip',       label: 'Right Hip',       top: '52%', left: '62%' },
  { id: 'left_knee',       label: 'Left Knee',       top: '70%', left: '38%' },
  { id: 'right_knee',      label: 'Right Knee',      top: '70%', left: '62%' },
  { id: 'left_ankle',      label: 'Left Ankle',      top: '88%', left: '38%' },
  { id: 'right_ankle',     label: 'Right Ankle',     top: '88%', left: '62%' },
];

export default function PainModal({ isOpen, onClose, selectedAreas = [], onUpdateAreas }) {
  const [selected, setSelected] = useState(new Set(selectedAreas.map(a => a.area || a)));
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const toggleArea = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDone = () => {
    const result = Array.from(selected).map(area => ({ area, details }));
    onUpdateAreas(result);
    onClose();
  };

  const handleNoPain = () => {
    setSelected(new Set());
    setDetails('');
    onUpdateAreas([]);
    onClose();
  };

  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, padding: 16,
  };

  const modal = {
    background: '#1e1e2f', borderRadius: 16, width: '100%', maxWidth: 400,
    maxHeight: '90vh', overflow: 'auto', color: '#fff', fontFamily: 'Arial, sans-serif',
  };

  const header = {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: '16px 20px', borderRadius: '16px 16px 0 0', fontSize: 18, fontWeight: 'bold',
  };

  const bodyContainer = {
    position: 'relative', width: '100%', height: 400, margin: '16px 0',
  };

  // Simple body outline using borders
  const bodyOutline = {
    position: 'absolute', top: '12%', left: '35%', width: '30%', height: '78%',
    border: '2px solid #444', borderRadius: '50% 50% 5% 5% / 20% 20% 5% 5%',
    pointerEvents: 'none',
  };

  const dotStyle = (area) => ({
    position: 'absolute', top: area.top, left: area.left,
    transform: 'translate(-50%, -50%)', width: 28, height: 28,
    borderRadius: '50%', border: '2px solid #667eea',
    background: selected.has(area.id) ? '#ff4444' : 'rgba(102,126,234,0.3)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 8, textAlign: 'center', transition: 'background 0.2s',
    zIndex: 2,
  });

  const chipStyle = {
    display: 'inline-block', background: '#ff4444', color: '#fff',
    borderRadius: 12, padding: '4px 10px', margin: 3, fontSize: 12,
  };

  const btnBase = {
    border: 'none', borderRadius: 20, padding: '10px 20px', cursor: 'pointer',
    fontSize: 14, fontWeight: 'bold', margin: 4,
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>&#127973; Pain & Soreness Assessment</div>
        <div style={{ padding: '0 16px 16px' }}>
          <div style={bodyContainer}>
            <div style={bodyOutline} />
            {/* Head circle */}
            <div style={{ position: 'absolute', top: '5%', left: '43%', width: '14%', height: '10%', border: '2px solid #444', borderRadius: '50%', pointerEvents: 'none' }} />
            {/* Arm lines */}
            <div style={{ position: 'absolute', top: '20%', left: '20%', width: '15%', height: '2px', background: '#444', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '20%', left: '65%', width: '15%', height: '2px', background: '#444', pointerEvents: 'none' }} />
            {/* Legs */}
            <div style={{ position: 'absolute', top: '55%', left: '40%', width: '2px', height: '35%', background: '#444', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '55%', left: '60%', width: '2px', height: '35%', background: '#444', pointerEvents: 'none' }} />

            {BODY_AREAS.map(area => (
              <div key={area.id} style={dotStyle(area)} onClick={() => toggleArea(area.id)} title={area.label} />
            ))}
          </div>

          {selected.size > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>Selected areas:</div>
              {BODY_AREAS.filter(a => selected.has(a.id)).map(a => (
                <span key={a.id} style={chipStyle}>{a.label}</span>
              ))}
            </div>
          )}

          <textarea
            placeholder="Additional injury/pain details..."
            value={details}
            onChange={e => setDetails(e.target.value)}
            style={{
              width: '100%', minHeight: 60, background: '#2a2a3e', color: '#fff',
              border: '1px solid #444', borderRadius: 8, padding: 10, fontSize: 14,
              resize: 'vertical', boxSizing: 'border-box', marginBottom: 12,
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button style={{ ...btnBase, background: '#44aa44', color: '#fff' }} onClick={handleNoPain}>No Pain/Soreness</button>
            <button style={{ ...btnBase, background: '#666', color: '#fff' }} onClick={() => { setSelected(new Set()); setDetails(''); }}>Clear All</button>
            <button style={{ ...btnBase, background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff' }} onClick={handleDone}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
