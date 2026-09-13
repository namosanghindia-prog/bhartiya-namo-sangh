import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client, bypassing RLS.
 *
 * For server code that must read or update rows the anonymous visitor it is
 * acting for cannot — e.g. only admins may read or write
 * public_event_registrations, yet the public register route has to store a
 * registration and hand back its number, and the verification page has to look
 * one up.
 * Callers are responsible for exposing only the columns they mean to.
 *
 * Returns null when the key is not configured, so the caller can answer with a
 * clean error instead of throwing.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "[supabase/service] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return null;
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
