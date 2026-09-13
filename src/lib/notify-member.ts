/**
 * Ask the server to send one of the member-facing emails.
 *
 * Deliberately quiet. Whatever the admin (or member) did has already been
 * written by the time this runs, so a mail problem must not surface as a failure
 * of the action itself — an admin would retry work that already succeeded.
 * Failures land in the console and the server log.
 *
 * Only ids are sent. The wording is assembled server-side from the database, so
 * nothing here can put text into an email.
 */

type NotifyPayload =
  | { event: "approved" | "rejected" | "activated"; memberId: string }
  | { event: "id_card_status"; orderId: string }
  | { event: "business_decision"; businessId: string };

async function post(url: string, payload: object, label: string): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[notify] ${label} failed:`, await res.text());
      return;
    }

    const result = await res.json();
    if (!result?.sent) {
      console.warn(`[notify] ${label} not sent:`, result?.reason);
    }
  } catch (err) {
    console.error(`[notify] Could not reach ${url}:`, err);
  }
}

/** Admin-triggered mail about a member, a card order or a business listing. */
export async function notifyMember(payload: NotifyPayload): Promise<void> {
  await post("/api/admin/notify-member", payload, payload.event);
}

/**
 * Member-triggered: tells the admins a membership payment is waiting to be
 * checked. Separate route because the caller here is the member, not an admin.
 */
export async function notifyPaymentSubmitted(): Promise<void> {
  await post("/api/member/payment-submitted", {}, "payment_submitted");
}
