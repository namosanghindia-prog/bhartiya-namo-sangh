export type PostLoginMember = {
  status: string | null;
  role: string | null;
  declaration_accepted: boolean | null;
};

function safeInternalPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) return null;
  if (path.startsWith("/auth/login") || path.startsWith("/auth/signup")) return null;
  return path;
}

/**
 * Where a signed-in member should go.
 * Incomplete or blocked accounts go to their status page.
 * Everyone else continues to the requested path, or /dashboard.
 */
export function postLoginPath(
  member: PostLoginMember | null,
  requested?: string | null
): string {
  const requestedPath = safeInternalPath(requested);

  if (member) {
    if (member.status === "pending" && !member.declaration_accepted) {
      return "/auth/complete-application";
    }
    if (member.status === "pending") {
      return "/dashboard/account-status?status=pending";
    }
    if (member.status === "suspended") {
      return "/dashboard/account-status?status=suspended";
    }
    if (member.status === "inactive") {
      return "/dashboard/account-status?status=inactive";
    }
    if (member.status === "approved_awaiting_payment") {
      return "/dashboard/account-status?status=approved_awaiting_payment";
    }
  }

  return requestedPath || "/dashboard";
}
