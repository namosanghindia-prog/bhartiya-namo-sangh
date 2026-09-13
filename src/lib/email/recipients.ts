import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Where admin alerts go.
 *
 * ADMIN_EMAIL wins when it is set — a shared inbox is usually a better target
 * than whatever address happens to be on the public contact page. Otherwise it
 * falls back to organization_settings.primary_email, which an admin already
 * maintains through the settings screen, so the alerts work out of the box with
 * nothing but the Resend key.
 *
 * Returns null when neither exists, and the caller skips the send.
 */
export async function adminNotificationAddress(
  supabase: SupabaseClient
): Promise<string | null> {
  const explicit = process.env.ADMIN_EMAIL?.trim();
  if (explicit) return explicit;

  const { data, error } = await supabase
    .from("organization_settings")
    .select("primary_email")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("[email] Could not read the org contact address:", error);
    return null;
  }

  return data?.primary_email?.trim() || null;
}

/**
 * Public URL of the National President's photograph, for the signature block of
 * the welcome message.
 *
 * Read from his member record rather than a constant, because avatar uploads
 * write a new path every time and delete the one they replace — a hardcoded
 * storage URL would break the first time he changes his photo. The avatars
 * bucket is public (migration 016), so the URL needs no signing and a mail
 * client can fetch it.
 *
 * Identified the way the rest of the app does it: the member whose designation
 * is exactly "president". Matching is case-insensitive and whitespace-tolerant,
 * since designations are free text typed by members — the same reason
 * DESIGNATION_RANK in member-order.ts normalises before comparing. The wildcard
 * query pulls the vice-presidents and state presidents too, so the exact match
 * happens here.
 *
 * Returns null when there is no such member or no photo, and the caller simply
 * leaves the photograph out.
 */
export async function presidentPhotoUrl(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase
    .from("members")
    .select("designation, avatar_url")
    .ilike("designation", "%president%")
    .not("avatar_url", "is", null);

  if (error) {
    console.error("[email] Could not read the president's photo:", error);
    return null;
  }

  const president = (data ?? []).find(
    (m) => (m.designation ?? "").trim().toLowerCase() === "president"
  );

  return president?.avatar_url ?? null;
}
