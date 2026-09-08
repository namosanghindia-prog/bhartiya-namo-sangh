import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerMember } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin =
    callerMember?.role === "admin" || callerMember?.role === "super_admin";

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error("[delete-member] Failed to parse request body:", e);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { memberId } = body;

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 }
    );
  }

  if (memberId === user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey) {
    console.error("[delete-member] SUPABASE_SERVICE_ROLE_KEY is not configured");
    return NextResponse.json(
      { error: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set" },
      { status: 500 }
    );
  }

  if (!supabaseUrl) {
    console.error("[delete-member] NEXT_PUBLIC_SUPABASE_URL is not configured");
    return NextResponse.json(
      { error: "Server configuration error: NEXT_PUBLIC_SUPABASE_URL not set" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let { error } = await supabaseAdmin.auth.admin.deleteUser(memberId);

  if (error) {
    // The straightforward order is to delete the auth user and let the
    // cascade carry the member row away with it. That is what keeps failing:
    // GoTrue deletes auth.users as supabase_auth_admin, so the cascade fires
    // the AFTER triggers on members as *that* role, which has no rights on
    // branches or badges — Postgres refuses and GoTrue reports an error that
    // stringifies to nothing.
    //
    // The service role does have those rights. Removing the profile row here
    // first means the cascade has no member row left to touch and no trigger
    // to run, so the retry goes through. Retrying the whole request is safe:
    // deleting an already-deleted row is not an error.
    console.warn(
      "[delete-member] Cascade delete refused, removing profile row first:",
      error.message
    );

    const { error: profileError } = await supabaseAdmin
      .from("members")
      .delete()
      .eq("id", memberId);

    if (profileError) {
      console.error("[delete-member] Could not delete profile row:", {
        memberId,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
      });
      return NextResponse.json(
        {
          error: `Could not delete this member's profile: ${profileError.message}`,
        },
        { status: 500 }
      );
    }

    ({ error } = await supabaseAdmin.auth.admin.deleteUser(memberId));
  }

  if (error) {
    console.error("[delete-member] Failed to delete auth user:", {
      memberId,
      message: error.message,
      status: error.status,
      name: error.name,
    });

    // Deleting the auth user cascades to public.members, and the database can
    // refuse that cascade in two ways: a foreign key that still points at the
    // member (migration 017), or an AFTER trigger on members that the auth
    // service's own role is not allowed to run (migration 018). GoTrue reports
    // both of them uselessly — "Database error deleting user", or an error
    // that stringifies to nothing at all — so name the real suspects rather
    // than passing the noise through.
    const detail = error.message?.trim();
    const isOpaqueDbFailure =
      !detail || detail === "{}" || /database error deleting user/i.test(detail);

    return NextResponse.json(
      {
        error: isOpaqueDbFailure
          ? "The member's profile was removed, but their login account could not be deleted. Something outside the members table still references it — check the Postgres logs for the exact constraint."
          : `Failed to delete member: ${detail}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
