/**
 * Work sub-pillar definitions.
 */
export const WORK_TAGS = [
  { key: "sales", label: "Sales" },
  { key: "marketing", label: "Marketing" },
  { key: "product", label: "Product" },
  { key: "operations", label: "Operations" },
];

/**
 * Subtle colour variations of the Work pillar colour (Indigo #6366f1).
 */
export const WORK_TAG_COLOURS = {
  sales: "#818cf8",
  marketing: "#a78bfa",
  product: "#6366f1",
  operations: "#4f46e5",
};

/**
 * Generate a short, neutral insight about today's work distribution.
 *
 * Rules:
 * - Short, 1 sentence
 * - Neutral tone
 * - Execution focused
 * - No judgement
 *
 * @param {{ [tag: string]: number }} workTagTotals - minutes per work tag
 * @returns {string} insight sentence, or empty string if no work time
 */
export function generateFounderInsight(workTagTotals) {
  const entries = WORK_TAGS
    .map((t) => ({ label: t.label, minutes: workTagTotals[t.key] || 0 }))
    .filter((e) => e.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const total = entries.reduce((sum, e) => sum + e.minutes, 0);

  if (total === 0) {
    return "No work time has been tagged today.";
  }

  if (entries.length === 1) {
    return `Work time today was entirely ${entries[0].label}.`;
  }

  const top = entries[0];
  const topShare = top.minutes / total;

  if (topShare > 0.6) {
    return `Work time today was mostly ${top.label}.`;
  }

  // Check for zero tags
  const zeroTags = WORK_TAGS
    .filter((t) => !workTagTotals[t.key])
    .map((t) => t.label);

  if (zeroTags.length === 1) {
    return `No time has been spent on ${zeroTags[0]} today.`;
  }

  if (entries.length >= 3) {
    return "Work time today was spread across multiple areas.";
  }

  return `Work time today was split between ${entries[0].label} and ${entries[1].label}.`;
}
