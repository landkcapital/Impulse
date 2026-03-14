import { supabase } from "../../../lib/supabase";

/**
 * Fetch time blocks for a date with pillar point allocations.
 * Returns blocks ordered by start_at, each with nested block_pillar_points.
 */
export async function getReviewBlocks(localDate) {
  const { data, error } = await supabase
    .schema("penta")
    .from("time_blocks")
    .select(
      "id, start_at, end_at, summary, task_id, total_points, block_pillar_points(pillar_id, points)"
    )
    .eq("local_date", localDate)
    .order("start_at");
  if (error) throw error;
  return data || [];
}

/**
 * Fetch the daily review for a given date.
 * Returns null if no review exists yet.
 */
export async function getDailyReview(localDate) {
  const { data, error } = await supabase
    .schema("penta")
    .from("daily_reviews")
    .select("*")
    .eq("local_date", localDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Create or update the daily review for a date.
 * Uses upsert on the (user_id, local_date) unique constraint.
 */
export async function upsertDailyReview({
  localDate,
  reflectionText,
  tomorrowIntentText,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .schema("penta")
    .from("daily_reviews")
    .upsert(
      {
        user_id: user.id,
        local_date: localDate,
        reflection_text: reflectionText || null,
        tomorrow_intent_text: tomorrowIntentText || null,
      },
      { onConflict: "user_id,local_date" }
    );
  if (error) throw error;
}
