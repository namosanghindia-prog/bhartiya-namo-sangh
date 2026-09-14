/**
 * Temporary moderator access (migration 023). A member requests it from their
 * dashboard, an admin approves it for a fixed period, and while it lasts the
 * member can view every public event registration.
 *
 * The database is the authority — is_moderator() gates the rows. These helpers
 * only decide what to show.
 */

export type ModeratorRequestStatus = "pending" | "approved" | "rejected" | "revoked";

export interface ModeratorRequest {
  id: string;
  member_id: string;
  reason: string;
  status: ModeratorRequestStatus;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

/** How long an admin can grant access for. */
export const MODERATOR_DURATIONS = [
  { days: 1, label: "1 day" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
] as const;

export const DEFAULT_MODERATOR_DAYS = 7;

export const MODERATOR_REASON_MAX = 500;

export function isActiveGrant(req: Pick<ModeratorRequest, "status" | "expires_at">): boolean {
  return (
    req.status === "approved" &&
    req.expires_at !== null &&
    new Date(req.expires_at).getTime() > Date.now()
  );
}

export function isExpiredGrant(req: Pick<ModeratorRequest, "status" | "expires_at">): boolean {
  return req.status === "approved" && !isActiveGrant(req);
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
