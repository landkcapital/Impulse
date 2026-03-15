import { supabase } from "../../../lib/supabase";

// ─── Roles ───

export async function getBusinessRoles() {
  const { data, error } = await supabase
    .schema("penta")
    .from("business_roles")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createBusinessRole({ name, colour, description }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get next sort order
  const { data: existing } = await supabase
    .schema("penta")
    .from("business_roles")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .schema("penta")
    .from("business_roles")
    .insert({
      user_id: user.id,
      name,
      colour: colour || "#6366f1",
      description: description || null,
      sort_order: nextOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBusinessRole(roleId, updates) {
  const { error } = await supabase
    .schema("penta")
    .from("business_roles")
    .update(updates)
    .eq("id", roleId);
  if (error) throw error;
}

export async function deleteBusinessRole(roleId) {
  const { error } = await supabase
    .schema("penta")
    .from("business_roles")
    .delete()
    .eq("id", roleId);
  if (error) throw error;
}

// ─── Role Tasks ───

export async function getBusinessTasks(roleId) {
  const { data, error } = await supabase
    .schema("penta")
    .from("business_tasks")
    .select("*")
    .eq("role_id", roleId)
    .order("is_done", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllBusinessTasks() {
  const { data, error } = await supabase
    .schema("penta")
    .from("business_tasks")
    .select("*")
    .order("is_done", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBusinessTask({ roleId, title, dueDate }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .schema("penta")
    .from("business_tasks")
    .insert({
      user_id: user.id,
      role_id: roleId,
      title,
      due_date: dueDate || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleBusinessTask(taskId, isDone) {
  const { error } = await supabase
    .schema("penta")
    .from("business_tasks")
    .update({
      is_done: isDone,
      done_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) throw error;
}

export async function deleteBusinessTask(taskId) {
  const { error } = await supabase
    .schema("penta")
    .from("business_tasks")
    .delete()
    .eq("id", taskId);
  if (error) throw error;
}
