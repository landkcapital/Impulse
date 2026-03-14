/**
 * Round a Date down to the nearest increment boundary.
 * E.g. 10:37 with increment 15 → 10:30
 */
export function floorToIncrement(date, incrementMinutes = 15) {
  const d = new Date(date);
  const mins = d.getMinutes();
  const floored = Math.floor(mins / incrementMinutes) * incrementMinutes;
  d.setMinutes(floored, 0, 0);
  return d;
}

/**
 * Compute the default previous time block.
 * end   = current time floored to increment
 * start = end - incrementMinutes
 */
export function getDefaultBlock(incrementMinutes = 15) {
  const now = new Date();
  const end = floorToIncrement(now, incrementMinutes);
  const start = new Date(end.getTime() - incrementMinutes * 60 * 1000);
  return { start, end };
}

/**
 * Format a Date to "HH:MM" for display and time inputs.
 */
export function formatTime(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Parse an "HH:MM" string into a Date for today.
 */
export function parseTimeToday(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Get duration in minutes between two Dates.
 */
export function getDurationMinutes(start, end) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayDateString() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/**
 * Format duration for display, e.g. "15 min" or "1h 30min"
 */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
