// Round weight to nearest 5 lbs (numbers ending in 5: 215, 225, 235...)
export function roundToNearest5(weight) {
  return Math.round(weight / 10) * 10 + 5;
}

// Calculate weight from 1RM and percentage
export function calculateWeight(oneRM, percentage) {
  return roundToNearest5((oneRM * percentage) / 100);
}

// Get 1RM based on exercise name and user's maxes
// Also checks ex.baseMax property (set by builder) as primary lookup
export function get1RM(exerciseName, maxes, baseMax) {
  if (!maxes) return 0;
  // If builder set a baseMax reference (e.g. "bench", "squat"), use that first
  if (baseMax && maxes[baseMax]) return maxes[baseMax];
  if (!exerciseName) return 0;
  if (exerciseName.includes('Bench Press')) return maxes.bench || 0;
  if (exerciseName.includes('Back Squat') || exerciseName.includes('Front Squat') || exerciseName.includes('Overhead Squat')) return maxes.squat || 0;
  if (exerciseName.includes('Deadlift') && !exerciseName.includes('Romanian')) return maxes.deadlift || 0;
  if (exerciseName.includes('Clean') && !exerciseName.includes('Muscle') && !exerciseName.includes('Box')) return maxes.clean || 0;
  if (exerciseName.includes('Snatch') && !exerciseName.includes('Muscle')) return maxes.clean || 0;
  if (exerciseName.includes('Jerk')) return maxes.clean || 0;
  return 0;
}

// Format access code: "XXXXXMFKLK" -> "XXXXX-MFKLK"
export function formatAccessCode(value) {
  let cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleaned.length > 5) {
    cleaned = cleaned.substring(0, 5) + '-' + cleaned.substring(5, 10);
  }
  return cleaned;
}

// Block type display names
export function getBlockTypeName(type) {
  const names = {
    'theme': 'Theme / Notes', 'warmup': 'Warm Up', 'cooldown': 'Cool Down', 'mobility': 'Mobility',
    'movement': 'Movement', 'straight-set': 'Straight Set', 'superset': 'Superset',
    'triset': 'Triset', 'circuit': 'Circuit / MetCon', 'conditioning': 'Conditioning',
    'core': 'Core', 'abs': 'Abs', 'finisher': 'Finisher', 'cardio': 'Cardio'
  };
  return names[type] || type;
}

// Block type icons
export function getBlockIcon(type) {
  const icons = {
    'theme': '\u{1F4CB}', 'warmup': '\u{1F525}', 'cooldown': '\u2744\uFE0F', 'mobility': '\u{1F9D8}', 'movement': '\u26A1',
    'straight-set': '\u{1F4AA}', 'superset': '\u{1F504}', 'triset': '\u{1F501}',
    'circuit': '\u{1F3AF}', 'conditioning': '\u{1F3C3}',
    'core': '\u{1F4AA}', 'abs': '\u{1F4AA}', 'finisher': '\u{1F3C1}', 'cardio': '\u{1F3C3}'
  };
  return icons[type] || '\u{1F4AA}';
}

// Circuit type display names
export function getCircuitTypeName(type) {
  const names = {
    'amrap': 'AMRAP', 'fortime': 'For Time', 'emom': 'EMOM',
    'tabata': 'Tabata', 'chipper': 'Chipper', 'rounds': 'Rounds for Quality'
  };
  return names[type] || type;
}

// Whether a block type needs weight/reps tracking inputs
export function needsTracking(blockType) {
  return ['straight-set', 'superset', 'triset'].includes(blockType);
}

// Whether a block type uses per-set inputs
export function needsPerSetInputs(blockType) {
  return ['straight-set', 'superset', 'triset'].includes(blockType);
}
