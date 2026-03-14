import { supabase } from "../../../lib/supabase";

/**
 * Fetch the current user's Penta profile.
 */
export async function getProfile() {
  const { data, error } = await supabase
    .schema("penta")
    .from("profiles")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Update profile fields.
 */
export async function updateProfile(updates) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .schema("penta")
    .from("profiles")
    .update(updates)
    .eq("user_id", user.id);
  if (error) throw error;
}

/**
 * Fetch all task templates for the current user.
 */
export async function getTaskTemplates() {
  const { data, error } = await supabase
    .schema("penta")
    .from("task_templates")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return data || [];
}

/**
 * Create a new task template.
 */
export async function createTaskTemplate({
  title,
  defaultPillarKey,
  workTag,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .schema("penta")
    .from("task_templates")
    .insert({
      user_id: user.id,
      title,
      default_pillar_key: defaultPillarKey || null,
      work_tag: workTag || null,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update a task template.
 */
export async function updateTaskTemplate(templateId, updates) {
  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.defaultPillarKey !== undefined)
    payload.default_pillar_key = updates.defaultPillarKey || null;
  if (updates.workTag !== undefined)
    payload.work_tag = updates.workTag || null;

  const { data, error } = await supabase
    .schema("penta")
    .from("task_templates")
    .update(payload)
    .eq("id", templateId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a task template.
 */
export async function deleteTaskTemplate(templateId) {
  const { error } = await supabase
    .schema("penta")
    .from("task_templates")
    .delete()
    .eq("id", templateId);
  if (error) throw error;
}
