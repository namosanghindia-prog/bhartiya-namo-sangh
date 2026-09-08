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

  const { error } = await supabaseAdmin.auth.admin.deleteUser(memberId);

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
          ? "The database refused to delete this member. This is usually a record still referencing them, or a trigger the auth service cannot run — check that migrations 017_allow_member_deletion.sql and 018_member_triggers_security_definer.sql have both been applied, then see the Postgres logs for the exact cause."
          : `Failed to delete member: ${detail}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
