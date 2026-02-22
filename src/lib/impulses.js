import { supabase } from "./supabase";

export async function fetchGoals() {
  const { data, error } = await supabase
    .from("impulse_goals")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function createGoal({ title, imageFile }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: goal, error } = await supabase
    .from("impulse_goals")
    .insert({ title, user_id: user.id })
    .select()
    .single();
  if (error) throw error;

  if (imageFile) {
    const ext = imageFile.name.split(".").pop();
    const path = `${goal.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("goal-images")
      .upload(path, imageFile, { upsert: true });
    if (uploadErr) throw uploadErr;
    const { data: urlData } = supabase.storage
      .from("goal-images")
      .getPublicUrl(path);
    await supabase
      .from("impulse_goals")
      .update({ image_url: urlData.publicUrl })
      .eq("id", goal.id);
    goal.image_url = urlData.publicUrl;
  }

  return goal;
}

export async function updateGoal(id, { title, imageFile }) {
  const payload = { title };

  if (imageFile) {
    const ext = imageFile.name.split(".").pop();
    const path = `${id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("goal-images")
      .upload(path, imageFile, { upsert: true });
    if (uploadErr) throw uploadErr;
    const { data: urlData } = supabase.storage
      .from("goal-images")
      .getPublicUrl(path);
    payload.image_url = urlData.publicUrl;
  }

  const { error } = await supabase
    .from("impulse_goals")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGoal(id) {
  const { error } = await supabase.from("impulse_goals").delete().eq("id", id);
  if (error) throw error;
}

export async function logImpulse({
  goalId,
  description,
  impulseType,
  actedOn,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("impulses")
    .insert({
      user_id: user.id,
      goal_id: goalId,
      description,
      impulse_type: impulseType,
      acted_on: actedOn,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateImpulse(id, { description, impulseType, actedOn }) {
  const payload = {};
  if (description !== undefined) payload.description = description;
  if (impulseType !== undefined) payload.impulse_type = impulseType;
  if (actedOn !== undefined) payload.acted_on = actedOn;

  const { error } = await supabase.from("impulses").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteImpulse(id) {
  const { error } = await supabase.from("impulses").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchImpulses({ from, to } = {}) {
  let query = supabase
    .from("impulses")
    .select("*, impulse_goals(title, image_url)")
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchTodayImpulses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return fetchImpulses({
    from: today.toISOString(),
    to: tomorrow.toISOString(),
  });
}

export function computeScores(impulses) {
  let good = 0;
  let bad = 0;

  for (const imp of impulses) {
    const isPositive = imp.impulse_type === "positive";
    const acted = imp.acted_on;

    if ((isPositive && acted) || (!isPositive && !acted)) {
      good++;
    } else {
      bad++;
    }
  }

  return { good, bad };
}

export async function fetchSettings() {
  const { data, error } = await supabase
    .from("impulse_settings")
    .select("*")
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function upsertSettings(accentColor) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("impulse_settings").upsert(
    {
      user_id: user.id,
      accent_color: accentColor,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
