import { supabase } from "../../../lib/supabase";

/**
 * Fetch the current user's Penta profile.
 * Returns null if no profile exists yet.
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
 * Update the current user's Penta profile.
 */
export async function updateProfile(updates) {
  const { error } = await supabase
    .schema("penta")
    .from("profiles")
    .update(updates)
    .eq("user_id", (await supabase.auth.getUser()).data.user.id);
  if (error) throw error;
}

/**
 * Idempotent first-time setup: creates profile + 5 default pillars.
 * Safe to call on every Penta visit — no-ops if already set up.
 */
export async function initializePentaUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .schema("penta")
    .rpc("ensure_profile_and_default_pillars", { p_user_id: user.id });
  if (error) throw error;
}
