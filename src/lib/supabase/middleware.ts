import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Every Supabase call in the proxy runs against a hard deadline.
 *
 * Vercel kills a middleware invocation at 25s with MIDDLEWARE_INVOCATION_TIMEOUT,
 * so without a deadline any Supabase slowdown — or a paused free-tier project —
 * turns into a 504 on every protected route instead of a handled error. Failing
 * in a few seconds and deciding what to do ourselves is strictly better than
 * hanging until the gateway gives up.
 */
const SUPABASE_TIMEOUT_MS = 4000;

/** Resolves to null instead of hanging or throwing past the deadline. */
async function withDeadline<T>(promise: PromiseLike<T>, label: string): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          console.error(`[proxy] ${label} exceeded ${SUPABASE_TIMEOUT_MS}ms`);
          resolve(null);
        }, SUPABASE_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    console.error(`[proxy] ${label} failed:`, err);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/admin");

  const authResult = await withDeadline(supabase.auth.getUser(), "auth.getUser");

  // Auth backend did not answer in time. Fail closed on protected routes with a
  // fast redirect; let public /auth pages render so the user sees the login form
  // (and its own error) rather than a gateway timeout.
  if (authResult === null) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", path);
      url.searchParams.set("error", "unavailable");
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const user = authResult.data.user;

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // For authenticated users accessing dashboard, check member status
  if (user && path.startsWith("/dashboard") && !path.startsWith("/dashboard/account-status")) {
    const result = await withDeadline(
      supabase.from("members").select("status, role").eq("id", user.id).single(),
      "members.status"
    );
    const member = result?.data;

    // On a timeout `member` is undefined and we fall through to the dashboard.
    // The page's own queries still run under RLS, so this cannot expose data —
    // at worst a member sees a shell they would have been redirected away from.
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
    const result = await withDeadline(
      supabase.from("members").select("role").eq("id", user.id).single(),
      "members.role"
    );

    // Unlike the status check above, this one fails closed: a timeout must not
    // hand out the admin area, so an unverified role goes back to /dashboard.
    const member = result?.data;
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
