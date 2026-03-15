import { supabase } from "../../../lib/supabase";

/**
 * Upload a photo to Supabase Storage and record it in block_photos.
 * Returns the created photo record.
 */
export async function uploadBlockPhoto(blockId, file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ext = file.name?.split(".").pop() || "jpg";
  const path = `${user.id}/${blockId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("block-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw uploadErr;

  const {
    data: { publicUrl },
  } = supabase.storage.from("block-photos").getPublicUrl(path);

  const { data, error } = await supabase
    .schema("penta")
    .from("block_photos")
    .insert({
      block_id: blockId,
      user_id: user.id,
      storage_path: path,
      url: publicUrl,
    })
    .select()
    .single();
  if (error) throw error;

  return data;
}

/**
 * Fetch all photos for a specific time block.
 */
export async function getPhotosForBlock(blockId) {
  const { data, error } = await supabase
    .schema("penta")
    .from("block_photos")
    .select("*")
    .eq("block_id", blockId)
    .order("created_at");
  if (error) throw error;
  return data || [];
}

/**
 * Fetch all photos for multiple blocks in one query.
 */
export async function getPhotosForBlocks(blockIds) {
  if (!blockIds || blockIds.length === 0) return [];
  const { data, error } = await supabase
    .schema("penta")
    .from("block_photos")
    .select("*")
    .in("block_id", blockIds)
    .order("created_at");
  if (error) throw error;
  return data || [];
}

/**
 * Delete a photo (storage file + DB record).
 */
export async function deleteBlockPhoto(photoId, storagePath) {
  await supabase.storage.from("block-photos").remove([storagePath]);

  const { error } = await supabase
    .schema("penta")
    .from("block_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;
}
