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

  // Debug logging (server-side only)
  console.log("[delete-member] Attempting to delete user:", memberId);
  console.log("[delete-member] SUPABASE_SERVICE_ROLE_KEY defined:", !!serviceRoleKey);
  console.log("[delete-member] SUPABASE_SERVICE_ROLE_KEY starts with:", serviceRoleKey?.substring(0, 15) + "...");
  console.log("[delete-member] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);

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

  console.log("[delete-member] Calling auth.admin.deleteUser...");

  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(memberId);

  console.log("[delete-member] deleteUser response - data:", JSON.stringify(data));
  console.log("[delete-member] deleteUser response - error:", JSON.stringify(error));

  if (error) {
    console.error("[delete-member] Failed to delete auth user. Full error object:", {
      message: error.message,
      status: error.status,
      name: error.name,
      cause: error.cause,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: `Failed to delete member: ${error.message}`,
        details: {
          status: error.status,
          name: error.name,
        }
      },
      { status: 500 }
    );
  }

  console.log("[delete-member] Successfully deleted auth user:", memberId);
  return NextResponse.json({ success: true });
}
