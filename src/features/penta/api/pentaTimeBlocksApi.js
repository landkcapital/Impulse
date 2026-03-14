import { supabase } from "../../../lib/supabase";

/**
 * Fetch the most recent time block for the user today.
 * Returns null if no blocks exist today.
 */
export async function getLastTimeBlock(localDate) {
  const { data, error } = await supabase
    .schema("penta")
    .from("time_blocks")
    .select("id, end_at")
    .eq("local_date", localDate)
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Fetch time blocks for a specific date, with their pillar point splits.
 */
export async function getTimeBlocksForDate(localDate) {
  const { data, error } = await supabase
    .schema("penta")
    .from("time_blocks")
    .select("*, block_pillar_points(pillar_id, points)")
    .eq("local_date", localDate)
    .order("start_at");
  if (error) throw error;
  return data || [];
}

/**
 * Create a new time block with pillar point splits.
 */
export async function createTimeBlock({
  startAt,
  endAt,
  localDate,
  summary,
  taskId,
  totalPoints,
  pillarPoints,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: block, error: blockErr } = await supabase
    .schema("penta")
    .from("time_blocks")
    .insert({
      user_id: user.id,
      start_at: startAt,
      end_at: endAt,
      local_date: localDate,
      summary,
      task_id: taskId || null,
      total_points: totalPoints || 0,
    })
    .select()
    .single();
  if (blockErr) throw blockErr;

  // Insert pillar point splits if provided
  if (pillarPoints && pillarPoints.length > 0) {
    const rows = pillarPoints.map((pp) => ({
      block_id: block.id,
      pillar_id: pp.pillarId,
      points: pp.points,
    }));

    const { error: pointsErr } = await supabase
      .schema("penta")
      .from("block_pillar_points")
      .insert(rows);
    if (pointsErr) throw pointsErr;
  }

  return block;
}

/**
 * Create a time block with pillar point allocations in one call.
 * Note: Supabase JS client does not support multi-table transactions,
 * so the block insert and points insert are two sequential calls.
 * If the points insert fails, the block will exist without points —
 * this is acceptable for Phase 1; a server-side function can be
 * added later for true transactional guarantees.
 */
export async function createTimeBlockWithPoints({
  startAt,
  endAt,
  localDate,
  summary,
  taskId,
  totalPoints,
  pillarAllocations,
  workTag,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: block, error: blockErr } = await supabase
    .schema("penta")
    .from("time_blocks")
    .insert({
      user_id: user.id,
      start_at: startAt,
      end_at: endAt,
      local_date: localDate,
      summary,
      task_id: taskId || null,
      total_points: totalPoints,
      work_tag: workTag || null,
    })
    .select()
    .single();
  if (blockErr) throw blockErr;

  if (pillarAllocations && pillarAllocations.length > 0) {
    const rows = pillarAllocations.map((a) => ({
      block_id: block.id,
      pillar_id: a.pillarId,
      points: a.points,
    }));

    const { error: pointsErr } = await supabase
      .schema("penta")
      .from("block_pillar_points")
      .insert(rows);
    if (pointsErr) throw pointsErr;
  }

  return block;
}

/**
 * Update a time block.
 */
export async function updateTimeBlock(blockId, updates) {
  const { error } = await supabase
    .schema("penta")
    .from("time_blocks")
    .update(updates)
    .eq("id", blockId);
  if (error) throw error;
}

/**
 * Delete a time block (cascades to block_pillar_points).
 */
export async function deleteTimeBlock(blockId) {
  const { error } = await supabase
    .schema("penta")
    .from("time_blocks")
    .delete()
    .eq("id", blockId);
  if (error) throw error;
}
