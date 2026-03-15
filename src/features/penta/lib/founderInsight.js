/**
 * Default work sub-pillar definitions (fallback when DB sub-pillars not loaded).
 */
export const WORK_TAGS = [
  { key: "sales", label: "Sales" },
  { key: "marketing", label: "Marketing" },
  { key: "product", label: "Product" },
  { key: "operations", label: "Operations" },
];

/**
 * Default colour variations of the Work pillar colour.
 */
export const WORK_TAG_COLOURS = {
  sales: "#818cf8",
  marketing: "#a78bfa",
  product: "#6366f1",
  operations: "#4f46e5",
};

/**
 * Generate a short insight about sub-pillar distribution for any pillar.
 *
 * @param {Array<{key: string, label: string}>} subPillars - sub-pillar definitions
 * @param {{ [key: string]: number }} totals - minutes per sub-pillar key
 * @param {string} [pillarName] - pillar name for context (default "Work")
 * @returns {string} insight sentence
 */
export function generateSubPillarInsight(subPillars, totals, pillarName = "Work") {
  const entries = subPillars
    .map((sp) => ({ label: sp.label, minutes: totals[sp.key] || 0 }))
    .filter((e) => e.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const total = entries.reduce((sum, e) => sum + e.minutes, 0);

  if (total === 0) {
    return `No ${pillarName.toLowerCase()} time has been tagged today.`;
  }

  if (entries.length === 1) {
    return `${pillarName} time today was entirely ${entries[0].label}.`;
  }

  const top = entries[0];
  const topShare = top.minutes / total;

  if (topShare > 0.6) {
    return `${pillarName} time today was mostly ${top.label}.`;
  }

  const zeroTags = subPillars
    .filter((sp) => !totals[sp.key])
    .map((sp) => sp.label);

  if (zeroTags.length === 1) {
    return `No time has been spent on ${zeroTags[0]} today.`;
  }

  if (entries.length >= 3) {
    return `${pillarName} time today was spread across multiple areas.`;
  }

  return `${pillarName} time today was split between ${entries[0].label} and ${entries[1].label}.`;
}

/**
 * Legacy wrapper — calls generateSubPillarInsight with default WORK_TAGS.
 */
export function generateFounderInsight(workTagTotals) {
  return generateSubPillarInsight(WORK_TAGS, workTagTotals, "Work");
}
