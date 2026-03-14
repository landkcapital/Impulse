/**
 * Generate a short, neutral balance summary sentence.
 *
 * Rules:
 * - Never judgemental
 * - Never gamified
 * - Never uses scores or numbers
 * - Simple English, 1 sentence only
 */
export function generateBalanceSummary(pillars, pillarTotals) {
  const active = pillars.filter((p) => p.is_active);
  if (active.length === 0) return "";

  const totalMinutes = active.reduce(
    (sum, p) => sum + (pillarTotals[p.id] || 0),
    0
  );

  if (totalMinutes === 0) {
    return "No time has been logged today yet.";
  }

  // Build sorted list of pillars by points
  const ranked = active
    .map((p) => ({ name: p.name, points: pillarTotals[p.id] || 0 }))
    .sort((a, b) => b.points - a.points);

  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const topShare = top.points / totalMinutes;

  // Check how many pillars have zero
  const zeroPillars = ranked.filter((p) => p.points === 0);
  const activePillars = ranked.filter((p) => p.points > 0);

  // Only one pillar has points
  if (activePillars.length === 1) {
    return `Today has been focused entirely on ${top.name}.`;
  }

  // Check if fairly balanced (no pillar exceeds 35% of total)
  const isBalanced = ranked.every(
    (p) => p.points / totalMinutes <= 0.35 && p.points / totalMinutes >= 0.1
  );

  if (isBalanced) {
    return "Today was fairly balanced across your pillars.";
  }

  // Heavily weighted toward one pillar (>50%)
  if (topShare > 0.5) {
    if (zeroPillars.length >= 2) {
      const zeroNames = zeroPillars.map((p) => p.name);
      const last = zeroNames.pop();
      return `Today leaned heavily toward ${top.name}, while ${zeroNames.join(", ")} and ${last} haven't had attention yet.`;
    }
    return `Today leaned heavily toward ${top.name}.`;
  }

  // Some pillars got nothing
  if (zeroPillars.length === 1) {
    return `${zeroPillars[0].name} hasn't received any attention today.`;
  }

  if (zeroPillars.length >= 2) {
    const zeroNames = zeroPillars.map((p) => p.name);
    const last = zeroNames.pop();
    return `${zeroNames.join(", ")} and ${last} haven't received attention today.`;
  }

  // Default: mild lean
  return `Today leaned toward ${top.name}, with less time on ${bottom.name}.`;
}
