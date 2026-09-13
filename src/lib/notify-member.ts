/**
 * Ask the server to email a member about a decision an admin just made.
 *
 * Deliberately quiet. The status change has already been written by the time
 * this runs, so a mail problem must not surface as a failure of the approval
 * itself — the admin would retry work that already succeeded. Failures land in
 * the console and the server log.
 */
export async function notifyMember(
  memberId: string,
  event: "approved" | "activated"
): Promise<void> {
  try {
    const res = await fetch("/api/admin/notify-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, event }),
    });

    if (!res.ok) {
      console.error(`[notify] ${event} email failed:`, await res.text());
      return;
    }

    const result = await res.json();
    if (!result?.sent) {
      console.warn(`[notify] ${event} email not sent:`, result?.reason);
    }
  } catch (err) {
    console.error(`[notify] Could not reach the notify endpoint:`, err);
  }
}
