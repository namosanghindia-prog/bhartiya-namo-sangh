import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  LOCKOUT_MINUTES,
  MAX_FAILED_ATTEMPTS,
  verifyMpin,
} from "@/lib/mpin";

/**
 * Roles the proxy already lets into /admin. Changing your own password is a
 * self-service action, so every one of them may do it — unlike, say, deleting
 * another member, which stays with admin/super_admin.
 */
const ADMIN_ROLES = ["admin", "super_admin", "branch_admin"];

export type Failure = { failure: true; status: number; error: string };

/** Tagged so it can never be confused with a SupabaseClient by shape. */
export function fail(status: number, error: string): Failure {
  return { failure: true, status, error };
}

export function isFailure(value: unknown): value is Failure {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Partial<Failure>).failure === true
  );
}

/**
 * Confirms the request carries the session of an admin, using that session's
 * own anon-key client — never the service role, which would answer for anyone.
 */
export async function requireAdmin(): Promise<{ user: User } | Failure> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail(401, "Unauthorized");
  }

  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!member || !ADMIN_ROLES.includes(member.role)) {
    return fail(403, "Admin access required");
  }

  return { user };
}

/** Service-role client — the only thing with access to admin_security. */
export function getServiceClient(): SupabaseClient | Failure {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "[admin-security] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return fail(500, "Server configuration error");
  }

  return createServiceClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface AdminSecurityRow {
  member_id: string;
  mpin_hash: string;
  mpin_set_at: string;
  failed_attempts: number;
  locked_until: string | null;
  password_changed_at: string | null;
}

export async function getSecurityRow(
  service: SupabaseClient,
  memberId: string
): Promise<AdminSecurityRow | null> {
  const { data, error } = await service
    .from("admin_security")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  if (error) {
    console.error("[admin-security] Failed to read admin_security:", error);
    throw new Error("Could not read your security settings.");
  }

  return (data as AdminSecurityRow | null) ?? null;
}

export function lockedMinutesRemaining(row: AdminSecurityRow): number {
  if (!row.locked_until) return 0;
  const ms = new Date(row.locked_until).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 60000) : 0;
}

/**
 * Checks an MPIN against the stored hash and records the outcome.
 *
 * Six digits is small enough to guess through, so a wrong MPIN costs an
 * attempt, and running out locks the MPIN for LOCKOUT_MINUTES. A correct one
 * clears the counter. Callers must have already loaded `row`.
 */
export async function verifyMpinWithLockout(
  service: SupabaseClient,
  row: AdminSecurityRow,
  mpin: string
): Promise<Failure | null> {
  const lockedFor = lockedMinutesRemaining(row);
  if (lockedFor > 0) {
    return fail(
      429,
      `Too many incorrect MPIN attempts. Try again in ${lockedFor} minute${
        lockedFor === 1 ? "" : "s"
      }.`
    );
  }

  if (await verifyMpin(mpin, row.mpin_hash)) {
    if (row.failed_attempts !== 0 || row.locked_until) {
      await service
        .from("admin_security")
        .update({ failed_attempts: 0, locked_until: null })
        .eq("member_id", row.member_id);
    }
    return null;
  }

  const attempts = row.failed_attempts + 1;
  const lockOut = attempts >= MAX_FAILED_ATTEMPTS;

  await service
    .from("admin_security")
    .update({
      // The counter restarts with the lockout so the wait, not a dead row, is
      // what stands in the way after it expires.
      failed_attempts: lockOut ? 0 : attempts,
      locked_until: lockOut
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString()
        : null,
    })
    .eq("member_id", row.member_id);

  if (lockOut) {
    return fail(
      429,
      `Incorrect MPIN. Too many attempts — try again in ${LOCKOUT_MINUTES} minutes.`
    );
  }

  const left = MAX_FAILED_ATTEMPTS - attempts;
  return fail(
    401,
    `Incorrect MPIN. ${left} attempt${left === 1 ? "" : "s"} remaining.`
  );
}
