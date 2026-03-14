import { supabase } from "../../../lib/supabase";

/**
 * Fetch tasks for a specific date.
 * Ordered: non-negotiables first, then by creation time.
 */
export async function getTasksForDate(localDate) {
  const { data, error } = await supabase
    .schema("penta")
    .from("tasks")
    .select("*")
    .eq("local_date", localDate)
    .order("is_non_negotiable", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Create a new task for a date.
 */
export async function createTask({
  localDate,
  title,
  notes,
  defaultPillarKey,
  isNonNegotiable,
  workTag,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .schema("penta")
    .from("tasks")
    .insert({
      user_id: user.id,
      local_date: localDate,
      title,
      notes: notes || null,
      default_pillar_key: defaultPillarKey || null,
      is_non_negotiable: isNonNegotiable || false,
      work_tag: workTag || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Toggle a task's completed status.
 */
export async function toggleTaskComplete(taskId, completed) {
  const { error } = await supabase
    .schema("penta")
    .from("tasks")
    .update({
      is_done: completed,
      done_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) throw error;
}

/**
 * Update a task.
 */
export async function updateTask(taskId, updates) {
  const { error } = await supabase
    .schema("penta")
    .from("tasks")
    .update(updates)
    .eq("id", taskId);
  if (error) throw error;
}

/**
 * Delete a task.
 */
export async function deleteTask(taskId) {
  const { error } = await supabase
    .schema("penta")
    .from("tasks")
    .delete()
    .eq("id", taskId);
  if (error) throw error;
}

/**
 * Stamp active task templates onto a date via RPC.
 * Returns count of newly created tasks.
 */
export async function copyTemplatesToDate(localDate) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .schema("penta")
    .rpc("copy_task_templates_to_date", {
      p_user_id: user.id,
      p_local_date: localDate,
    });
  if (error) throw error;
  return data;
}
