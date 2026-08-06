import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  if (!user && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // For authenticated users accessing dashboard, check member status
  if (user && path.startsWith("/dashboard") && !path.startsWith("/dashboard/account-status")) {
    const { data: member } = await supabase
      .from("members")
      .select("status, role")
      .eq("id", user.id)
      .single();

    if (member) {
      if (member.status === "pending") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/account-status";
        url.searchParams.set("status", "pending");
        return NextResponse.redirect(url);
      }
      if (member.status === "suspended") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/account-status";
        url.searchParams.set("status", "suspended");
        return NextResponse.redirect(url);
      }
      if (member.status === "inactive") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/account-status";
        url.searchParams.set("status", "inactive");
        return NextResponse.redirect(url);
      }
      if (member.status === "approved_awaiting_payment") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/account-status";
        url.searchParams.set("status", "approved_awaiting_payment");
        return NextResponse.redirect(url);
      }
    }
  }

  // For admin routes, also verify the user has admin role
  if (user && path.startsWith("/admin")) {
    const { data: member } = await supabase
      .from("members")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!member || !["admin", "super_admin", "branch_admin"].includes(member.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages (except reset-password and callback)
  if (user && path.startsWith("/auth") && !path.includes("/reset-password") && !path.includes("/callback")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
