import { supabase } from "../../../lib/supabase";

/**
 * Fetch all sub-pillars for the current user, ordered by pillar_key then sort_order.
 */
export async function getSubPillars() {
  const { data, error } = await supabase
    .schema("penta")
    .from("sub_pillars")
    .select("*")
    .order("pillar_key")
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

/**
 * Create a new sub-pillar.
 */
export async function createSubPillar({ pillarKey, key, label, colour }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .schema("penta")
    .from("sub_pillars")
    .insert({
      user_id: user.id,
      pillar_key: pillarKey,
      key,
      label,
      colour: colour || null,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update a sub-pillar.
 */
export async function updateSubPillar(id, updates) {
  const payload = {};
  if (updates.label !== undefined) payload.label = updates.label;
  if (updates.colour !== undefined) payload.colour = updates.colour;
  if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  const { data, error } = await supabase
    .schema("penta")
    .from("sub_pillars")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a sub-pillar.
 */
export async function deleteSubPillar(id) {
  const { error } = await supabase
    .schema("penta")
    .from("sub_pillars")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
