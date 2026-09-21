import { createClient } from "@/lib/supabase/server";
import { postLoginPath } from "@/lib/post-login";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (type === "signup" || type === "email") {
        return NextResponse.redirect(`${origin}/auth/verified`);
      }

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
      const next = postLoginPath(member, redirect);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
