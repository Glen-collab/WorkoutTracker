// Running "scratch paper" coach notes for 1-on-1 training.
//
// Glen's model: each time he logs out a session, the recap notes get appended
// here. The card at the top of the 1-on-1 view shows everything piled up so
// far for THIS program — like a single sheet of scratch paper that keeps
// building day to day, week to week. A new program starts a fresh sheet.
//
// Stored in localStorage (the 1-on-1 iPad is one device), keyed per client +
// program. Entries are stamped { week, day, date, text }; re-logging the same
// day replaces that day's entry rather than duplicating it.

function slug(s) {
  return String(s || 'program')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'program';
}

function padKey(accessCode, programName) {
  return `gwt_scratchpad_${accessCode || 'anon'}_${slug(programName)}`;
}

export function readScratchpad(accessCode, programName) {
  try {
    const raw = localStorage.getItem(padKey(accessCode, programName));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function writeScratchpad(accessCode, programName, entries) {
  try {
    localStorage.setItem(padKey(accessCode, programName), JSON.stringify(entries || []));
  } catch { /* storage full / unavailable — non-fatal */ }
  return entries || [];
}

function stampDate() {
  try {
    return new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  } catch {
    return '';
  }
}

// Append (or replace, if the same week+day already exists) one stamped note.
// Empty text is ignored so a no-note log-out doesn't add a blank block.
export function appendScratchpadNote(accessCode, programName, { week, day, text }) {
  const trimmed = (text || '').trim();
  if (!trimmed) return readScratchpad(accessCode, programName);
  const entries = readScratchpad(accessCode, programName);
  const entry = { week, day, date: stampDate(), text: trimmed };
  const idx = entries.findIndex((e) => e.week === week && e.day === day);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  return writeScratchpad(accessCode, programName, entries);
}

// Build one plain-text blob of the whole running sheet — used for the AI
// program-end summary (and handy for copy/paste).
export function scratchpadToText(entries) {
  return (entries || [])
    .map((e) => `— Wk${e.week} Day${e.day}${e.date ? ` (${e.date})` : ''} —\n${e.text}`)
    .join('\n\n');
}
