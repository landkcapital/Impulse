import { formatDuration } from "./time";

/**
 * Default active hours — used when profile values are not available.
 */
const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 23;

/**
 * Parse a "HH:MM" time string into an hour number (e.g. "07:00" → 7).
 */
function parseHour(timeStr) {
  if (!timeStr) return null;
  const [h] = timeStr.split(":").map(Number);
  return h;
}

/**
 * Calculate the gap between the last logged block and the current time.
 *
 * @param {Object} params
 * @param {Date|string|null} params.lastBlockEnd - end_at of the most recent block today
 * @param {Date} params.currentTime - current time
 * @param {number} params.incrementMinutes - user's logging increment (e.g. 15)
 * @returns {{ missingMinutes: number, missingBlocks: number }}
 */
export function getLoggingGap({ lastBlockEnd, currentTime, incrementMinutes }) {
  if (!lastBlockEnd) {
    return { missingMinutes: 0, missingBlocks: 0 };
  }

  const endDate =
    lastBlockEnd instanceof Date ? lastBlockEnd : new Date(lastBlockEnd);
  const now = currentTime instanceof Date ? currentTime : new Date(currentTime);

  const diffMs = now.getTime() - endDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < incrementMinutes) {
    return { missingMinutes: 0, missingBlocks: 0 };
  }

  const missingBlocks = Math.floor(diffMinutes / incrementMinutes);

  return {
    missingMinutes: diffMinutes,
    missingBlocks,
  };
}

/**
 * Check whether the current time is within active hours.
 *
 * @param {Date} date
 * @param {string} [activeStart] - "HH:MM" from profile (e.g. "07:00")
 * @param {string} [activeEnd] - "HH:MM" from profile (e.g. "22:00")
 */
export function isWithinActiveHours(date, activeStart, activeEnd) {
  const hour = date.getHours();
  const startHour = parseHour(activeStart) ?? DEFAULT_START_HOUR;
  const endHour = parseHour(activeEnd) ?? DEFAULT_END_HOUR;
  return hour >= startHour && hour < endHour;
}

/**
 * Generate a friendly, calm nudge message.
 * Never uses warnings, urgency, or guilt.
 */
export function getNudgeMessage(missingMinutes) {
  if (missingMinutes >= 120) {
    const hours = Math.floor(missingMinutes / 60);
    return `You haven't logged the last ${hours} hours.`;
  }
  if (missingMinutes >= 60) {
    return "You haven't logged the last hour.";
  }
  return `You haven't logged the last ${formatDuration(missingMinutes)}.`;
}
