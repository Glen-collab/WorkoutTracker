import React, { useState } from 'react';

export default function PrintWorkout({ program, userName, currentWeek, daysPerWeek, userEmail, accessCode, onFetchDay }) {
  const [loading, setLoading] = useState(false);
  const currentDay = program?.currentDay ?? 1;

  if (currentDay !== 1) return null;

  const handlePrint = async () => {
    setLoading(true);
    try {
      // Fetch all days for the week
      const dayData = [];
      for (let d = 1; d <= daysPerWeek; d++) {
        const data = await onFetchDay(d);
        dayData.push({ day: d, ...data });
      }

      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const programName = program?.name || 'Workout Program';

      let tablesHtml = '';
      dayData.forEach((day, idx) => {
        const exercises = day.exercises || day.blocks || [];
        let rowsHtml = '';

        if (Array.isArray(exercises)) {
          exercises.forEach(item => {
            // Block header
            if (item.blockName || item.block) {
              rowsHtml += `<tr><td colspan="7" style="background:#e0e0e0;font-weight:bold;padding:6px 8px;font-size:13px;">${item.blockName || item.block}</td></tr>`;
            }
            const exList = item.exercises || [item];
            exList.forEach(ex => {
              rowsHtml += `<tr>
                <td style="padding:4px 6px;border:1px solid #ccc;">${ex.name || ex.exercise || ''}</td>
                <td style="padding:4px 6px;border:1px solid #ccc;text-align:center;">${ex.sets || ''}</td>
                <td style="padding:4px 6px;border:1px solid #ccc;text-align:center;">${ex.reps || ''}</td>
                <td style="padding:4px 6px;border:1px solid #ccc;width:60px;">&nbsp;</td>
                <td style="padding:4px 6px;border:1px solid #ccc;width:60px;">&nbsp;</td>
                <td style="padding:4px 6px;border:1px solid #ccc;width:60px;">&nbsp;</td>
                <td style="padding:4px 6px;border:1px solid #ccc;width:60px;">&nbsp;</td>
                <td style="padding:4px 6px;border:1px solid #ccc;">${ex.notes || ''}</td>
              </tr>`;
            });
          });
        }

        const pageBreak = idx > 0 && idx % 2 === 0 ? 'page-break-before:always;' : '';

        tablesHtml += `
          <div style="margin-bottom:20px;${pageBreak}">
            <h3 style="margin:12px 0 4px;font-size:15px;">Day ${day.day}${day.dayName ? ' - ' + day.dayName : ''}</h3>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr style="background:#667eea;color:#fff;">
                  <th style="padding:5px;border:1px solid #ccc;text-align:left;">Exercise</th>
                  <th style="padding:5px;border:1px solid #ccc;width:40px;">Sets</th>
                  <th style="padding:5px;border:1px solid #ccc;width:40px;">Reps</th>
                  <th style="padding:5px;border:1px solid #ccc;width:60px;">Wk 1</th>
                  <th style="padding:5px;border:1px solid #ccc;width:60px;">Wk 2</th>
                  <th style="padding:5px;border:1px solid #ccc;width:60px;">Wk 3</th>
                  <th style="padding:5px;border:1px solid #ccc;width:60px;">Wk 4</th>
                  <th style="padding:5px;border:1px solid #ccc;">Notes</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>`;
      });

      const html = `<!DOCTYPE html>
<html><head><title>Workout Sheet</title>
<style>
  @page { size: letter landscape; margin: 0.3in; }
  body { font-family: Arial, sans-serif; color: #222; margin: 0; padding: 0.3in; }
  @media print { .no-print { display: none; } }
</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div>
      <h1 style="margin:0;font-size:20px;color:#667eea;">${programName}</h1>
      <div style="font-size:13px;color:#666;">Athlete: ${userName || 'N/A'} | Week ${currentWeek} | ${today}</div>
    </div>
  </div>
  ${tablesHtml}
</body></html>`;

      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      style={{
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#fff', border: 'none', borderRadius: 20, padding: '10px 20px',
        fontSize: 14, fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1, fontFamily: 'Arial, sans-serif',
      }}
    >
      {loading ? 'Loading...' : '\uD83D\uDDA8\uFE0F Print Workout Sheet'}
    </button>
  );
}
