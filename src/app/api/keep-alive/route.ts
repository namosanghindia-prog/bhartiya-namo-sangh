import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Supabase pauses Free-plan projects after 7 days with no database activity.
// This route performs a real PostgREST read so the project keeps counting as
// active. It is driven daily by the Vercel cron in vercel.json, and mirrored by
// .github/workflows/keep-alive.yml so neither scheduler is a single point of
// failure. Note that a 401 does NOT count as activity — the request has to get
// past the API gateway and actually reach the database, which is why this uses
// the anon key rather than pinging the host unauthenticated.

export async function GET(request: Request) {
  // Vercel sends `Authorization: Bearer $CRON_SECRET` on cron invocations when
  // the env var is set. Only enforce it when it exists, so the route still
  // works before the secret is configured.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase env vars are missing" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, anonKey);
  const startedAt = Date.now();
  const { error } = await supabase.from("branches").select("id").limit(1);

  if (error) {
    // Return a non-2xx so a broken keep-alive shows up as a failed cron in the
    // Vercel dashboard instead of silently reporting success.
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    pingedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  });
}
