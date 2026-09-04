import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Anonymous, cookie-free Supabase client for reading public (RLS-readable)
// data during a server render.
//
// Deliberately not the cookie-backed client from ./server: reading cookies()
// opts a page out of static rendering, and a page that only shows public data
// should stay prerenderable and revalidate on a timer instead.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
