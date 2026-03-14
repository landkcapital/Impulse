import { WORK_TAGS } from "./founderInsight";

/**
 * Generate a strategic insight sentence for work distribution over a date range.
 *
 * Tone: direct, clear, intelligent. Not rude, not fluffy.
 *
 * @param {{ [tag: string]: number }} workTagTotals - minutes per work tag
 * @param {string} rangeLabel - e.g. "this week", "the last 14 days"
 * @returns {string} insight sentence, or empty string if no work time
 */
export function generateFounderRangeInsight(workTagTotals, rangeLabel) {
  const entries = WORK_TAGS.map((t) => ({
    key: t.key,
    label: t.label,
    minutes: workTagTotals[t.key] || 0,
  }));

  const total = entries.reduce((sum, e) => sum + e.minutes, 0);

  if (total === 0) {
    return `No work time was tagged ${rangeLabel}.`;
  }

  const active = entries.filter((e) => e.minutes > 0).sort((a, b) => b.minutes - a.minutes);
  const inactive = entries.filter((e) => e.minutes === 0);

  // Only one area received time
  if (active.length === 1) {
    return `Work effort ${rangeLabel} was entirely in ${active[0].label}. The other areas received no attention.`;
  }

  const top = active[0];
  const topShare = top.minutes / total;

  // One area dominated (>60%)
  if (topShare > 0.6) {
    const secondLowest = active[active.length - 1];
    if (inactive.length > 0) {
      return `${top.label} dominated your work ${rangeLabel}. ${inactive[0].label} received no time at all.`;
    }
    return `${top.label} dominated your work ${rangeLabel}. ${secondLowest.label} received the least attention.`;
  }

  // All four areas received time with reasonable spread
  if (inactive.length === 0 && topShare < 0.4) {
    return `Work effort was spread reasonably well across all areas ${rangeLabel}.`;
  }

  // Some areas received zero time
  if (inactive.length >= 2) {
    const names = inactive.map((e) => e.label).join(" and ");
    return `No time was logged for ${names} ${rangeLabel}.`;
  }

  if (inactive.length === 1) {
    return `No ${inactive[0].label.toLowerCase()} time was logged ${rangeLabel}.`;
  }

  // Two dominant areas
  if (active.length >= 2) {
    const secondShare = active[1].minutes / total;
    if (topShare + secondShare > 0.8) {
      return `${top.label} and ${active[1].label} accounted for most of the work ${rangeLabel}.`;
    }
  }

  // Default balanced message
  return `Work effort ${rangeLabel} was split across ${active.map((e) => e.label).join(", ")}.`;
}
