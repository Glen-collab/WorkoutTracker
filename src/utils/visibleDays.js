// Which days a client / gym TV should actually see.
//
// The builder (workoutbuilder) can hide individual days per program. It saves:
//   - daysPerWeek: legacy-safe upper bound — the visible count when the hidden
//     days are trailing (the common 2/3/4-day case), or 7 when a *middle* day is
//     hidden (non-contiguous).
//   - hiddenDays: the explicit list of hidden day numbers.
//
// Rule: visible = [1..daysPerWeek] minus hiddenDays. Programs saved before this
// feature have no hiddenDays, so behavior is unchanged.

export function getVisibleDays(daysPerWeek, hiddenDays = []) {
  const n = Number(daysPerWeek) || 1;
  const hidden = Array.isArray(hiddenDays) ? hiddenDays : [];
  const days = [];
  for (let d = 1; d <= n; d++) if (!hidden.includes(d)) days.push(d);
  return days.length ? days : [1];
}

// Step to the next/prev visible day, wrapping across weeks.
// Returns { week, day } or null if it would go out of [1..totalWeeks].
export function stepVisibleDay(currentWeek, currentDay, direction, daysPerWeek, hiddenDays, totalWeeks) {
  const visible = getVisibleDays(daysPerWeek, hiddenDays);
  const idx = visible.indexOf(currentDay);
  // If the current day isn't in the visible set, anchor just outside it.
  const pos = idx === -1 ? (direction > 0 ? -1 : visible.length) : idx;
  const nextPos = pos + direction;

  if (nextPos >= visible.length) {
    const week = currentWeek + 1;
    if (week > totalWeeks) return null;
    return { week, day: visible[0] };
  }
  if (nextPos < 0) {
    const week = currentWeek - 1;
    if (week < 1) return null;
    return { week, day: visible[visible.length - 1] };
  }
  return { week: currentWeek, day: visible[nextPos] };
}

export function isFirstVisibleDay(currentWeek, currentDay, daysPerWeek, hiddenDays) {
  const visible = getVisibleDays(daysPerWeek, hiddenDays);
  return currentWeek === 1 && currentDay === visible[0];
}

export function isLastVisibleDay(currentWeek, currentDay, daysPerWeek, hiddenDays, totalWeeks) {
  const visible = getVisibleDays(daysPerWeek, hiddenDays);
  return currentWeek === totalWeeks && currentDay === visible[visible.length - 1];
}

// First visible day of a week (used when jumping weeks).
export function firstVisibleDay(daysPerWeek, hiddenDays) {
  return getVisibleDays(daysPerWeek, hiddenDays)[0];
}
