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
