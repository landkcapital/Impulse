import { supabase } from "../../../lib/supabase";

/**
 * Fetch the current user's pillars, ordered by sort_order.
 */
export async function getUserPillars() {
  const { data, error } = await supabase
    .schema("penta")
    .from("pillars")
    .select("id, key, name, colour, sort_order, is_active")
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

/**
 * Get the total points per pillar for a given local_date.
 * Joins block_pillar_points → time_blocks to sum points grouped by pillar.
 *
 * Returns: { [pillar_id]: totalPoints }
 */
export async function getDailyPillarPoints(localDate) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch all time blocks for the date, then their pillar point splits
  const { data: blocks, error: blocksErr } = await supabase
    .schema("penta")
    .from("time_blocks")
    .select("id")
    .eq("user_id", user.id)
    .eq("local_date", localDate);
  if (blocksErr) throw blocksErr;

  if (!blocks || blocks.length === 0) {
    return {};
  }

  const blockIds = blocks.map((b) => b.id);

  const { data: points, error: pointsErr } = await supabase
    .schema("penta")
    .from("block_pillar_points")
    .select("pillar_id, points")
    .in("block_id", blockIds);
  if (pointsErr) throw pointsErr;

  const totals = {};
  for (const row of points || []) {
    totals[row.pillar_id] = (totals[row.pillar_id] || 0) + row.points;
  }
  return totals;
}

/**
 * Get the total points per pillar for a date range (inclusive).
 *
 * Returns: { [pillar_id]: totalPoints }
 */
export async function getPillarTotalsForRange(startDate, endDate) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: blocks, error: blocksErr } = await supabase
    .schema("penta")
    .from("time_blocks")
    .select("id")
    .eq("user_id", user.id)
    .gte("local_date", startDate)
    .lte("local_date", endDate);
  if (blocksErr) throw blocksErr;

  if (!blocks || blocks.length === 0) {
    return {};
  }

  const blockIds = blocks.map((b) => b.id);

  const { data: points, error: pointsErr } = await supabase
    .schema("penta")
    .from("block_pillar_points")
    .select("pillar_id, points")
    .in("block_id", blockIds);
  if (pointsErr) throw pointsErr;

  const totals = {};
  for (const row of points || []) {
    totals[row.pillar_id] = (totals[row.pillar_id] || 0) + row.points;
  }
  return totals;
}

/**
 * Get work tag totals for a date range (inclusive).
 *
 * Returns: { [work_tag]: totalMinutes }
 */
export async function getWorkTagTotalsForRange(startDate, endDate) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: blocks, error } = await supabase
    .schema("penta")
    .from("time_blocks")
    .select("work_tag, total_points")
    .eq("user_id", user.id)
    .gte("local_date", startDate)
    .lte("local_date", endDate)
    .not("work_tag", "is", null);
  if (error) throw error;

  const totals = {};
  for (const block of blocks || []) {
    totals[block.work_tag] = (totals[block.work_tag] || 0) + block.total_points;
  }
  return totals;
}

/**
 * Get time totals grouped by work_tag for a given date.
 * Only counts time blocks that have a work_tag set.
 *
 * Returns: { [work_tag]: totalMinutes }
 */
export async function getDailyWorkTagTotals(localDate) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: blocks, error } = await supabase
    .schema("penta")
    .from("time_blocks")
    .select("work_tag, total_points")
    .eq("user_id", user.id)
    .eq("local_date", localDate)
    .not("work_tag", "is", null);
  if (error) throw error;

  const totals = {};
  for (const block of blocks || []) {
    totals[block.work_tag] = (totals[block.work_tag] || 0) + block.total_points;
  }
  return totals;
}
