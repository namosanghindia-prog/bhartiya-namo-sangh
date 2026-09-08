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

    // Deleting the auth user cascades to public.members, so anything still
    // pointing at that member with an ON DELETE NO ACTION foreign key refuses
    // the delete — and Supabase reports every such refusal with this one
    // opaque message. Say what it actually means; migration 017 is what
    // relaxes those constraints.
    const isConstraintFailure = /database error deleting user/i.test(
      error.message
    );

    return NextResponse.json(
      {
        error: isConstraintFailure
          ? "The database refused to delete this member, most likely because other records still reference them. Check that migration 017_allow_member_deletion.sql has been applied."
          : `Failed to delete member: ${error.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
