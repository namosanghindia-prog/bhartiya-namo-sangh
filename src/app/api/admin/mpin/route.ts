import { NextRequest, NextResponse } from "next/server";
import { hashMpin, validateMpin } from "@/lib/mpin";
import {
  getSecurityRow,
  getServiceClient,
  isFailure,
  lockedMinutesRemaining,
  requireAdmin,
  verifyMpinWithLockout,
} from "@/lib/admin-security";

/**
 * Reports whether the signed-in admin has an MPIN, so the settings page can
 * offer "Set MPIN" or "Change MPIN". Never returns the hash itself.
 */
export async function GET() {
  const caller = await requireAdmin();
  if (isFailure(caller)) {
    return NextResponse.json({ error: caller.error }, { status: caller.status });
  }

  const service = getServiceClient();
  if (isFailure(service)) {
    return NextResponse.json({ error: service.error }, { status: service.status });
  }

  try {
    const row = await getSecurityRow(service, caller.user.id);
    return NextResponse.json({
      mpinSet: !!row,
      mpinSetAt: row?.mpin_set_at ?? null,
      passwordChangedAt: row?.password_changed_at ?? null,
      lockedMinutes: row ? lockedMinutesRemaining(row) : 0,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

/**
 * Sets the MPIN, or replaces an existing one.
 *
 * The first MPIN needs only a valid admin session. Replacing one requires the
 * current MPIN: it is the sole guard on the password change, so letting anyone
 * holding the session overwrite it would leave nothing to verify.
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
    console.error("[mpin] Failed to parse request body:", e);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { currentMpin, newMpin } = body ?? {};

  const invalid = validateMpin(newMpin);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
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

  if (row) {
    if (typeof currentMpin !== "string" || !/^\d{6}$/.test(currentMpin)) {
      return NextResponse.json(
        { error: "Enter your current 6-digit MPIN." },
        { status: 400 }
      );
    }

    const failed = await verifyMpinWithLockout(service, row, currentMpin);
    if (failed) {
      return NextResponse.json({ error: failed.error }, { status: failed.status });
    }

    if (currentMpin === newMpin) {
      return NextResponse.json(
        { error: "New MPIN must be different from your current MPIN." },
        { status: 400 }
      );
    }
  }

  const mpin_hash = await hashMpin(newMpin);

  const { error } = await service.from("admin_security").upsert(
    {
      member_id: caller.user.id,
      mpin_hash,
      mpin_set_at: new Date().toISOString(),
      failed_attempts: 0,
      locked_until: null,
    },
    { onConflict: "member_id" }
  );

  if (error) {
    console.error("[mpin] Failed to save MPIN:", error);
    return NextResponse.json({ error: "Could not save your MPIN." }, { status: 500 });
  }

  return NextResponse.json({ success: true, replaced: !!row });
}
