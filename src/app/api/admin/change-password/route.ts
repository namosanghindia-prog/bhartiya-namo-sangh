import { NextRequest, NextResponse } from "next/server";
import {
  getSecurityRow,
  getServiceClient,
  isFailure,
  requireAdmin,
  verifyMpinWithLockout,
} from "@/lib/admin-security";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Changes the signed-in admin's own password.
 *
 * The current password is deliberately not asked for; the 6-digit MPIN is what
 * verifies the request instead. The write goes through the service role rather
 * than the caller's session so it behaves the same whether or not Supabase's
 * secure-password-change (reauthentication) setting is switched on.
 */
export async function POST(request: NextRequest) {
  const caller = await requireAdmin();
  if (isFailure(caller)) {
    return NextResponse.json({ error: caller.error }, { status: caller.status });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error("[change-password] Failed to parse request body:", e);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { mpin, newPassword } = body ?? {};

  if (typeof mpin !== "string" || !/^\d{6}$/.test(mpin)) {
    return NextResponse.json(
      { error: "Enter your 6-digit MPIN." },
      { status: 400 }
    );
  }

  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const service = getServiceClient();
  if (isFailure(service)) {
    return NextResponse.json({ error: service.error }, { status: service.status });
  }

  let row;
  try {
    row = await getSecurityRow(service, caller.user.id);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 }
    );
  }

  if (!row) {
    return NextResponse.json(
      { error: "Set your 6-digit MPIN before changing your password." },
      { status: 400 }
    );
  }

  const failed = await verifyMpinWithLockout(service, row, mpin);
  if (failed) {
    return NextResponse.json({ error: failed.error }, { status: failed.status });
  }

  const { error } = await service.auth.admin.updateUserById(caller.user.id, {
    password: newPassword,
  });

  if (error) {
    console.error("[change-password] Failed to update password:", error.message);
    return NextResponse.json(
      { error: error.message || "Could not update your password." },
      { status: 500 }
    );
  }

  await service
    .from("admin_security")
    .update({ password_changed_at: new Date().toISOString() })
    .eq("member_id", caller.user.id);

  return NextResponse.json({ success: true });
}
