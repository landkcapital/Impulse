import { WORK_TAGS } from "./founderInsight";

/**
 * Pillar display names, keyed by DB key.
 */
const PILLAR_NAMES = {
  work: "Work",
  health: "Health",
  relationships: "Relationships",
  growth: "Personal Growth",
  admin: "Life Admin",
};

/**
 * Generate strategic behaviour insights from pillar and work-tag data.
 *
 * Returns an array of 1–2 insight sentences. Each sentence is direct,
 * calm, and strategic — like a thoughtful advisor, not a coach.
 *
 * @param {Object} params
 * @param {Array} params.pillars - pillar objects with id, key, name, is_active
 * @param {{ [pillar_id]: number }} params.pillarTotals - minutes per pillar
 * @param {{ [tag]: number }} params.workTagTotals - minutes per work tag
 * @param {string} params.rangeLabel - e.g. "this week", "in the last 14 days"
 * @returns {string[]} array of insight sentences (may be empty)
 */
export function generateStrategicInsights({
  pillars,
  pillarTotals,
  workTagTotals,
  rangeLabel,
}) {
  const active = (pillars || []).filter((p) => p.is_active);
  if (active.length === 0) return [];

  const entries = active.map((p) => ({
    key: p.key,
    name: PILLAR_NAMES[p.key] || p.name,
    minutes: pillarTotals[p.id] || 0,
  }));

  const total = entries.reduce((sum, e) => sum + e.minutes, 0);

  // Not enough data
  if (total === 0) {
    return [];
  }

  // Need at least a meaningful amount of time to draw conclusions
  if (total < 15) {
    return ["No strong patterns are visible yet."];
  }

  const sorted = [...entries].sort((a, b) => b.minutes - a.minutes);
  const insights = [];

  // — Pillar balance insight —
  const pillarInsight = getPillarBalanceInsight(sorted, total, rangeLabel);
  if (pillarInsight) insights.push(pillarInsight);

  // — Work-tag insight (founder mode) —
  const workPillar = entries.find((e) => e.key === "work");
  if (workPillar && workPillar.minutes > 0) {
    const workInsight = getWorkTagInsight(workTagTotals, rangeLabel);
    if (workInsight) insights.push(workInsight);
  }

  // Fallback if nothing triggered
  if (insights.length === 0) {
    return ["No strong patterns are visible yet."];
  }

  return insights;
}

/**
 * Evaluate pillar distribution and return a single insight sentence.
 */
function getPillarBalanceInsight(sorted, total, rangeLabel) {
  const top = sorted[0];
  const topShare = top.minutes / total;

  // Identify specific low-attention pillars
  const healthEntry = sorted.find((e) => e.key === "health");
  const friendsEntry = sorted.find((e) => e.key === "relationships");

  // Check if Health + Relationships combined < 10%
  const healthMin = healthEntry?.minutes || 0;
  const friendsMin = friendsEntry?.minutes || 0;
  const wellbeingShare = (healthMin + friendsMin) / total;

  // Single pillar dominance (> 60%)
  if (topShare > 0.6) {
    return `${top.name} dominated your time ${rangeLabel}.`;
  }

  // Two pillars > 70% combined
  if (sorted.length >= 2) {
    const second = sorted[1];
    const combinedShare = (top.minutes + second.minutes) / total;
    if (combinedShare > 0.7) {
      return `Most of your time went toward ${top.name} and ${second.name} ${rangeLabel}.`;
    }
  }

  // Wellbeing neglected
  if (wellbeingShare < 0.1 && total >= 60) {
    return `Very little time was spent on health or relationships ${rangeLabel}.`;
  }

  // Check for completely neglected pillars
  const neglected = sorted.filter((e) => e.minutes === 0);
  if (neglected.length === 1) {
    return `${neglected[0].name} received no attention ${rangeLabel}.`;
  }
  if (neglected.length >= 2) {
    const names = neglected.slice(0, 2).map((e) => e.name);
    return `${names.join(" and ")} received no attention ${rangeLabel}.`;
  }

  // Fairly balanced
  if (topShare < 0.35) {
    return `Your time was spread fairly evenly across the pillars ${rangeLabel}.`;
  }

  // Moderate imbalance — note the top
  return `${top.name} received the most attention ${rangeLabel}, with the rest spread across other areas.`;
}

/**
 * Evaluate work-tag distribution and return a single insight sentence.
 */
function getWorkTagInsight(workTagTotals, rangeLabel) {
  const entries = WORK_TAGS.map((t) => ({
    key: t.key,
    label: t.label,
    minutes: workTagTotals[t.key] || 0,
  }));

  const total = entries.reduce((sum, e) => sum + e.minutes, 0);

  // No tagged work — skip silently (the founderRangeInsight already covers this)
  if (total === 0) return null;

  const active = entries.filter((e) => e.minutes > 0).sort((a, b) => b.minutes - a.minutes);
  const inactive = entries.filter((e) => e.minutes === 0);

  const top = active[0];
  const topShare = top.minutes / total;

  // Heavy concentration
  if (topShare > 0.6) {
    if (inactive.length > 0) {
      return `${top.label} work dominated ${rangeLabel}, while ${inactive[0].label.toLowerCase()} received no attention.`;
    }
    return `${top.label} work dominated ${rangeLabel}.`;
  }

  // Areas receiving zero attention
  if (inactive.length >= 2) {
    return `${inactive.map((e) => e.label).join(" and ")} have not been worked on ${rangeLabel}.`;
  }

  if (inactive.length === 1) {
    return `${inactive[0].label} has not been worked on ${rangeLabel}.`;
  }

  // Balanced
  if (topShare < 0.4 && active.length >= 3) {
    return `Your work effort was distributed across multiple functions ${rangeLabel}.`;
  }

  return null;
}
