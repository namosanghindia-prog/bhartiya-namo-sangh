import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { postLoginPath } from "@/lib/post-login";

const INVALID = { error: "invalid" } as const;

function looksLikeEmail(value: string) {
  return value.includes("@") && value.includes(".");
}

async function emailForIdentifier(identifier: string): Promise<string | null> {
  const value = identifier.trim();
  if (looksLikeEmail(value)) return value.toLowerCase();

  const digits = value.replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;

  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from("members")
    .select("email")
    .or(`phone.eq.+91${digits},phone.eq.${digits},phone.eq.91${digits}`)
    .limit(1)
    .maybeSingle();

  return data?.email ?? null;
}

export async function POST(request: Request) {
  let identifier = "";
  let password = "";
  let requested: string | null = null;
  try {
    const body = await request.json();
    identifier = String(body?.identifier ?? "");
    password = String(body?.password ?? "");
    requested = body?.redirect ? String(body.redirect) : null;
  } catch {
    return NextResponse.json(INVALID, { status: 401 });
  }

  if (!identifier.trim() || !password) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const email = await emailForIdentifier(identifier);
  if (!email) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Cookie writes can throw in some Next.js contexts.
        }
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    let member = null;
    if (userId) {
      const { data } = await supabase
        .from("members")
        .select("status, role, declaration_accepted")
        .eq("id", userId)
        .maybeSingle();
      member = data;
    }
    return NextResponse.json({ ok: true, next: postLoginPath(member, requested) });
  }

  const msg = error.message.toLowerCase();
  if (msg.includes("too many requests") || error.status === 429) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429 }
    );
  }
  if (msg.includes("email not confirmed")) {
    return NextResponse.json({ error: "unverified" }, { status: 403 });
  }
  return NextResponse.json(INVALID, { status: 401 });
}
