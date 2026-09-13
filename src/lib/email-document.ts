/**
 * Hands a freshly rendered PDF to the server so it can be emailed to the member.
 *
 * Unlike the other notify helpers this one reports back rather than failing
 * quietly: an admin has pressed a button whose only purpose is to send this
 * email, so they need to know whether it went.
 */
export type DocumentKind = "id_card" | "appointment_letter";

export interface EmailDocumentResult {
  sent: boolean;
  to?: string;
  reason?: string;
}

export async function emailDocumentToMember(
  memberId: string,
  kind: DocumentKind,
  pdf: Blob
): Promise<EmailDocumentResult> {
  try {
    const payload = new FormData();
    payload.set("memberId", memberId);
    payload.set("kind", kind);
    payload.set("file", pdf, "document.pdf");

    const res = await fetch("/api/admin/email-document", {
      method: "POST",
      body: payload,
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return { sent: false, reason: body?.error ?? `Request failed (${res.status})` };
    }

    return {
      sent: Boolean(body?.sent),
      to: body?.to,
      reason: body?.reason,
    };
  } catch (err) {
    console.error("[email-document] Could not reach the send endpoint:", err);
    return { sent: false, reason: "Could not reach the server" };
  }
}
