import type { SupabaseClient } from "@supabase/supabase-js";

export const AVATAR_BUCKET = "avatars";
export const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function extensionFor(contentType: string): string {
  const sub = contentType.split("/")[1] || "jpg";
  return sub === "jpeg" ? "jpg" : sub;
}

/**
 * Upload a member's avatar and return its public URL.
 *
 * Every upload goes to a NEW path. Avatars used to be written to a fixed
 * `<member id>/avatar.<ext>`, which meant replacing a photo produced the exact
 * same public URL — so browsers, and Supabase's CDN for up to an hour
 * (Cache-Control: public, max-age=3600), kept serving the previous image and
 * the change looked like it had done nothing. A fresh path each time gives a
 * fresh URL, so a new photo shows up immediately.
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  memberId: string,
  file: Blob,
  contentType: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  const path = `${memberId}/avatar-${Date.now()}.${extensionFor(contentType)}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType, upsert: false });

  if (error) return { publicUrl: null, error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  return { publicUrl, error: null };
}

/**
 * Delete a member's previous avatars, keeping whichever file `keepUrl` points
 * at. Best effort: a member whose storage policy allows uploads but not
 * deletes simply leaves the old files behind, which is untidy but harmless, so
 * failures here must never surface as an error on a successful upload.
 */
export async function removeSupersededAvatars(
  supabase: SupabaseClient,
  memberId: string,
  keepUrl: string
): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(memberId);

    if (error || !data) return;

    const stale = data
      .map((f) => `${memberId}/${f.name}`)
      .filter((p) => !keepUrl.endsWith(p));

    if (stale.length > 0) {
      await supabase.storage.from(AVATAR_BUCKET).remove(stale);
    }
  } catch {
    // Cleanup is never worth failing the upload over.
  }
}
